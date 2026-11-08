import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { inTransaction, pool } from '../config/database.js';
import { AppError } from '../errors/AppError.js';
import type { OrdemItemInput, OrdemStatus } from '../entities/OrdemServico.js';
import { canTransitionOrder } from '../domain/statusTransitions.js';
import type { DbExecutor } from '../repositories/CrudRepository.js';

interface OrderInput { motocicleta_id: number; descricao: string; itens: OrdemItemInput[] }
interface PriceRow extends RowDataPacket { id: number; preco: number; ativo: number }
interface OrderRow extends RowDataPacket { id: number; status: OrdemStatus; motocicleta_id: number; descricao: string; valor_total: number; data_abertura: Date; data_conclusao: Date | null }
export class OrdemServicoService {
  async create(input: OrderInput, funcionarioId: number) {
    return inTransaction(async (connection) => {
      const [bike] = await connection.execute<RowDataPacket[]>('SELECT id FROM motocicletas WHERE id = ? FOR UPDATE', [input.motocicleta_id]);
      if (!bike[0]) throw new AppError(404, 'Motocicleta não encontrada.', 'NOT_FOUND');
      const prices = await this.resolvePrices(connection, input.itens);
      const totalCents = this.calculateTotal(input.itens, prices);
      const [created] = await connection.execute<ResultSetHeader>('INSERT INTO ordens_servico (motocicleta_id, descricao, status, valor_total) VALUES (?, ?, \'ABERTA\', ?)', [input.motocicleta_id, input.descricao, totalCents / 100]);
      await this.writeItems(connection, created.insertId, input.itens, prices);
      await connection.execute('INSERT INTO ordem_servico_historico (ordem_servico_id, status_anterior, status_novo, funcionario_responsavel_id) VALUES (?, NULL, \'ABERTA\', ?)', [created.insertId, funcionarioId]);
      return this.find(created.insertId, connection);
    });
  }

