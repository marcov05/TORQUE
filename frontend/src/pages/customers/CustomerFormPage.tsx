import { useEffect, useState } from 'react';
import { ArrowLeft, UserRound } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { customerFormSchema } from '../../utils/validation';
import { customersApi } from '../../services/api';
import { getApiError } from '../../services/http';
import { formatCpf, normalizeCpf } from '../../utils/format';
import { Alert, LoadingState } from '../../components/ui/Feedback';
import { Button } from '../../components/ui/Button';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { TextField } from '../../components/ui/Fields';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/shared/PageHeader';
import { useToast } from '../../contexts/ToastContext';

type FormValues = z.infer<typeof customerFormSchema>;

export function CustomerFormPage() {
  const { id: idParam } = useParams();
  const id = idParam ? Number(idParam) : null;
  const isEditing = id !== null;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState('');
  const [apiError, setApiError] = useState('');
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(customerFormSchema), defaultValues: { nome: '', cpf: '', telefone: '', email: '' } });

  useEffect(() => {
    if (!id) return;
    let active = true;
    void customersApi.get(id).then((customer) => { if (active) reset({ nome: customer.nome, cpf: formatCpf(customer.cpf), telefone: customer.telefone, email: customer.email ?? '' }); }).catch((error: unknown) => { if (active) setLoadError(getApiError(error)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, reset]);

  const submit = handleSubmit(async (values) => {
    setApiError('');
    const input = { nome: values.nome, cpf: normalizeCpf(values.cpf), telefone: values.telefone, ...(values.email ? { email: values.email } : {}) };
    try { if (id) await customersApi.update(id, input); else await customersApi.create(input); showToast(id ? 'Cadastro do cliente atualizado.' : 'Cliente cadastrado.'); navigate('/clientes', { replace: true }); }
    catch (error) { setApiError(getApiError(error)); }
  });

  if (loading) return <LoadingState label="Carregando cadastro…" />;
  if (loadError) return <div className="mx-auto max-w-2xl space-y-4"><Alert>{loadError}</Alert><ButtonLink to="/clientes" variant="secondary" icon={<ArrowLeft size={17} />}>Voltar aos clientes</ButtonLink></div>;

  return <div className="mx-auto max-w-3xl space-y-6">
    <PageHeader title={isEditing ? 'Editar cliente' : 'Novo cliente'} description={isEditing ? 'Atualize os dados do proprietário.' : 'Cadastre os dados do proprietário da motocicleta.'} />
    <Card className="p-5 sm:p-7"><div className="mb-6 flex items-center gap-3"><span className="rounded-xl bg-red-50 p-2.5 text-torque-red"><UserRound size={20} /></span><div><h3 className="font-bold">Dados do cliente</h3><p className="text-sm text-slate-500">Campos marcados com * são obrigatórios.</p></div></div>
      {apiError && <div className="mb-5"><Alert>{apiError}</Alert></div>}
      <form onSubmit={(event) => { void submit(event); }} className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><TextField label="Nome completo" required autoComplete="name" placeholder="Nome do cliente" error={errors.nome?.message} {...register('nome')} /></div>
        <TextField label="CPF" required inputMode="numeric" placeholder="000.000.000-00" error={errors.cpf?.message} {...register('cpf', { onChange: (event) => setValue('cpf', formatCpf(event.target.value), { shouldValidate: true }) })} />
        <TextField label="Telefone" required type="tel" autoComplete="tel" placeholder="(11) 99999-9999" error={errors.telefone?.message} {...register('telefone')} />
        <div className="sm:col-span-2"><TextField label="E-mail" type="email" autoComplete="email" placeholder="cliente@exemplo.com" error={errors.email?.message} {...register('email')} /></div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:col-span-2 sm:flex-row sm:justify-end"><ButtonLink to="/clientes" variant="secondary">Cancelar</ButtonLink><Button type="submit" busy={isSubmitting}>Salvar cliente</Button></div>
      </form>
    </Card>
  </div>;
}
