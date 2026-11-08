import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database.js';

interface DashboardTotals extends RowDataPacket {
  total_clientes: number;
  total_motocicletas: number;
  servicos_ativos: number;
  ordens_abertas: number;
  ordens_andamento: number;
  ordens_concluidas: number;
  faturamento_mes_atual: number;
}

export class DashboardService {
  async getSummary() {
    const period = this.currentSaoPauloMonth();
    const [rows] = await pool.execute<DashboardTotals[]>(`
      SELECT
        (SELECT COUNT(*) FROM clientes) AS total_clientes,
        (SELECT COUNT(*) FROM motocicletas) AS total_motocicletas,
        (SELECT COUNT(*) FROM servicos WHERE ativo = TRUE) AS servicos_ativos,
        (SELECT COUNT(*) FROM ordens_servico WHERE status = 'ABERTA') AS ordens_abertas,
        (SELECT COUNT(*) FROM ordens_servico WHERE status = 'EM_ANDAMENTO') AS ordens_andamento,
        (SELECT COUNT(*) FROM ordens_servico WHERE status = 'CONCLUIDA') AS ordens_concluidas,
        (SELECT COALESCE(SUM(valor_total), 0) FROM ordens_servico
          WHERE status = 'CONCLUIDA'
            AND data_conclusao >= ?
            AND data_conclusao < ?
        ) AS faturamento_mes_atual
    `, [period.start, period.end]);
    const [recentOrders] = await pool.query<RowDataPacket[]>(`
      SELECT o.id, o.status, o.valor_total, o.data_abertura, m.placa, m.marca, m.modelo, c.nome AS cliente_nome
      FROM ordens_servico o
      JOIN motocicletas m ON m.id = o.motocicleta_id
      JOIN clientes c ON c.id = m.cliente_id
      ORDER BY o.data_abertura DESC, o.id DESC
      LIMIT 6
    `);
    const totals = rows[0];
    return {
      indicadores: {
        total_clientes: Number(totals?.total_clientes ?? 0),
        total_motocicletas: Number(totals?.total_motocicletas ?? 0),
        servicos_ativos: Number(totals?.servicos_ativos ?? 0),
        ordens_abertas: Number(totals?.ordens_abertas ?? 0),
        ordens_andamento: Number(totals?.ordens_andamento ?? 0),
        ordens_concluidas: Number(totals?.ordens_concluidas ?? 0),
        faturamento_mes_atual: Number(totals?.faturamento_mes_atual ?? 0),
      },
      periodo_faturamento: 'MES_ATUAL',
      ordens_recentes: recentOrders,
    };
  }

  private currentSaoPauloMonth(): { start: Date; end: Date } {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
    const year = Number(parts.find((part) => part.type === 'year')?.value);
    const month = Number(parts.find((part) => part.type === 'month')?.value);
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const formatLocalMidnight = (selectedYear: number, selectedMonth: number): Date => new Date(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01T00:00:00-03:00`);
    return { start: formatLocalMidnight(year, month), end: formatLocalMidnight(nextYear, nextMonth) };
  }
}
