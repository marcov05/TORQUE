import { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Customer } from '../../types/api';
import { customersApi } from '../../services/api';
import { getApiError } from '../../services/http';
import { formatCpf } from '../../utils/format';
import { usePaginatedData } from '../../hooks/usePaginatedData';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, TableCell } from '../../components/shared/DataTable';
import { Alert, EmptyState, LoadingState } from '../../components/ui/Feedback';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DetailsDialog } from '../../components/ui/DetailsDialog';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../contexts/ToastContext';

export function CustomersPage() {
  const query = usePaginatedData<Customer>(customersApi.list);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Customer | null>(null);
  const [removing, setRemoving] = useState(false);
  const [actionError, setActionError] = useState('');
  const { showToast } = useToast();
  const customers = useMemo(() => query.result?.data ?? [], [query.result]);

  const remove = async () => {
    if (!removeTarget) return;
    setRemoving(true); setActionError('');
    try { await customersApi.remove(removeTarget.id); setRemoveTarget(null); query.refresh(); showToast('Cliente excluído.'); }
    catch (error) { setActionError(getApiError(error)); setRemoveTarget(null); }
    finally { setRemoving(false); }
  };

  const actions = (customer: Customer) => <div className="flex items-center gap-1">
    <button type="button" onClick={() => setSelected(customer)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label={`Ver ${customer.nome}`}><Eye size={17} /></button>
    <Link to={`/clientes/${customer.id}/editar`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-torque-red" aria-label={`Editar ${customer.nome}`}><Pencil size={16} /></Link>
    <button type="button" onClick={() => setRemoveTarget(customer)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700" aria-label={`Excluir ${customer.nome}`}><Trash2 size={16} /></button>
  </div>;

  return <div className="space-y-6">
    <PageHeader title="Clientes" description="Mantenha os dados dos proprietários organizados e fáceis de consultar." action={<ButtonLink to="/clientes/novo" icon={<Plus size={18} />}>Novo cliente</ButtonLink>} />
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 p-4 sm:p-5"><div className="relative max-w-md"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Pesquisar clientes" value={query.searchInput} onChange={(event) => query.setSearchInput(event.target.value)} placeholder="Buscar por nome, CPF, telefone ou e-mail" className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-torque-red focus:ring-2 focus:ring-torque-red/15" /></div></div>
      {actionError && <div className="p-4"><Alert>{actionError}</Alert></div>}
      {query.error && <div className="p-4"><Alert>{query.error}</Alert></div>}
      {query.loading ? <LoadingState label="Carregando clientes…" /> : customers.length === 0 ? <div className="p-4 sm:p-6"><EmptyState title={query.searchInput ? 'Nenhum cliente encontrado' : 'Sua lista começa aqui'} description={query.searchInput ? 'Tente outro termo ou limpe a pesquisa.' : 'Cadastre o primeiro cliente para associar motocicletas e ordens de serviço.'} /></div> : <>
        <div className="hidden md:block"><DataTable headers={['Cliente', 'CPF', 'Telefone', 'E-mail', 'Ações']}>{customers.map((customer) => <tr key={customer.id} className="hover:bg-slate-50"><TableCell><span className="font-semibold">{customer.nome}</span></TableCell><TableCell>{formatCpf(customer.cpf)}</TableCell><TableCell>{customer.telefone}</TableCell><TableCell>{customer.email || '—'}</TableCell><TableCell>{actions(customer)}</TableCell></tr>)}</DataTable></div>
        <div className="divide-y divide-slate-100 md:hidden">{customers.map((customer) => <article key={customer.id} className="p-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-semibold">{customer.nome}</p><p className="mt-1 text-sm text-slate-500">CPF {formatCpf(customer.cpf)}</p><p className="mt-1 text-sm text-slate-600">{customer.telefone}</p><p className="truncate text-sm text-slate-500">{customer.email || 'Sem e-mail'}</p></div>{actions(customer)}</div></article>)}</div>
        <div className="p-4 sm:px-5"><Pagination {...query.result!.pagination} page={query.page} onPageChange={query.setPage} /></div>
      </>}
    </Card>
    <DetailsDialog open={selected !== null} title={selected?.nome ?? 'Detalhes do cliente'} onClose={() => setSelected(null)}>
      {selected && <dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">CPF</dt><dd className="mt-1">{formatCpf(selected.cpf)}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Telefone</dt><dd className="mt-1">{selected.telefone}</dd></div><div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">E-mail</dt><dd className="mt-1">{selected.email || '—'}</dd></div></dl>}
    </DetailsDialog>
    <ConfirmDialog open={removeTarget !== null} title="Excluir cliente?" description="A exclusão só será permitida quando não houver motocicletas ou ordens vinculadas." confirmLabel="Excluir cliente" busy={removing} onConfirm={() => { void remove(); }} onClose={() => setRemoveTarget(null)} />
  </div>;
}
