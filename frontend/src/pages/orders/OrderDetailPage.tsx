import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Clock3, Pencil, ShieldCheck, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ordersApi } from '../../services/api';
import { getApiError } from '../../services/http';
import type { OrderStatus, WorkOrder } from '../../types/api';
import { formatCurrency, formatDate } from '../../utils/format';
import { Alert, EmptyState, LoadingState } from '../../components/ui/Feedback';
import { Button } from '../../components/ui/Button';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { PageHeader } from '../../components/shared/PageHeader';
import { useToast } from '../../contexts/ToastContext';

type ConfirmAction = 'cancel' | 'reject' | null;

export function OrderDetailPage() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setOrder(await ordersApi.get(id)); }
    catch (reason) { setError(getApiError(reason)); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  const runStatus = async (status: OrderStatus) => {
    setBusy(true); setError('');
    try { setOrder(await ordersApi.changeStatus(id, status)); showToast('Estado da ordem atualizado.'); }
    catch (reason) { setError(getApiError(reason, 'A ordem foi alterada por outra operação. Atualize para ver o estado atual.')); }
    finally { setBusy(false); }
  };
  const runDecision = async (decision: 'APROVADA' | 'REJEITADA') => {
    setBusy(true); setError('');
    try { setOrder(await ordersApi.decide(id, decision)); setConfirmAction(null); showToast(decision === 'APROVADA' ? 'Aprovação registrada.' : 'Rejeição registrada e ordem cancelada.'); }
    catch (reason) { setError(getApiError(reason, 'A solicitação já foi decidida. Atualize para consultar o histórico.')); setConfirmAction(null); }
    finally { setBusy(false); }
  };
  const confirm = async () => {
    if (confirmAction === 'cancel') await runStatus('CANCELADA');
    if (confirmAction === 'reject') await runDecision('REJEITADA');
    setConfirmAction(null);
  };

  const latestPending = useMemo(() => order?.aprovacoes.find((approval) => approval.status_decisao === 'PENDENTE') ?? null, [order]);
  if (loading) return <LoadingState label="Carregando ordem de serviço…" />;
  if (!order) return <div className="mx-auto max-w-2xl space-y-4"><Alert>{error || 'Ordem de serviço não encontrada.'}</Alert><ButtonLink to="/ordens-servico" variant="secondary" icon={<ArrowLeft size={17} />}>Voltar às ordens</ButtonLink></div>;

  const editable = order.status === 'ABERTA' || order.status === 'EM_ANDAMENTO';
  const waitingApproval = order.status === 'AGUARDANDO_APROVACAO' && latestPending !== null;
  const buttonClass = 'min-h-10 px-3';
  return <div className="space-y-6">
    <Link to="/ordens-servico" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-torque-red"><ArrowLeft size={16} />Todas as ordens</Link>
    <PageHeader title={`Ordem de serviço #${order.id}`} description={`${order.marca} ${order.modelo} · ${order.placa} · ${order.cliente_nome}`} action={editable ? <Link to={`/ordens-servico/${order.id}/editar`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"><Pencil size={16} />Editar ordem</Link> : undefined} />
    {error && <Alert>{error}</Alert>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
      <div className="space-y-5">
        <Card className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-slate-500">Estado atual</p><div className="mt-2"><StatusBadge status={order.status} /></div></div><div className="text-right"><p className="text-sm text-slate-500">Total persistido</p><p className="mt-1 text-2xl font-bold">{formatCurrency(Number(order.valor_total))}</p></div></div><div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Abertura</p><p className="mt-1 text-sm">{formatDate(order.data_abertura)}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conclusão</p><p className="mt-1 text-sm">{formatDate(order.data_conclusao)}</p></div><div className="sm:col-span-2"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Descrição do atendimento</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{order.descricao}</p></div><div className="sm:col-span-2"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Proprietário</p><p className="mt-1 text-sm">{order.cliente_nome}{order.cliente_cpf ? ` · CPF ${order.cliente_cpf}` : ''}</p></div></div></Card>
        <Card className="overflow-hidden"><div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h3 className="font-bold">Serviços da ordem</h3></div>{order.itens.length === 0 ? <div className="p-5"><EmptyState title="Sem serviços registrados" description="Esta ordem não possui itens cadastrados." /></div> : <><div className="hidden sm:block"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Serviço</th><th className="px-3 py-3 text-right">Qtd.</th><th className="px-3 py-3 text-right">Preço aplicado</th><th className="px-5 py-3 text-right">Subtotal</th></tr></thead><tbody className="divide-y divide-slate-100">{order.itens.map((item) => <tr key={item.id}><td className="px-5 py-3.5 font-medium">{item.servico_nome}</td><td className="px-3 py-3.5 text-right">{item.quantidade}</td><td className="px-3 py-3.5 text-right">{formatCurrency(Number(item.preco_aplicado))}</td><td className="px-5 py-3.5 text-right font-semibold">{formatCurrency(Number(item.subtotal))}</td></tr>)}</tbody></table></div><div className="divide-y divide-slate-100 sm:hidden">{order.itens.map((item) => <div key={item.id} className="flex justify-between gap-3 px-5 py-3.5"><div><p className="font-medium">{item.servico_nome}</p><p className="mt-1 text-xs text-slate-500">{item.quantidade} × {formatCurrency(Number(item.preco_aplicado))}</p></div><p className="font-semibold">{formatCurrency(Number(item.subtotal))}</p></div>)}</div></>}</Card>
        <Card className="p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><Clock3 size={18} className="text-torque-red" /><h3 className="font-bold">Histórico de status</h3></div>{order.historico.length === 0 ? <p className="text-sm text-slate-500">Nenhuma transição registrada.</p> : <ol className="space-y-0">{order.historico.map((event, index) => <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0"><span className="relative mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500"><span className="size-2 rounded-full bg-torque-red" />{index < order.historico.length - 1 && <span className="absolute left-1/2 top-7 h-full w-px -translate-x-1/2 bg-slate-200" />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2">{event.status_anterior ? <><StatusBadge status={event.status_anterior} /><span className="text-slate-400">→</span></> : <span className="text-sm text-slate-500">Ordem criada</span>}<StatusBadge status={event.status_novo} /></div><p className="mt-1 text-xs text-slate-500">{formatDate(event.data_alteracao)}{event.funcionario_nome ? ` · ${event.funcionario_nome}` : ''}</p></div></li>)}</ol>}</Card>
      </div>
      <div className="space-y-5">
        <Card className="p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><ShieldCheck size={18} className="text-torque-red" /><h3 className="font-bold">Ações disponíveis</h3></div>
          {order.status === 'ABERTA' && <div className="grid gap-2"><Button className={buttonClass} busy={busy} onClick={() => { void runStatus('EM_ANDAMENTO'); }}>Iniciar atendimento</Button><Button variant="secondary" className={buttonClass} disabled={busy} onClick={() => { void runStatus('AGUARDANDO_APROVACAO'); }}>Solicitar aprovação</Button><Button variant="danger" className={buttonClass} disabled={busy} onClick={() => setConfirmAction('cancel')}>Cancelar ordem</Button></div>}
          {order.status === 'EM_ANDAMENTO' && <div className="grid gap-2"><Button className={buttonClass} busy={busy} onClick={() => { void runStatus('CONCLUIDA'); }}>Concluir atendimento</Button><Button variant="secondary" className={buttonClass} disabled={busy} onClick={() => { void runStatus('AGUARDANDO_APROVACAO'); }}>Solicitar aprovação</Button><Button variant="danger" className={buttonClass} disabled={busy} onClick={() => setConfirmAction('cancel')}>Cancelar ordem</Button></div>}
          {waitingApproval && <div className="grid gap-2"><p className="mb-1 text-sm text-slate-600">Solicitação enviada em {formatDate(latestPending.data_solicitacao)}. Registre a decisão recebida do cliente.</p><Button className={buttonClass} busy={busy} icon={<Check size={17} />} onClick={() => { void runDecision('APROVADA'); }}>Registrar aprovação</Button><Button variant="danger" className={buttonClass} disabled={busy} icon={<X size={17} />} onClick={() => setConfirmAction('reject')}>Registrar rejeição</Button></div>}
          {!editable && !waitingApproval && <p className="text-sm leading-6 text-slate-500">{order.status === 'AGUARDANDO_APROVACAO' ? 'Não há uma solicitação pendente. Atualize para consultar o estado atual.' : 'Esta ordem é definitiva e não pode ser editada ou reaberta.'}</p>}
        </Card>
        <Card className="p-5 sm:p-6"><h3 className="font-bold">Solicitações e decisões</h3>{order.aprovacoes.length === 0 ? <p className="mt-3 text-sm text-slate-500">Esta ordem ainda não solicitou aprovação.</p> : <ol className="mt-4 space-y-4">{order.aprovacoes.map((approval) => <li key={approval.id} className="border-t border-slate-100 pt-4 first:border-0 first:pt-0"><div className="flex flex-wrap items-center justify-between gap-2"><StatusBadge status={approval.status_decisao} /><span className="text-xs text-slate-500">Solicitada {formatDate(approval.data_solicitacao)}</span></div>{approval.data_decisao && <p className="mt-2 text-xs text-slate-600">Decidida {formatDate(approval.data_decisao)}{approval.funcionario_nome ? ` · ${approval.funcionario_nome}` : ''}</p>}{approval.observacao && <p className="mt-2 text-sm text-slate-600">{approval.observacao}</p>}</li>)}</ol>}</Card>
      </div>
    </div>
    <ConfirmDialog open={confirmAction === 'cancel'} title="Cancelar ordem de serviço?" description="O cancelamento é definitivo. A OS e todos os históricos continuarão registrados." confirmLabel="Cancelar ordem" busy={busy} onConfirm={() => { void confirm(); }} onClose={() => setConfirmAction(null)} />
    <ConfirmDialog open={confirmAction === 'reject'} title="Registrar rejeição do cliente?" description="A decisão será registrada no histórico e a ordem será cancelada definitivamente." confirmLabel="Registrar rejeição" busy={busy} onConfirm={() => { void confirm(); }} onClose={() => setConfirmAction(null)} />
  </div>;
}
