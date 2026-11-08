import test from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import type { RowDataPacket } from 'mysql2/promise';

const testConfigurationIsIsolated = process.env.NODE_ENV === 'test'
  && process.env.MYSQL_DATABASE === 'torque_test'
  && process.env.MYSQL_USER === 'torque_test'
  && process.env.MYSQL_PASSWORD === 'torque_test_only'
  && process.env.MYSQL_HOST === '127.0.0.1'
  && process.env.MYSQL_PORT === '33306';

if (!testConfigurationIsIsolated) throw new Error('Refusing integration tests without the isolated torque_test database.');

process.env.BCRYPT_ROUNDS = '10';
process.env.JWT_SECRET = 'integration-test-only-secret-that-is-at-least-32-characters';

interface HttpResult { status: number; body: Record<string, unknown> }
interface SessionUser { id: number; nome: string; email: string; cpf: string }

function createCpf(seed: number): string {
  const base = String(seed).padStart(9, '0').slice(-9);
  const checksum = (digits: string, startWeight: number): number => {
    const sum = digits.split('').reduce((total, char, index) => total + Number(char) * (startWeight - index), 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = checksum(base, 10);
  const second = checksum(`${base}${first}`, 11);
  return `${base}${first}${second}`;
}

test('MySQL integration: CRUDs, transições, decisões, histórico, concorrência e rollback', async (context) => {
  const imported = await import('../app.js');
  const app = imported.default as unknown as import('express').Express;
  const { pool } = await import('../config/database.js');
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;
  let token = '';
  let secondToken = '';

  const call = async (path: string, method = 'GET', body?: unknown, authorization = token): Promise<HttpResult> => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(authorization ? { authorization: `Bearer ${authorization}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const payload: unknown = response.status === 204 ? {} : await response.json();
    assert.equal(typeof payload, 'object');
    return { status: response.status, body: payload as Record<string, unknown> };
  };
  const register = async (sequence: number) => {
    const cpf = createCpf(810000000 + sequence);
    const email = `integration-${sequence}@torque.test`;
    const result = await call('/auth/register', 'POST', { nome: `Funcionário ${sequence}`, email, cpf, senha: 'Torque#Teste2026' }, '');
    assert.equal(result.status, 201);
    const login = await call('/auth/login', 'POST', { email, senha: 'Torque#Teste2026' }, '');
    assert.equal(login.status, 200);
    const user = login.body.user as SessionUser;
    return { token: String(login.body.token), user };
  };
  const dataRows = (result: HttpResult): Record<string, unknown>[] => result.body.data as Record<string, unknown>[];
  const order = async (bikeId: number, serviceId: number, authorization = token) => {
    const result = await call('/ordens-servico', 'POST', { motocicleta_id: bikeId, descricao: 'Teste integração', itens: [{ servico_id: serviceId, quantidade: 1 }] }, authorization);
    assert.equal(result.status, 201, JSON.stringify(result.body));
    return result.body;
  };

  try {
    await context.test('autenticação e CRUD persistente de clientes, motocicletas e serviços', async () => {
      const first = await register(1);
      token = first.token;
      const second = await register(2);
      secondToken = second.token;

      const createdClient = await call('/clientes', 'POST', { nome: 'Cliente Integração', cpf: createCpf(810000101), telefone: '11987654321', email: 'cliente@torque.test' });
      assert.equal(createdClient.status, 201);
      const clientId = Number(createdClient.body.id);
      assert.equal((await call(`/clientes/${clientId}`)).status, 200);
      const updatedClient = await call(`/clientes/${clientId}`, 'PUT', { nome: 'Cliente Atualizado', cpf: createCpf(810000101), telefone: '11987654322', email: 'cliente@torque.test' });
      assert.equal(updatedClient.status, 200);
      const clients = await call('/clientes?page=1&limit=5&search=Atualizado');
      assert.equal(clients.status, 200);
      assert.equal(dataRows(clients).length, 1);

      const disposableClient = await call('/clientes', 'POST', { nome: 'Cliente Removível', cpf: createCpf(810000102), telefone: '11987654323' });
      assert.equal(disposableClient.status, 201);
      assert.equal((await call(`/clientes/${Number(disposableClient.body.id)}`, 'DELETE')).status, 204);
      assert.equal((await call(`/clientes/${Number(disposableClient.body.id)}`)).status, 404);

      const bikeResult = await call('/motocicletas', 'POST', { cliente_id: clientId, marca: 'Honda', modelo: 'CB 500', ano: 2022, placa: 'ABC1D23', cor: 'Preta', cilindrada_cc: 500 });
      assert.equal(bikeResult.status, 201);
      const bikeId = Number(bikeResult.body.id);
      const disposableBike = await call('/motocicletas', 'POST', { cliente_id: clientId, marca: 'Yamaha', modelo: 'Fazer', ano: 2021, placa: 'DEF1G45', cilindrada_cc: 250 });
      assert.equal(disposableBike.status, 201);
      assert.equal((await call(`/motocicletas/${Number(disposableBike.body.id)}`, 'DELETE')).status, 204);
      const bikeSearch = await call('/motocicletas?search=Cliente%20Atualizado&marca=Honda&cilindrada_cc=500&ano=2022');
      assert.equal(bikeSearch.status, 200);
      assert.equal(dataRows(bikeSearch).length, 1);
      assert.equal((await call(`/motocicletas/${bikeId}`)).status, 200);
      const bikeUpdate = await call(`/motocicletas/${bikeId}`, 'PUT', { cliente_id: clientId, marca: 'Honda', modelo: 'CB 500X', ano: 2023, placa: 'ABC1D23', cor: 'Preta', cilindrada_cc: 500 });
      assert.equal(bikeUpdate.status, 200);
      assert.equal((await call('/motocicletas?modelo=CB%20500X')).status, 200);

      const serviceResult = await call('/servicos', 'POST', { nome: 'Revisão', descricao: 'Revisão completa', preco: 250, duracao_estimada: 90 });
      assert.equal(serviceResult.status, 201);
      const serviceId = Number(serviceResult.body.id);
      assert.equal((await call(`/servicos/${serviceId}`)).status, 200);
      const serviceUpdate = await call(`/servicos/${serviceId}`, 'PUT', { nome: 'Revisão', descricao: 'Revisão atualizada', preco: 300, duracao_estimada: 100, ativo: true });
      assert.equal(serviceUpdate.status, 200);
      const services = await call('/servicos?page=1&limit=10&search=atualizada');
      assert.equal(dataRows(services).length, 1);

      const danglingBike = await call('/motocicletas', 'POST', { cliente_id: 999999, marca: 'Marca', modelo: 'Modelo', ano: 2020, placa: 'XYZ1A23', cilindrada_cc: 250 });
      assert.equal(danglingBike.status, 409);
      assert.equal((await call(`/clientes/${clientId}`, 'DELETE')).status, 409);
      await runOrderLifecycle(bikeId, serviceId, clientId);
      await runOrderRollback(bikeId, serviceId);
      await runDashboardSummary();
      await runServiceDeactivation(serviceId, bikeId);
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await pool.end();
  }

  async function runOrderLifecycle(bikeId: number, serviceId: number, clientId: number): Promise<void> {
    const original = await order(bikeId, serviceId);
    const orderId = Number(original.id);
    assert.equal(original.status, 'ABERTA');
    assert.equal(Number(original.valor_total), 300);
    assert.equal((original.historico as Record<string, unknown>[]).length, 1);
    assert.equal((original.historico as Record<string, unknown>[])[0]?.status_anterior, null);
    assert.equal((await call(`/ordens-servico/${orderId}`, 'DELETE')).status, 409);
    assert.equal((await call('/ordens-servico', 'POST', { motocicleta_id: bikeId, descricao: 'Status não permitido', status: 'CONCLUIDA', itens: [{ servico_id: serviceId, quantidade: 1 }] })).status, 400);

    const sameStatus = await call(`/ordens-servico/${orderId}/status`, 'PATCH', { status: 'ABERTA' });
    assert.equal(sameStatus.status, 200);
    assert.equal((sameStatus.body.historico as Record<string, unknown>[]).length, 1);
    assert.equal((await call(`/ordens-servico/${orderId}`, 'PUT', { motocicleta_id: bikeId, descricao: 'Edição inválida', status: 'CANCELADA', itens: [{ servico_id: serviceId, quantidade: 1 }] })).status, 400);
    assert.equal((await call(`/ordens-servico/${orderId}`, 'PUT', { motocicleta_id: bikeId, descricao: 'Edição inválida', data_conclusao: '2026-01-01', itens: [{ servico_id: serviceId, quantidade: 1 }] })).status, 400);

    await call(`/servicos/${serviceId}`, 'PUT', { nome: 'Revisão', descricao: 'Preço atualizado depois da abertura', preco: 400, duracao_estimada: 100, ativo: true });

    const itemUpdate = await call(`/ordens-servico/${orderId}`, 'PUT', { motocicleta_id: bikeId, descricao: 'Itens atualizados', itens: [{ servico_id: serviceId, quantidade: 2 }] });
    assert.equal(itemUpdate.status, 200);
    assert.equal(Number((itemUpdate.body.itens as Record<string, unknown>[])[0]?.preco_aplicado), 300);
    assert.equal(Number(itemUpdate.body.valor_total), 600);
    assert.equal((await call(`/ordens-servico/${orderId}/status`, 'PATCH', { status: 'EM_ANDAMENTO' })).status, 200);
    const editedWhileInProgress = await call(`/ordens-servico/${orderId}`, 'PUT', { motocicleta_id: bikeId, descricao: 'Editada em andamento', itens: [{ servico_id: serviceId, quantidade: 2 }] });
    assert.equal(editedWhileInProgress.status, 200);
    const idempotentStart = await call(`/ordens-servico/${orderId}/status`, 'PATCH', { status: 'EM_ANDAMENTO' });
    assert.equal((idempotentStart.body.historico as Record<string, unknown>[]).length, 2);
    assert.equal((await call(`/ordens-servico/${orderId}/status`, 'PATCH', { status: 'CONCLUIDA' })).status, 200);

    const afterComplete = await call(`/ordens-servico/${orderId}`);
    assert.equal(afterComplete.body.status, 'CONCLUIDA');
    assert.ok(afterComplete.body.data_conclusao);
    const completedSnapshot = JSON.stringify(afterComplete.body.historico);
    assert.equal((await call(`/ordens-servico/${orderId}`, 'PUT', { motocicleta_id: bikeId, descricao: 'Não editar', itens: [{ servico_id: serviceId, quantidade: 1 }] })).status, 409);
    assert.equal((await call(`/ordens-servico/${orderId}/status`, 'PATCH', { status: 'ABERTA' })).status, 409);
    assert.equal((await call(`/ordens-servico/${orderId}`, 'DELETE')).status, 409);
    assert.equal((await call(`/ordens-servico/${orderId}`)).body.historico && JSON.stringify((await call(`/ordens-servico/${orderId}`)).body.historico), completedSnapshot);
    assert.equal((await call(`/clientes/${clientId}`, 'DELETE')).status, 409);
    assert.equal((await call(`/motocicletas/${bikeId}`, 'DELETE')).status, 409);

    const approvalOrder = await order(bikeId, serviceId);
    const approvalId = Number(approvalOrder.id);
    assert.equal((await call(`/ordens-servico/${approvalId}/status`, 'PATCH', { status: 'EM_ANDAMENTO' })).status, 200);
    const awaiting = await call(`/ordens-servico/${approvalId}/status`, 'PATCH', { status: 'AGUARDANDO_APROVACAO' });
    assert.equal(awaiting.status, 200);
    assert.equal((awaiting.body.aprovacoes as Record<string, unknown>[])[0]?.status_decisao, 'PENDENTE');
    assert.equal((await call(`/ordens-servico/${approvalId}/status`, 'PATCH', { status: 'EM_ANDAMENTO' })).status, 409);
    assert.equal((await call(`/ordens-servico/${approvalId}/status`, 'PATCH', { status: 'CANCELADA' })).status, 409);
    assert.equal((await call(`/ordens-servico/${approvalId}`, 'PUT', { motocicleta_id: bikeId, descricao: 'Edição bloqueada', itens: [{ servico_id: serviceId, quantidade: 1 }] })).status, 409);
    assert.equal((await call(`/ordens-servico/${approvalId}`, 'DELETE')).status, 409);

    const ghostToken = jwt.sign({}, String(process.env.JWT_SECRET), { algorithm: 'HS256', subject: '999999' });
    const rollbackDecision = await call(`/ordens-servico/${approvalId}/aprovacao`, 'PATCH', { decisao: 'APROVADA' }, ghostToken);
    assert.equal(rollbackDecision.status, 409);
    const rollbackRejection = await call(`/ordens-servico/${approvalId}/aprovacao`, 'PATCH', { decisao: 'REJEITADA' }, ghostToken);
    assert.equal(rollbackRejection.status, 409);
    const stillPending = await call(`/ordens-servico/${approvalId}`);
    assert.equal((stillPending.body.aprovacoes as Record<string, unknown>[])[0]?.status_decisao, 'PENDENTE');
    assert.equal(stillPending.body.status, 'AGUARDANDO_APROVACAO');

    const [firstDecision, competingDecision] = await Promise.all([
      call(`/ordens-servico/${approvalId}/aprovacao`, 'PATCH', { decisao: 'APROVADA' }, token),
      call(`/ordens-servico/${approvalId}/aprovacao`, 'PATCH', { decisao: 'APROVADA' }, secondToken),
    ]);
    assert.equal([firstDecision.status, competingDecision.status].filter((status) => status === 200).length, 1);
    assert.equal([firstDecision.status, competingDecision.status].filter((status) => status === 409).length, 1);
    const approved = await call(`/ordens-servico/${approvalId}`);
    assert.equal(approved.body.status, 'EM_ANDAMENTO');
    const approvalHistory = approved.body.aprovacoes as Record<string, unknown>[];
    assert.equal(approvalHistory[0]?.status_decisao, 'APROVADA');
    assert.ok(approvalHistory[0]?.data_decisao);
    assert.ok(approvalHistory[0]?.funcionario_responsavel_id);

    const secondApproval = await call(`/ordens-servico/${approvalId}/status`, 'PATCH', { status: 'AGUARDANDO_APROVACAO' });
    assert.equal(secondApproval.status, 200);
    const rejected = await call(`/ordens-servico/${approvalId}/aprovacao`, 'PATCH', { decisao: 'REJEITADA', observacao: 'Cliente não autorizou' });
    assert.equal(rejected.status, 200);
    assert.equal(rejected.body.status, 'CANCELADA');
    const decisions = rejected.body.aprovacoes as Record<string, unknown>[];
    assert.equal(decisions.length, 2);
    assert.equal(decisions[0]?.status_decisao, 'REJEITADA');
    assert.ok(decisions[0]?.data_decisao);
    assert.ok(decisions[0]?.funcionario_responsavel_id);
    assert.equal(decisions[1]?.status_decisao, 'APROVADA');
    assert.equal((await call(`/ordens-servico/${approvalId}/aprovacao`, 'PATCH', { decisao: 'APROVADA' })).status, 409);
    assert.equal((await call(`/ordens-servico/${approvalId}`, 'PUT', { motocicleta_id: bikeId, descricao: 'Não editar cancelada', itens: [{ servico_id: serviceId, quantidade: 1 }] })).status, 409);
    assert.equal((await call(`/ordens-servico/${approvalId}/status`, 'PATCH', { status: 'EM_ANDAMENTO' })).status, 409);
    assert.equal((await call(`/ordens-servico/${approvalId}`, 'DELETE')).status, 409);

    const directApproval = await order(bikeId, serviceId);
    const directPending = await call(`/ordens-servico/${Number(directApproval.id)}/status`, 'PATCH', { status: 'AGUARDANDO_APROVACAO' });
    assert.equal(directPending.status, 200);
    assert.equal((await call(`/ordens-servico/${Number(directApproval.id)}/aprovacao`, 'PATCH', { decisao: 'APROVADA' })).status, 200);

    const inProgressCancel = await order(bikeId, serviceId);
    const inProgressOrderId = Number(inProgressCancel.id);
    assert.equal((await call(`/ordens-servico/${inProgressOrderId}/status`, 'PATCH', { status: 'EM_ANDAMENTO' })).status, 200);
    assert.equal((await call(`/ordens-servico/${inProgressOrderId}/status`, 'PATCH', { status: 'CANCELADA' })).status, 200);

    const directCancel = await order(bikeId, serviceId);
    const cancelled = await call(`/ordens-servico/${Number(directCancel.id)}/status`, 'PATCH', { status: 'CANCELADA' });
    assert.equal(cancelled.status, 200);
    assert.equal(cancelled.body.status, 'CANCELADA');
    const list = await call('/ordens-servico?page=1&limit=100&search=Cliente%20Atualizado');
    assert.equal(list.status, 200);
    assert.ok(dataRows(list).length >= 5);
  }

  async function runOrderRollback(bikeId: number, serviceId: number): Promise<void> {
    const countBefore = dataRows(await call('/ordens-servico?page=1&limit=100')).length;
    const ghostToken = jwt.sign({}, String(process.env.JWT_SECRET), { algorithm: 'HS256', subject: '999999' });
    const failed = await call('/ordens-servico', 'POST', { motocicleta_id: bikeId, descricao: 'Deve reverter', itens: [{ servico_id: serviceId, quantidade: 1 }] }, ghostToken);
    assert.equal(failed.status, 409);
    const countAfter = dataRows(await call('/ordens-servico?page=1&limit=100')).length;
    assert.equal(countAfter, countBefore);
  }

  async function runServiceDeactivation(serviceId: number, bikeId: number): Promise<void> {
    const historicalOrder = await order(bikeId, serviceId);
    const historicalOrderId = Number(historicalOrder.id);
    assert.equal(Number(historicalOrder.valor_total), 400);
    const originalHistory = JSON.stringify(historicalOrder.historico);

    const serviceBeforeChange = await call(`/servicos/${serviceId}`);
    assert.equal(serviceBeforeChange.status, 200);
    const changedPrice = await call(`/servicos/${serviceId}`, 'PUT', {
      nome: String(serviceBeforeChange.body.nome),
      descricao: String(serviceBeforeChange.body.descricao),
      preco: 450,
      duracao_estimada: Number(serviceBeforeChange.body.duracao_estimada),
      ativo: true,
    });
    assert.equal(changedPrice.status, 200);
    assert.equal(Number(changedPrice.body.preco), 450);

    const result = await call(`/servicos/${serviceId}`, 'DELETE');
    assert.equal(result.status, 200, JSON.stringify(result.body));
    const inactiveService = await call(`/servicos/${serviceId}`);
    assert.equal(Boolean(inactiveService.body.ativo), false);
    assert.equal(dataRows(await call('/servicos?ativo=true&search=Revisão')).length, 0);
    assert.equal(dataRows(await call('/servicos?ativo=false&search=Revisão')).length, 1);
    const editedHistoricalOrder = await call(`/ordens-servico/${historicalOrderId}`, 'PUT', {
      motocicleta_id: bikeId,
      descricao: 'Edit preserving inactive service',
      itens: [{ servico_id: serviceId, quantidade: 1 }],
    });
    assert.equal(editedHistoricalOrder.status, 200, JSON.stringify(editedHistoricalOrder.body));
    assert.equal(editedHistoricalOrder.body.status, 'ABERTA');
    assert.equal(Number(editedHistoricalOrder.body.valor_total), 400);
    const historicalItems = editedHistoricalOrder.body.itens as Record<string, unknown>[];
    assert.equal(Number(historicalItems[0]?.preco_aplicado), 400);
    assert.equal(JSON.stringify(editedHistoricalOrder.body.historico), originalHistory);

    const inactiveServiceOrder = await call('/ordens-servico', 'POST', { motocicleta_id: bikeId, descricao: 'Serviço desativado', itens: [{ servico_id: serviceId, quantidade: 1 }] });
    assert.equal(inactiveServiceOrder.status, 409);
  }

  async function runDashboardSummary(): Promise<void> {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit',
    }).formatToParts(new Date());
    const year = Number(parts.find((part) => part.type === 'year')?.value);
    const month = Number(parts.find((part) => part.type === 'month')?.value);
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const monthStart = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00-03:00`);
    const monthEnd = new Date(`${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00-03:00`);
    const [expectedRows] = await pool.execute<RowDataPacket[]>(`
      SELECT
        (SELECT COUNT(*) FROM clientes) AS total_clientes,
        (SELECT COUNT(*) FROM motocicletas) AS total_motocicletas,
        (SELECT COUNT(*) FROM servicos WHERE ativo = TRUE) AS servicos_ativos,
        (SELECT COUNT(*) FROM ordens_servico WHERE status = 'ABERTA') AS ordens_abertas,
        (SELECT COUNT(*) FROM ordens_servico WHERE status = 'EM_ANDAMENTO') AS ordens_andamento,
        (SELECT COUNT(*) FROM ordens_servico WHERE status = 'CONCLUIDA') AS ordens_concluidas,
        (SELECT COALESCE(SUM(valor_total), 0) FROM ordens_servico
          WHERE status = 'CONCLUIDA' AND data_conclusao >= ? AND data_conclusao < ?
        ) AS faturamento_mes_atual
    `, [monthStart, monthEnd]);
    const [expectedRecent] = await pool.query<RowDataPacket[]>(`
      SELECT id FROM ordens_servico ORDER BY data_abertura DESC, id DESC LIMIT 6
    `);

    const result = await call('/dashboard');
    assert.equal(result.status, 200, JSON.stringify(result.body));
    assert.equal(result.body.periodo_faturamento, 'MES_ATUAL');
    const indicators = result.body.indicadores as Record<string, unknown>;
    const expected = expectedRows[0];
    for (const key of [
      'total_clientes', 'total_motocicletas', 'servicos_ativos', 'ordens_abertas',
      'ordens_andamento', 'ordens_concluidas', 'faturamento_mes_atual',
    ]) {
      assert.equal(Number(indicators[key]), Number(expected[key]), `dashboard indicator ${key}`);
    }
    const actualRecent = result.body.ordens_recentes as Record<string, unknown>[];
    assert.deepEqual(actualRecent.map((orderRow) => Number(orderRow.id)), expectedRecent.map((orderRow) => Number(orderRow.id)));
    context.diagnostic(`GET /api/dashboard matched MySQL aggregates: ${JSON.stringify({
      indicators: Object.fromEntries(Object.keys(expected).map((key) => [key, Number(indicators[key])])),
      recent_order_ids: actualRecent.map((orderRow) => Number(orderRow.id)),
    })}`);
  }
});
