import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { serviceFormSchema } from '../../utils/validation';
import { servicesApi } from '../../services/api';
import { getApiError } from '../../services/http';
import { Alert, LoadingState } from '../../components/ui/Feedback';
import { Button } from '../../components/ui/Button';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { TextAreaField, TextField } from '../../components/ui/Fields';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../contexts/ToastContext';

type FormInput = z.input<typeof serviceFormSchema>;
type FormValues = z.output<typeof serviceFormSchema>;

export function ServiceFormPage() {
  const { id: idParam } = useParams();
  const id = idParam ? Number(idParam) : null;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(id !== null);
  const [loadError, setLoadError] = useState('');
  const [apiError, setApiError] = useState('');
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(serviceFormSchema), defaultValues: { nome: '', descricao: '', preco: 0, duracao_estimada: 30, ativo: true } });

  useEffect(() => {
    if (!id) return;
    let active = true;
    void servicesApi.get(id).then((service) => { if (active) reset({ nome: service.nome, descricao: service.descricao, preco: Number(service.preco), duracao_estimada: service.duracao_estimada, ativo: Boolean(service.ativo) }); }).catch((error: unknown) => { if (active) setLoadError(getApiError(error)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, reset]);

  const submit = handleSubmit(async (values) => {
    setApiError('');
    try { if (id) await servicesApi.update(id, values); else await servicesApi.create(values); showToast(id ? 'Serviço atualizado.' : 'Serviço cadastrado.'); navigate('/servicos', { replace: true }); }
    catch (error) { setApiError(getApiError(error)); }
  });

  if (loading) return <LoadingState label="Carregando serviço…" />;
  if (loadError) return <div className="mx-auto max-w-2xl space-y-4"><Alert>{loadError}</Alert><ButtonLink to="/servicos" variant="secondary">Voltar aos serviços</ButtonLink></div>;
  const active = Boolean(watch('ativo'));
  return <div className="mx-auto max-w-3xl space-y-6">
    <PageHeader title={id ? 'Editar serviço' : 'Novo serviço'} description="Defina a descrição, o preço vigente e a duração estimada." />
    <Card className="p-5 sm:p-7"><div className="mb-6 flex items-center justify-between gap-3"><div><h3 className="font-bold">Dados do serviço</h3><p className="mt-1 text-sm text-slate-500">A ordem de serviço registra o preço aplicado no momento do atendimento.</p></div>{id && <StatusBadge status={active ? 'ATIVO' : 'INATIVO'} />}</div>
      {apiError && <div className="mb-5"><Alert>{apiError}</Alert></div>}
      <form onSubmit={(event) => { void submit(event); }} className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><TextField label="Nome do serviço" required placeholder="Revisão periódica" error={errors.nome?.message} {...register('nome')} /></div>
        <div className="sm:col-span-2"><TextAreaField label="Descrição" required placeholder="Descreva o que está incluído neste serviço" error={errors.descricao?.message} {...register('descricao')} /></div>
        <TextField label="Preço (R$)" required type="number" min="0.01" step="0.01" error={errors.preco?.message} {...register('preco', { valueAsNumber: true })} />
        <TextField label="Duração estimada (minutos)" required type="number" min="1" step="1" error={errors.duracao_estimada?.message} {...register('duracao_estimada', { valueAsNumber: true })} />
        {id && <label className="flex min-h-11 items-center gap-3 text-sm font-medium sm:col-span-2"><input type="checkbox" checked={active} onChange={(event) => setValue('ativo', event.target.checked)} className="size-4 accent-[#D94747]" />Serviço disponível para novas ordens</label>}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:col-span-2 sm:flex-row sm:justify-end"><ButtonLink to="/servicos" variant="secondary">Cancelar</ButtonLink><Button type="submit" busy={isSubmitting}>Salvar serviço</Button></div>
      </form>
    </Card>
  </div>;
}
