import { Wrench } from 'lucide-react';
import { ButtonLink } from '../components/ui/ButtonLink';

export function NotFoundPage() {
  return <main className="grid min-h-screen place-items-center bg-torque-offwhite p-6 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-torque-graphite text-white"><Wrench /></span><p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-torque-red">Erro 404</p><h1 className="mt-2 text-3xl font-bold">Esta página não está na rota.</h1><p className="mt-2 text-slate-500">Confira o endereço ou volte ao painel.</p><ButtonLink to="/dashboard" className="mt-6">Voltar ao painel</ButtonLink></div></main>;
}
