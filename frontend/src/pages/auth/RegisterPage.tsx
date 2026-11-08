import { useState } from 'react';
import { Eye, EyeOff, Wrench } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { registerFormSchema } from '../../utils/validation';
import { formatCpf, normalizeCpf } from '../../utils/format';
import { authApi } from '../../services/api';
import { getApiError } from '../../services/http';
import { Alert } from '../../components/ui/Feedback';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/Fields';

type FormValues = z.infer<typeof registerFormSchema>;

export function RegisterPage() {
  const [visible, setVisible] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { nome: '', email: '', cpf: '', senha: '', confirmarSenha: '' },
  });

  const submit = handleSubmit(async ({ confirmarSenha: _confirmation, ...values }) => {
    setApiError('');
    try {
      await authApi.register({ ...values, cpf: normalizeCpf(values.cpf) });
      setSuccess(true);
      window.setTimeout(() => navigate('/login', { replace: true }), 900);
    } catch (error) { setApiError(getApiError(error)); }
  });

  return <main className="grid min-h-screen w-full grid-cols-1 bg-torque-graphite lg:grid-cols-[0.9fr_1.1fr]">
    <section className="hidden flex-col justify-between p-12 text-white lg:flex xl:p-16">
      <div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-torque-red"><Wrench size={24} /></span><span className="text-xl font-black tracking-[0.2em]">TORQUE</span></div>
      <div className="max-w-lg"><p className="text-xs font-bold uppercase tracking-[0.22em] text-red-300">Gestão feita para oficina</p><h1 className="mt-5 text-5xl font-bold leading-tight">Tudo pronto para<br />entrar em marcha.</h1><p className="mt-6 text-lg leading-8 text-slate-300">Cadastre o acesso da sua equipe e organize a rotina da oficina.</p></div>
      <p className="text-xs text-slate-500">Acesso individual e protegido</p>
    </section>
    <section className="flex min-w-0 min-h-screen items-center justify-center bg-torque-offwhite px-5 py-10 sm:px-10">
      <div className="w-full min-w-0 max-w-lg">
        <div className="mb-7 flex items-center gap-2 lg:hidden"><Wrench className="text-torque-red" /><span className="font-black tracking-[0.18em]">TORQUE</span></div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-torque-red">Novo acesso</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Criar conta</h2><p className="mt-2 text-sm text-slate-500">Use seus dados profissionais para cadastrar sua equipe.</p>
        <form onSubmit={(event) => { void submit(event); }} className="mt-7 grid gap-4 sm:grid-cols-2">
          {apiError && <div className="sm:col-span-2"><Alert>{apiError}</Alert></div>}
          {success && <div className="sm:col-span-2"><Alert tone="success">Conta criada. Redirecionando para o login…</Alert></div>}
          <div className="sm:col-span-2"><TextField label="Nome completo" autoComplete="name" placeholder="Seu nome" error={errors.nome?.message} {...register('nome')} /></div>
          <div className="sm:col-span-2"><TextField label="E-mail" type="email" autoComplete="email" placeholder="voce@oficina.com.br" error={errors.email?.message} {...register('email')} /></div>
          <TextField label="CPF" inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" error={errors.cpf?.message} {...register('cpf', { onChange: (event) => setValue('cpf', formatCpf(event.target.value), { shouldValidate: true }) })} />
          <div className="relative"><TextField label="Senha" type={visible ? 'text' : 'password'} autoComplete="new-password" placeholder="Crie uma senha forte" error={errors.senha?.message} {...register('senha')} /><button type="button" onClick={() => setVisible((value) => !value)} className="absolute right-3 top-[2.15rem] rounded-md p-1.5 text-slate-500 hover:bg-slate-100" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
          <div className="sm:col-span-2"><TextField label="Confirmar senha" type={visible ? 'text' : 'password'} autoComplete="new-password" placeholder="Digite a senha novamente" error={errors.confirmarSenha?.message} {...register('confirmarSenha')} /></div>
          <p className="text-xs leading-5 text-slate-500 sm:col-span-2">A senha precisa ter 8 caracteres, letras maiúsculas e minúsculas, um número e um caractere especial.</p>
          <Button type="submit" busy={isSubmitting} disabled={success} className="sm:col-span-2">Criar conta</Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">Já tem acesso? <Link to="/login" className="font-semibold text-torque-red hover:text-red-800">Entrar</Link></p>
      </div>
    </section>
  </main>;
}
