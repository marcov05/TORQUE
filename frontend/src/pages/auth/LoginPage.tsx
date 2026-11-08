import { useState } from 'react';
import { Eye, EyeOff, Gauge, Wrench } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginFormSchema } from '../../utils/validation';
import { useAuth } from '../../contexts/AuthContext';
import { getApiError } from '../../services/http';
import { Alert } from '../../components/ui/Feedback';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/Fields';
import type { z } from 'zod';

type FormValues = z.infer<typeof loginFormSchema>;

export function LoginPage() {
  const [visible, setVisible] = useState(false);
  const [apiError, setApiError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(loginFormSchema) });

  const submit = handleSubmit(async (values) => {
    setApiError('');
    try { await login(values.email, values.senha); navigate('/dashboard', { replace: true }); }
    catch (error) { setApiError(getApiError(error, 'Não foi possível entrar. Verifique sua conexão e tente novamente.')); }
  });

  return <main className="grid min-h-screen w-full grid-cols-1 bg-torque-graphite lg:grid-cols-[1.05fr_0.95fr]">
    <section className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
      <div className="absolute -right-32 -top-24 size-[34rem] rounded-full border border-white/5" /><div className="absolute -right-8 -top-2 size-[28rem] rounded-full border border-white/5" />
      <div className="relative flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-torque-red"><Wrench size={24} /></span><span className="text-xl font-black tracking-[0.2em]">TORQUE</span></div>
      <div className="relative max-w-xl"><p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-red-300">Motorcycle service management</p><h1 className="text-5xl font-bold leading-[1.12] xl:text-6xl">Sua oficina,<br />em movimento.</h1><p className="mt-6 max-w-md text-lg leading-8 text-slate-300">Atendimentos, clientes e motocicletas organizados em um só lugar.</p><div className="mt-10 flex items-center gap-3 text-sm text-slate-400"><Gauge size={18} className="text-torque-red" />Controle preciso. Serviço bem feito.</div></div>
      <p className="relative text-xs text-slate-500">TORQUE · Painel administrativo</p>
    </section>
    <section className="flex min-w-0 min-h-screen items-center justify-center bg-torque-offwhite px-5 py-10 sm:px-10">
      <div className="w-full min-w-0 max-w-md">
        <div className="mb-9 lg:hidden"><div className="flex items-center gap-2 text-torque-graphite"><Wrench className="text-torque-red" /><span className="font-black tracking-[0.18em]">TORQUE</span></div></div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-torque-red">Acesso da equipe</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-torque-graphite">Boas-vindas</h2><p className="mt-2 text-sm text-slate-500">Entre para acompanhar a operação da oficina.</p>
        <form onSubmit={(event) => { void submit(event); }} className="mt-8 space-y-5">
          {apiError && <Alert>{apiError}</Alert>}
          <TextField label="E-mail" type="email" autoComplete="email" placeholder="voce@oficina.com.br" error={errors.email?.message} {...register('email')} />
          <div className="relative"><TextField label="Senha" type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Sua senha" error={errors.senha?.message} {...register('senha')} /><button type="button" onClick={() => setVisible((value) => !value)} className="absolute right-3 top-[2.15rem] rounded-md p-1.5 text-slate-500 hover:bg-slate-100" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
          <Button type="submit" busy={isSubmitting} className="mt-2 w-full">Entrar</Button>
        </form>
        <p className="mt-7 text-center text-sm text-slate-600">Ainda não tem acesso? <Link to="/cadastro" className="font-semibold text-torque-red hover:text-red-800">Criar conta</Link></p>
      </div>
    </section>
  </main>;
}
