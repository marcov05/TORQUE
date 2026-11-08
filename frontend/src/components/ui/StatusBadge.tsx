import type { OrderStatus, ApprovalDecision } from '../../types/api';

type Status = OrderStatus | ApprovalDecision | 'ATIVO' | 'INATIVO';
const labels: Record<Status, string> = {
  ABERTA: 'Aberta', EM_ANDAMENTO: 'Em andamento', AGUARDANDO_APROVACAO: 'Aguardando aprovação',
  CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada', PENDENTE: 'Pendente', APROVADA: 'Aprovada',
  REJEITADA: 'Rejeitada', ATIVO: 'Ativo', INATIVO: 'Inativo',
};
const colors: Record<Status, string> = {
  ABERTA: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  EM_ANDAMENTO: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  AGUARDANDO_APROVACAO: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  CONCLUIDA: 'bg-emerald-50 text-emerald-800 ring-emerald-600/15',
  CANCELADA: 'bg-slate-100 text-slate-600 ring-slate-500/15',
  PENDENTE: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  APROVADA: 'bg-emerald-50 text-emerald-800 ring-emerald-600/15',
  REJEITADA: 'bg-red-50 text-red-700 ring-red-600/15',
  ATIVO: 'bg-emerald-50 text-emerald-800 ring-emerald-600/15',
  INATIVO: 'bg-slate-100 text-slate-600 ring-slate-500/15',
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${colors[status]}`}>{labels[status]}</span>;
}
