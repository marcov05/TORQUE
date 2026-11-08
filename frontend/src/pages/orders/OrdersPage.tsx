import { useMemo, useState } from 'react';
import { Eye, Plus, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { OrderStatus, WorkOrder } from '../../types/api';
import { ordersApi, type ListParams } from '../../services/api';
import { usePaginatedData } from '../../hooks/usePaginatedData';
import { formatCurrency, formatDate } from '../../utils/format';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, TableCell } from '../../components/shared/DataTable';
import { Alert, EmptyState, LoadingState } from '../../components/ui/Feedback';
import { Button } from '../../components/ui/Button';
import { SelectField } from '../../components/ui/Fields';
import { Pagination } from '../../components/ui/Pagination';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';

const statusOptions: Array<{ value: OrderStatus | ''; label: string }> = [
  { value: '', label: 'Todos os status' }, { value: 'ABERTA', label: 'Abertas' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' }, { value: 'AGUARDANDO_APROVACAO', label: 'Aguardando aprovação' },
  { value: 'CONCLUIDA', label: 'Concluídas' }, { value: 'CANCELADA', label: 'Canceladas' },
];

export function OrdersPage() {
  const params = new URLSearchParams(window.location.search);
  const initialStatus = statusOptions.some((option) => option.value === params.get('status')) ? params.get('status') as OrderStatus : '';
  const [status, setStatus] = useState<OrderStatus | ''>(initialStatus);
  const filters = useMemo<ListParams>(() => status ? { status } : {}, [status]);
  const query = usePaginatedData<WorkOrder>(ordersApi.list, filters);
  const orders = query.result?.data ?? [];

  return <div className="space-y-6">
    <PageHeader title="Ordens de serviço" description="Acompanhe atendimentos, estados, aprovações e histórico da oficina." action={<Link to="/ordens-servico/novo" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-torque-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"><Plus size={18} />Nova ordem</Link>} />
    <Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-end sm:p-5"><div className="relative min-w-0 flex-1"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Pesquisar ordens de serviço" value={query.searchInput} onChange={(event) => query.setSearchInput(event.target.value)} placeholder="Número da OS, placa ou cliente" className="min-h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-torque-red focus:ring-2 focus:ring-torque-red/15" /></div><div className="w-full sm:max-w-xs"><SelectField label="Filtrar por status" value={status} onChange={(event) => { setStatus(event.target.value as OrderStatus | ''); query.changeFilters(); }}><option value="">Todos os status</option>{statusOptions.filter((option) => option.value).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</SelectField></div>{status && <Button variant="ghost" className="min-h-11 px-3" onClick={() => { setStatus(''); query.changeFilters(); }} aria-label="Limpar filtro de status"><X size={17} />Limpar</Button>}</div>
      {query.error && <div className="p-4"><Alert>{query.error}</Alert></div>}
      {query.loading ? <LoadingState label="Carregando ordens…" /> : orders.length === 0 ? <div className="p-4 sm:p-6"><EmptyState title="Nenhuma ordem encontrada" description="Crie uma ordem de serviço ou ajuste a pesquisa e os filtros." /></div> : <>
        <div className="hidden md:block"><DataTable headers={['Ordem', 'Cliente e motocicleta', 'Abertura', 'Valor', 'Status', 'Ações']}>{orders.map((order) => <tr key={order.id} className="hover:bg-slate-50"><TableCell><span className="font-bold">OS #{order.id}</span></TableCell><TableCell><span className="font-semibold">{order.cliente_nome}</span><span className="block text-xs text-slate-500">{order.marca} {order.modelo} · {order.placa}</span></TableCell><TableCell>{formatDate(order.data_abertura)}</TableCell><TableCell className="font-semibold">{formatCurrency(Number(order.valor_total))}</TableCell><TableCell><StatusBadge status={order.status} /></TableCell><TableCell><Link to={`/ordens-servico/${order.id}`} className="inline-flex rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={`Ver OS ${order.id}`}><Eye size={17} /></Link></TableCell></tr>)}</DataTable></div>
        <div className="divide-y divide-slate-100 md:hidden">{orders.map((order) => <article key={order.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-bold">OS #{order.id} · {order.cliente_nome}</p><p className="mt-1 truncate text-sm text-slate-500">{order.marca} {order.modelo} · {order.placa}</p><p className="mt-1 text-xs text-slate-500">{formatDate(order.data_abertura)}</p><p className="mt-2 font-semibold">{formatCurrency(Number(order.valor_total))}</p></div><div className="flex flex-col items-end gap-2"><StatusBadge status={order.status} /><Link to={`/ordens-servico/${order.id}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={`Ver OS ${order.id}`}><Eye size={17} /></Link></div></div></article>)}</div>
        <div className="p-4 sm:px-5"><Pagination {...query.result!.pagination} page={query.page} onPageChange={query.setPage} /></div>
      </>}
    </Card>
  </div>;
}
