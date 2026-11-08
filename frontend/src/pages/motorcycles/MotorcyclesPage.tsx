import { useEffect, useMemo, useState } from 'react';
import { Eye, Filter, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Customer, Motorcycle } from '../../types/api';
import { customersApi, motorcyclesApi, type ListParams } from '../../services/api';
import { getApiError } from '../../services/http';
import { formatCpf } from '../../utils/format';
import { usePaginatedData } from '../../hooks/usePaginatedData';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, TableCell } from '../../components/shared/DataTable';
import { Alert, EmptyState, LoadingState } from '../../components/ui/Feedback';
import { Button } from '../../components/ui/Button';
import { TextField, SelectField } from '../../components/ui/Fields';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DetailsDialog } from '../../components/ui/DetailsDialog';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../contexts/ToastContext';

interface FilterState { marca: string; modelo: string; cilindrada_cc: string; cor: string; ano: string; cliente_id: string }
const emptyFilters: FilterState = { marca: '', modelo: '', cilindrada_cc: '', cor: '', ano: '', cliente_id: '' };

export function MotorcyclesPage() {
  const [filterDraft, setFilterDraft] = useState<FilterState>(emptyFilters);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [owners, setOwners] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Motorcycle | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Motorcycle | null>(null);
  const [removing, setRemoving] = useState(false);
  const [actionError, setActionError] = useState('');
  const { showToast } = useToast();

  const apiFilters = useMemo<ListParams>(() => ({
    ...(filters.marca.trim() ? { marca: filters.marca.trim() } : {}),
    ...(filters.modelo.trim() ? { modelo: filters.modelo.trim() } : {}),
    ...(filters.cilindrada_cc ? { cilindrada_cc: Number(filters.cilindrada_cc) } : {}),
    ...(filters.cor.trim() ? { cor: filters.cor.trim() } : {}),
    ...(filters.ano ? { ano: Number(filters.ano) } : {}),
    ...(filters.cliente_id ? { cliente_id: Number(filters.cliente_id) } : {}),
  }), [filters]);
  const query = usePaginatedData<Motorcycle>(motorcyclesApi.list, apiFilters);
  const motorcycles = useMemo(() => query.result?.data ?? [], [query.result]);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => { void customersApi.list({ page: 1, limit: 100 }).then((result) => setOwners(result.data)).catch(() => setOwners([])); }, []);

  const applyFilters = () => { setFilters({ ...filterDraft }); query.changeFilters(); setFilterOpen(false); };
  const clearFilters = () => { setFilterDraft(emptyFilters); setFilters(emptyFilters); query.changeFilters(); };
  const updateDraft = <K extends keyof FilterState>(key: K, value: FilterState[K]) => setFilterDraft((current) => ({ ...current, [key]: value }));
  const remove = async () => {
    if (!removeTarget) return;
    setRemoving(true); setActionError('');
    try { await motorcyclesApi.remove(removeTarget.id); setRemoveTarget(null); query.refresh(); showToast('Motocicleta excluída.'); }
    catch (error) { setActionError(getApiError(error)); setRemoveTarget(null); }
    finally { setRemoving(false); }
  };
  const actions = (motorcycle: Motorcycle) => <div className="flex items-center gap-1">
    <button type="button" onClick={() => setSelected(motorcycle)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={`Ver ${motorcycle.modelo}`}><Eye size={17} /></button>
    <Link to={`/motocicletas/${motorcycle.id}/editar`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-torque-red" aria-label={`Editar ${motorcycle.modelo}`}><Pencil size={16} /></Link>
    <button type="button" onClick={() => setRemoveTarget(motorcycle)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700" aria-label={`Excluir ${motorcycle.modelo}`}><Trash2 size={16} /></button>
  </div>;

  return <div className="space-y-6">
    <PageHeader title="Motocicletas" description="Pesquise por motocicleta ou proprietário e combine filtros para encontrar o veículo certo." action={<Link to="/motocicletas/novo" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-torque-red px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"><Plus size={18} />Nova motocicleta</Link>} />
    <Card className="overflow-hidden">
      <div className="space-y-4 border-b border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Buscar motocicletas e proprietários" value={query.searchInput} onChange={(event) => query.setSearchInput(event.target.value)} placeholder="Marca, modelo, placa, proprietário ou CPF" className="min-h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-torque-red focus:ring-2 focus:ring-torque-red/15" /></div><Button variant="secondary" onClick={() => setFilterOpen((open) => !open)} icon={<Filter size={17} />}>Filtros{activeFilterCount > 0 && <span className="rounded-full bg-torque-red px-2 py-0.5 text-xs text-white">{activeFilterCount}</span>}</Button></div>
        {filterOpen && <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-3">
          <TextField label="Marca" value={filterDraft.marca} onChange={(event) => updateDraft('marca', event.target.value)} />
          <TextField label="Modelo" value={filterDraft.modelo} onChange={(event) => updateDraft('modelo', event.target.value)} />
          <TextField label="Cilindrada (cc)" type="number" min="1" value={filterDraft.cilindrada_cc} onChange={(event) => updateDraft('cilindrada_cc', event.target.value)} />
          <TextField label="Cor" value={filterDraft.cor} onChange={(event) => updateDraft('cor', event.target.value)} />
          <TextField label="Ano" type="number" min="1885" max={new Date().getFullYear() + 1} value={filterDraft.ano} onChange={(event) => updateDraft('ano', event.target.value)} />
          <SelectField label="Proprietário" value={filterDraft.cliente_id} onChange={(event) => updateDraft('cliente_id', event.target.value)}><option value="">Todos os proprietários</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.nome} · {formatCpf(owner.cpf)}</option>)}</SelectField>
          <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end xl:col-span-3"><Button variant="ghost" onClick={clearFilters} icon={<X size={16} />}>Limpar filtros</Button><Button onClick={applyFilters}>Aplicar filtros</Button></div>
        </div>}
        {activeFilterCount > 0 && <div className="flex flex-wrap items-center gap-2">{Object.entries(filters).filter(([, value]) => value).map(([key, value]) => <span key={key} className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-800">{key.replace('_', ' ')}: {value}</span>)}<button type="button" onClick={clearFilters} className="text-xs font-semibold text-torque-red hover:underline">Remover todos</button></div>}
      </div>
      {actionError && <div className="p-4"><Alert>{actionError}</Alert></div>}{query.error && <div className="p-4"><Alert>{query.error}</Alert></div>}
      {query.loading ? <LoadingState label="Buscando motocicletas…" /> : motorcycles.length === 0 ? <div className="p-4 sm:p-6"><EmptyState title="Nenhuma motocicleta encontrada" description="Altere a pesquisa ou os filtros, ou cadastre uma motocicleta." /></div> : <>
        <div className="hidden md:block"><DataTable headers={['Motocicleta', 'Placa', 'Ano', 'Cilindrada', 'Proprietário', 'Ações']}>{motorcycles.map((motorcycle) => <tr key={motorcycle.id} className="hover:bg-slate-50"><TableCell><span className="font-semibold">{motorcycle.marca} {motorcycle.modelo}</span><span className="block text-xs text-slate-500">{motorcycle.cor || 'Cor não informada'}</span></TableCell><TableCell>{motorcycle.placa}</TableCell><TableCell>{motorcycle.ano}</TableCell><TableCell>{motorcycle.cilindrada_cc} cc</TableCell><TableCell>{motorcycle.proprietario_nome}</TableCell><TableCell>{actions(motorcycle)}</TableCell></tr>)}</DataTable></div>
        <div className="divide-y divide-slate-100 md:hidden">{motorcycles.map((motorcycle) => <article key={motorcycle.id} className="flex items-start justify-between gap-2 p-4"><div className="min-w-0"><p className="font-semibold">{motorcycle.marca} {motorcycle.modelo}</p><p className="mt-1 text-sm text-slate-500">{motorcycle.placa} · {motorcycle.ano} · {motorcycle.cilindrada_cc} cc</p><p className="mt-1 truncate text-sm text-slate-600">{motorcycle.proprietario_nome}</p></div>{actions(motorcycle)}</article>)}</div>
        <div className="p-4 sm:px-5"><Pagination {...query.result!.pagination} page={query.page} onPageChange={query.setPage} /></div>
      </>}
    </Card>
    <DetailsDialog open={selected !== null} title={selected ? `${selected.marca} ${selected.modelo}` : 'Detalhes'} onClose={() => setSelected(null)}>{selected && <dl className="grid gap-4 sm:grid-cols-2">{[['Placa', selected.placa], ['Ano', String(selected.ano)], ['Cor', selected.cor || '—'], ['Cilindrada', `${selected.cilindrada_cc} cc`], ['Proprietário', selected.proprietario_nome ?? '—'], ['CPF', selected.proprietario_cpf ? formatCpf(selected.proprietario_cpf) : '—']].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt><dd className="mt-1">{value}</dd></div>)}</dl>}</DetailsDialog>
    <ConfirmDialog open={removeTarget !== null} title="Excluir motocicleta?" description="A exclusão só será permitida se não houver ordens de serviço associadas." confirmLabel="Excluir motocicleta" busy={removing} onConfirm={() => { void remove(); }} onClose={() => setRemoveTarget(null)} />
  </div>;
}
