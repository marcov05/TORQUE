import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { KeyRound, UserRound } from 'lucide-react';
import { profileFormSchema } from '../utils/validation';
import { formatCpf, normalizeCpf } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import { getApiError } from '../services/http';
import { Alert } from '../components/ui/Feedback';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/Fields';
import { Card } from '../components/ui/Card';

type FormValues = z.infer<typeof profileFormSchema>;

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [apiError, setApiError] = useState('');
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(profileFormSchema), defaultValues: { nome: user?.nome ?? '', cpf: formatCpf(user?.cpf ?? ''), senha: '', confirmarSenha: '' },
  });

  const resetForm = () => reset({ nome: user?.nome ?? '', cpf: formatCpf(user?.cpf ?? ''), senha: '', confirmarSenha: '' });
  const submit = handleSubmit(async ({ confirmarSenha: _confirmation, ...values }) => {
    setApiError(''); setSaved(false);
    try {
      await authApi.updateProfile({ ...values, cpf: normalizeCpf(values.cpf) });
      await refreshUser();
      setSaved(true);
      resetForm();
    } catch (error) { setApiError(getApiError(error)); }
  });

  return <div className="mx-auto max-w-3xl space-y-6">
    <div><p className="text-sm text-slate-500">Dados do acesso</p><h2 className="mt-1 text-2xl font-bold tracking-tight">Meu perfil</h2></div>
    <Card className="p-5 sm:p-7"><div className="mb-6 flex items-center gap-3"><span className="rounded-xl bg-red-50 p-2.5 text-torque-red"><UserRound size={20} /></span><div><h3 className="font-bold">Informações pessoais</h3><p className="text-sm text-slate-500">O e-mail é usado para entrar e não pode ser alterado.</p></div></div>
      {apiError && <div className="mb-5"><Alert>{apiError}</Alert></div>}{saved && <div className="mb-5"><Alert tone="success">Perfil atualizado.</Alert></div>}
      <form onSubmit={(event) => { void submit(event); }} className="grid gap-5 sm:grid-cols-2">
        <TextField label="Nome completo" autoComplete="name" error={errors.nome?.message} {...register('nome')} />
        <TextField label="E-mail" type="email" value={user?.email ?? ''} disabled readOnly />
        <TextField label="CPF" inputMode="numeric" error={errors.cpf?.message} {...register('cpf', { onChange: (event) => setValue('cpf', formatCpf(event.target.value), { shouldValidate: true }) })} />
        <div className="hidden sm:block" />
        <div className="border-t border-slate-200 pt-5 sm:col-span-2"><div className="mb-4 flex items-center gap-2 text-sm font-semibold"><KeyRound size={17} className="text-torque-red" />Confirme sua senha para salvar as alterações</div><div className="grid gap-5 sm:grid-cols-2"><TextField label="Nova senha" type="password" autoComplete="new-password" error={errors.senha?.message} {...register('senha')} /><TextField label="Confirmar nova senha" type="password" autoComplete="new-password" error={errors.confirmarSenha?.message} {...register('confirmarSenha')} /></div></div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:col-span-2 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={resetForm}>Descartar</Button><Button type="submit" busy={isSubmitting}>Salvar perfil</Button></div>
      </form>
    </Card>
  </div>;
}
