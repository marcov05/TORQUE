import { useMemo, useState } from 'react';
import { Eye, Plus, Search, Trash2, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Service } from '../../types/api';
import { servicesApi } from '../../services/api';
import { getApiError } from '../../services/http';
import { formatCurrency } from '../../utils/format';
import { usePaginatedData } from '../../hooks/usePaginatedData';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, TableCell } from '../../components/shared/DataTable';
import { Alert, EmptyState, LoadingState } from '../../components/ui/Feedback';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DetailsDialog } from '../../components/ui/DetailsDialog';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../contexts/ToastContext';

export function ServicesPage() {
  const query = usePaginatedData<Service>(servicesApi.list);
  const [selected, setSelected] = useState<Service | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Service | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const { showToast } = useToast();
  const services = useMemo(() => query.result?.data ?? [], [query.result]);

  const deactivate = async () => {
    if (!deactivateTarget) return;
    setBusy(true); setActionError('');
    try { await servicesApi.remove(deactivateTarget.id); setDeactivateTarget(null); query.refresh(); showToast('Serviço desativado; o histórico foi preservado.'); }
    catch (error) { setActionError(getApiError(error)); setDeactivateTarget(null); }
    finally { setBusy(false); }
  };
  const actions = (service: Service) => <div className="flex items-center gap-1"><button type="button" onClick={() => setSelected(service)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={`Ver ${service.nome}`}><Eye size={17} /></button><Link to={`/servicos/${service.id}/editar`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-torque-red" aria-label={`Editar ${service.nome}`}><Wrench size={16} /></Link>{Boolean(service.ativo) && <button type="button" onClick={() => setDeactivateTarget(service)} className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-800" aria-label={`Desativar ${service.nome}`}><Trash2 size={16} /></button>}</div>;

  return <div className="space-y-6">
    <PageHeader title="Serviços" description="Organize os serviços disponíveis, preços e duração estimada." action={<Link to="/servicos/novo" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-torque-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"><Plus size={18} />Novo serviço</Link>} />
    <Card className="overflow-hidden"><div className="border-b border-slate-200 p-4 sm:p-5"><div className="relative max-w-md"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Pesquisar serviços" value={query.searchInput} onChange={(event) => query.setSearchInput(event.target.value)} placeholder="Buscar serviço pelo nome ou descrição" className="min-h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-torque-red focus:ring-2 focus:ring-torque-red/15" /></div></div>
      {actionError && <div className="p-4"><Alert>{actionError}</Alert></div>}{query.error && <div className="p-4"><Alert>{query.error}</Alert></div>}
      {query.loading ? <LoadingState label="Carregando serviços…" /> : services.length === 0 ? <div className="p-4 sm:p-6"><EmptyState title="Nenhum serviço encontrado" description="Cadastre os serviços oferecidos pela oficina para adicioná-los às ordens." /></div> : <>
        <div className="hidden md:block"><DataTable headers={['Serviço', 'Preço', 'Duração estimada', 'Estado', 'Ações']}>{services.map((service) => <tr key={service.id} className="hover:bg-slate-50"><TableCell><span className="font-semibold">{service.nome}</span><span className="block max-w-sm truncate text-xs text-slate-500">{service.descricao}</span></TableCell><TableCell className="font-semibold">{formatCurrency(Number(service.preco))}</TableCell><TableCell>{service.duracao_estimada} min</TableCell><TableCell><StatusBadge status={Boolean(service.ativo) ? 'ATIVO' : 'INATIVO'} /></TableCell><TableCell>{actions(service)}</TableCell></tr>)}</DataTable></div>
        <div className="divide-y divide-slate-100 md:hidden">{services.map((service) => <article key={service.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{service.nome}</p><StatusBadge status={Boolean(service.ativo) ? 'ATIVO' : 'INATIVO'} /></div><p className="mt-1 line-clamp-2 text-sm text-slate-500">{service.descricao}</p><p className="mt-2 text-sm font-semibold">{formatCurrency(Number(service.preco))} <span className="font-normal text-slate-500">· {service.duracao_estimada} min</span></p></div>{actions(service)}</div></article>)}</div>
        <div className="p-4 sm:px-5"><Pagination {...query.result!.pagination} page={query.page} onPageChange={query.setPage} /></div>
      </>}
    </Card>
    <DetailsDialog open={selected !== null} title={selected?.nome ?? 'Detalhes do serviço'} onClose={() => setSelected(null)}>{selected && <div className="space-y-4"><p className="text-sm leading-6 text-slate-600">{selected.descricao}</p><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-lg font-bold">{formatCurrency(Number(selected.preco))}</span><span>{selected.duracao_estimada} min</span><StatusBadge status={Boolean(selected.ativo) ? 'ATIVO' : 'INATIVO'} /></div></div>}</DetailsDialog>
    <ConfirmDialog open={deactivateTarget !== null} title="Desativar serviço?" description="O serviço deixará de aparecer para novas ordens. Ele permanecerá registrado para preservar o histórico." confirmLabel="Desativar serviço" busy={busy} onConfirm={() => { void deactivate(); }} onClose={() => setDeactivateTarget(null)} />
  </div>;
}