  async list(page: number, limit: number, search?: string, status?: OrdemStatus) {
    const conditions: string[] = [];
    const values: Array<string | number> = [];
    if (search) {
      conditions.push('(CAST(o.id AS CHAR) LIKE ? OR o.status LIKE ? OR m.placa LIKE ? OR c.nome LIKE ?)');
      values.push(...Array(4).fill(`%${search}%`) as string[]);
    }
    if (status) { conditions.push('o.status = ?'); values.push(status); }
    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const [count] = await pool.execute<(RowDataPacket & { total: number })[]>(`SELECT COUNT(*) AS total FROM ordens_servico o JOIN motocicletas m ON m.id=o.motocicleta_id JOIN clientes c ON c.id=m.cliente_id${where}`, values);
    const total = Number(count[0]?.total ?? 0);
    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT o.*, m.placa, m.marca, m.modelo, c.id AS cliente_id, c.nome AS cliente_nome FROM ordens_servico o JOIN motocicletas m ON m.id=o.motocicleta_id JOIN clientes c ON c.id=m.cliente_id${where} ORDER BY o.id DESC LIMIT ? OFFSET ?`, [...values, limit, (page - 1) * limit]);
    return { data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async find(id: number, executor: DbExecutor = pool) {
    const [rows] = await executor.execute<RowDataPacket[]>('SELECT o.*, m.placa, m.marca, m.modelo, c.id AS cliente_id, c.nome AS cliente_nome, c.cpf AS cliente_cpf FROM ordens_servico o JOIN motocicletas m ON m.id=o.motocicleta_id JOIN clientes c ON c.id=m.cliente_id WHERE o.id = ?', [id]);
    const order = rows[0] as OrderRow | undefined;
    if (!order) throw new AppError(404, 'Ordem de serviço não encontrada.', 'NOT_FOUND');
    const [[items], [approvals], [history]] = await Promise.all([
      executor.execute<RowDataPacket[]>('SELECT i.*, s.nome AS servico_nome, (i.quantidade * i.preco_aplicado) AS subtotal FROM ordem_servico_itens i JOIN servicos s ON s.id=i.servico_id WHERE i.ordem_servico_id = ? ORDER BY i.id', [id]),
      executor.execute<RowDataPacket[]>('SELECT a.*, u.nome AS funcionario_nome FROM ordem_servico_aprovacao a LEFT JOIN usuarios u ON u.id=a.funcionario_responsavel_id WHERE a.ordem_servico_id = ? ORDER BY a.id DESC', [id]),
      executor.execute<RowDataPacket[]>('SELECT h.*, u.nome AS funcionario_nome FROM ordem_servico_historico h LEFT JOIN usuarios u ON u.id=h.funcionario_responsavel_id WHERE h.ordem_servico_id = ? ORDER BY h.id', [id]),
    ]);
    return { ...order, itens: items, aprovacoes: approvals, historico: history };
  }

  async update(id: number, input: OrderInput) {
    return inTransaction(async (connection) => {
      const order = await this.lockOrder(id, connection);
      this.ensureEditable(order.status);
      const [bike] = await connection.execute<RowDataPacket[]>('SELECT id FROM motocicletas WHERE id = ? FOR UPDATE', [input.motocicleta_id]);
      if (!bike[0]) throw new AppError(404, 'Motocicleta não encontrada.', 'NOT_FOUND');
      const [existingRows] = await connection.execute<(RowDataPacket & { servico_id: number; preco_aplicado: number })[]>('SELECT servico_id, preco_aplicado FROM ordem_servico_itens WHERE ordem_servico_id = ? FOR UPDATE', [id]);
      const existingIds = new Set(existingRows.map((row) => Number(row.servico_id)));
      const prices = await this.resolvePrices(connection, input.itens, existingIds);
      for (const item of input.itens) {
        const existing = existingRows.find((row) => row.servico_id === item.servico_id);
        if (existing) prices.set(item.servico_id, Math.round(Number(existing.preco_aplicado) * 100));
      }
      const totalCents = this.calculateTotal(input.itens, prices);
      await connection.execute('UPDATE ordens_servico SET motocicleta_id = ?, descricao = ?, valor_total = ? WHERE id = ?', [input.motocicleta_id, input.descricao, totalCents / 100, id]);
      await connection.execute('DELETE FROM ordem_servico_itens WHERE ordem_servico_id = ?', [id]);
      await this.writeItems(connection, id, input.itens, prices);
      return this.find(id, connection);
    });
  }

  async changeStatus(id: number, target: OrdemStatus, funcionarioId: number) {
    return inTransaction(async (connection) => {
      const order = await this.lockOrder(id, connection);
      if (order.status === target) return this.find(id, connection);
      if (!canTransitionOrder(order.status, target)) throw new AppError(409, `Transição de ${order.status} para ${target} não permitida.`, 'INVALID_STATUS_TRANSITION');
      if (target === 'CONCLUIDA') {
        const [items] = await connection.execute<RowDataPacket[]>('SELECT id FROM ordem_servico_itens WHERE ordem_servico_id = ? LIMIT 1', [id]);
        if (!items[0]) throw new AppError(409, 'Não é possível concluir uma ordem sem itens de serviço.', 'EMPTY_ORDER');
      }
      await connection.execute('UPDATE ordens_servico SET status = ?, data_conclusao = ? WHERE id = ?', [target, target === 'CONCLUIDA' ? new Date() : null, id]);
      await connection.execute('INSERT INTO ordem_servico_historico (ordem_servico_id, status_anterior, status_novo, funcionario_responsavel_id) VALUES (?, ?, ?, ?)', [id, order.status, target, funcionarioId]);
      if (target === 'AGUARDANDO_APROVACAO') await connection.execute('INSERT INTO ordem_servico_aprovacao (ordem_servico_id, status_decisao) VALUES (?, \'PENDENTE\')', [id]);
      return this.find(id, connection);
    });
  }

  async decideApproval(id: number, decisao: 'APROVADA' | 'REJEITADA', funcionarioId: number, observacao?: string) {
    return inTransaction(async (connection) => {
      const order = await this.lockOrder(id, connection);
      if (order.status !== 'AGUARDANDO_APROVACAO') throw new AppError(409, 'A ordem não está aguardando aprovação.', 'APPROVAL_NOT_PENDING');
      const [pending] = await connection.execute<(RowDataPacket & { id: number })[]>('SELECT id FROM ordem_servico_aprovacao WHERE ordem_servico_id = ? AND status_decisao = \'PENDENTE\' ORDER BY id DESC LIMIT 1 FOR UPDATE', [id]);
      if (!pending[0]) throw new AppError(409, 'Não há solicitação pendente para esta ordem.', 'APPROVAL_NOT_PENDING');
      const [changed] = await connection.execute<ResultSetHeader>('UPDATE ordem_servico_aprovacao SET status_decisao = ?, data_decisao = CURRENT_TIMESTAMP, funcionario_responsavel_id = ?, observacao = ? WHERE id = ? AND status_decisao = \'PENDENTE\'', [decisao, funcionarioId, observacao ?? null, pending[0].id]);
      if (changed.affectedRows !== 1) throw new AppError(409, 'A solicitação já foi decidida por outra operação.', 'APPROVAL_ALREADY_DECIDED');
      const next: OrdemStatus = decisao === 'APROVADA' ? 'EM_ANDAMENTO' : 'CANCELADA';
      await connection.execute('UPDATE ordens_servico SET status = ?, data_conclusao = NULL WHERE id = ?', [next, id]);
      await connection.execute('INSERT INTO ordem_servico_historico (ordem_servico_id, status_anterior, status_novo, funcionario_responsavel_id) VALUES (?, ?, ?, ?)', [id, order.status, next, funcionarioId]);
      return this.find(id, connection);
    });
  }

  async remove(id: number): Promise<never> {
    await this.find(id);
    throw new AppError(409, 'Ordens de serviço não podem ser excluídas. Cancele a ordem pela operação de status.', 'ORDER_DELETE_FORBIDDEN');
  }

  private async lockOrder(id: number, connection: DbExecutor): Promise<OrderRow> {
    const [rows] = await connection.execute<OrderRow[]>('SELECT id, status, motocicleta_id, descricao, valor_total, data_abertura, data_conclusao FROM ordens_servico WHERE id = ? FOR UPDATE', [id]);
    if (!rows[0]) throw new AppError(404, 'Ordem de serviço não encontrada.', 'NOT_FOUND');
    return rows[0];
  }

  private ensureEditable(status: OrdemStatus): void {
    if (status !== 'ABERTA' && status !== 'EM_ANDAMENTO') throw new AppError(409, `A ordem em status ${status} não pode ser editada.`, 'ORDER_NOT_EDITABLE');
  }

  private async resolvePrices(connection: DbExecutor, items: OrdemItemInput[], existingIds = new Set<number>()): Promise<Map<number, number>> {
    const ids = [...new Set(items.map((item) => item.servico_id))];
    if (ids.length !== items.length) throw new AppError(400, 'Não repita o mesmo serviço na ordem.', 'DUPLICATE_SERVICE');
    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await connection.execute<PriceRow[]>(`SELECT id, preco, ativo FROM servicos WHERE id IN (${placeholders}) FOR UPDATE`, ids);
    if (rows.length !== ids.length) throw new AppError(404, 'Um ou mais serviços não foram encontrados.', 'SERVICE_NOT_FOUND');
    if (rows.some((row) => !Boolean(row.ativo) && !existingIds.has(Number(row.id)))) throw new AppError(409, 'Serviços novos adicionados à ordem devem estar ativos.', 'SERVICE_INACTIVE');
    return new Map(rows.map((row) => [Number(row.id), Math.round(Number(row.preco) * 100)]));
  }

  private calculateTotal(items: OrdemItemInput[], prices: Map<number, number>): number {
    const total = items.reduce((sum, item) => sum + (prices.get(item.servico_id) ?? 0) * item.quantidade, 0);
    if (!Number.isSafeInteger(total) || total > 999_999_999_999) throw new AppError(400, 'O valor total da ordem excede o limite permitido.', 'ORDER_TOTAL_TOO_LARGE');
    return total;
  }

  private async writeItems(connection: DbExecutor, orderId: number, items: OrdemItemInput[], prices: Map<number, number>): Promise<void> {
    for (const item of items) {
      const priceCents = prices.get(item.servico_id);
      if (priceCents === undefined) throw new AppError(400, 'Preço de serviço indisponível.', 'SERVICE_PRICE_MISSING');
      await connection.execute('INSERT INTO ordem_servico_itens (ordem_servico_id, servico_id, quantidade, preco_aplicado) VALUES (?, ?, ?, ?)', [orderId, item.servico_id, item.quantidade, priceCents / 100]);
    }
  }
}
