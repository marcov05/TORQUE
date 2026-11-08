import { useEffect, useState } from 'react';
import { ArrowRight, Bike, ClipboardCheck, ClipboardList, Plus, Users, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { getApiError } from '../services/http';
import type { DashboardSummary, OrderStatus } from '../types/api';
import { formatCurrency, formatDate } from '../utils/format';
import { Alert, EmptyState, LoadingState } from '../components/ui/Feedback';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { ButtonLink } from '../components/ui/ButtonLink';

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void dashboardApi.getSummary().then((data) => { if (active) setSummary(data); }).catch((reason: unknown) => { if (active) setError(getApiError(reason)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingState label="Carregando indicadores da oficina…" />;
  if (error) return <div className="mx-auto max-w-3xl space-y-4"><Alert>{error}</Alert><Button variant="secondary" onClick={() => window.location.reload()}>Tentar novamente</Button></div>;
  if (!summary) return <EmptyState title="Painel indisponível" description="Não foi possível carregar os indicadores agora." />;

  const { indicadores, ordens_recentes: recent } = summary;
  const cards = [
    { label: 'Clientes', value: indicadores.total_clientes, icon: Users, to: '/clientes', tint: 'bg-blue-50 text-blue-700' },
    { label: 'Motocicletas', value: indicadores.total_motocicletas, icon: Bike, to: '/motocicletas', tint: 'bg-violet-50 text-violet-700' },
    { label: 'Serviços ativos', value: indicadores.servicos_ativos, icon: Wrench, to: '/servicos', tint: 'bg-emerald-50 text-emerald-800' },
    { label: 'Ordens abertas', value: indicadores.ordens_abertas, icon: ClipboardList, to: '/ordens-servico?status=ABERTA', tint: 'bg-blue-50 text-blue-700' },
    { label: 'Em andamento', value: indicadores.ordens_andamento, icon: ClipboardCheck, to: '/ordens-servico?status=EM_ANDAMENTO', tint: 'bg-amber-50 text-amber-800' },
    { label: 'Concluídas', value: indicadores.ordens_concluidas, icon: ClipboardCheck, to: '/ordens-servico?status=CONCLUIDA', tint: 'bg-emerald-50 text-emerald-800' },
  ];

  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-slate-500">Resumo da operação</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-torque-graphite sm:text-3xl">Bom trabalho, vamos em frente.</h2><p className="mt-2 text-sm text-slate-500">Indicadores atualizados com os registros da oficina.</p></div><div className="flex flex-wrap gap-2"><ButtonLink to="/clientes/novo" variant="secondary" icon={<Users size={17} />}>Novo cliente</ButtonLink><ButtonLink to="/motocicletas/novo" variant="secondary" icon={<Bike size={17} />}>Nova motocicleta</ButtonLink><ButtonLink to="/ordens-servico/novo" icon={<Plus size={18} />}>Nova ordem</ButtonLink></div></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(({ label, value, icon: Icon, to, tint }) => <Link key={label} to={to} className="group"><Card className="h-full p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"><div className="flex items-start justify-between"><span className={`rounded-xl p-2.5 ${tint}`}><Icon size={19} /></span><ArrowRight size={17} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-torque-red" /></div><p className="mt-5 text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold tracking-tight">{value.toLocaleString('pt-BR')}</p></Card></Link>)}</div>
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <Card className="p-5 sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm text-slate-500">Faturamento registrado</p><h3 className="mt-1 text-xl font-bold">Mês atual</h3></div><span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">R$</span></div><p className="mt-7 text-3xl font-bold tracking-tight text-torque-graphite sm:text-4xl">{formatCurrency(indicadores.faturamento_mes_atual)}</p><p className="mt-2 text-xs text-slate-500">Ordens concluídas neste mês, conforme a data registrada pelo servidor.</p></Card>
      <Card className="p-5 sm:p-6"><div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="font-bold">Atendimentos recentes</h3><p className="mt-1 text-sm text-slate-500">Últimas ordens registradas</p></div><Link to="/ordens-servico" className="text-sm font-semibold text-torque-red hover:underline">Ver todas</Link></div>
        {recent.length === 0 ? <div className="py-5"><EmptyState title="Nenhuma ordem cadastrada" description="As novas ordens aparecerão aqui." /></div> : <div className="divide-y divide-slate-100">{recent.map((order) => <Link key={order.id} to={`/ordens-servico/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-1 hover:bg-slate-50/70"><div className="min-w-0"><p className="truncate text-sm font-semibold">OS #{order.id} · {order.cliente_nome}</p><p className="mt-1 truncate text-xs text-slate-500">{order.marca} {order.modelo} · {order.placa} · {formatDate(order.data_abertura)}</p></div><div className="ml-auto flex items-center gap-3"><StatusBadge status={order.status as OrderStatus} /><span className="text-sm font-semibold">{formatCurrency(Number(order.valor_total))}</span></div></Link>)}</div>}
      </Card>
    </div>
  </div>;
}
