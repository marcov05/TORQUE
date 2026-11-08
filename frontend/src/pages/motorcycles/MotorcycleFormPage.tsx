import { useEffect, useState } from 'react';
import { ArrowLeft, Bike } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { motorcycleFormSchema } from '../../utils/validation';
import { customersApi, motorcyclesApi } from '../../services/api';
import { getApiError } from '../../services/http';
import type { Customer } from '../../types/api';
import { Alert, LoadingState } from '../../components/ui/Feedback';
import { Button } from '../../components/ui/Button';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { TextField } from '../../components/ui/Fields';
import { AsyncSearchSelect } from '../../components/shared/AsyncSearchSelect';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/shared/PageHeader';

type FormInput = z.input<typeof motorcycleFormSchema>;
type FormValues = z.output<typeof motorcycleFormSchema>;

export function MotorcycleFormPage() {
  const { id: idParam } = useParams();
  const id = idParam ? Number(idParam) : null;
  const isEditing = id !== null;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [ownerLabel, setOwnerLabel] = useState('');
  const [loading, setLoading] = useState(id !== null);
  const [apiError, setApiError] = useState('');
  const [loadError, setLoadError] = useState('');
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(motorcycleFormSchema), defaultValues: { cliente_id: 0, marca: '', modelo: '', ano: new Date().getFullYear(), placa: '', cor: '', cilindrada_cc: 0 },
  });
  const watchedOwnerValue = watch('cliente_id');
  const watchedOwnerId = typeof watchedOwnerValue === 'number' && watchedOwnerValue > 0 ? watchedOwnerValue : null;

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (id) {
          const motorcycle = await motorcyclesApi.get(id);
          if (active) {
            setOwnerLabel(motorcycle.proprietario_nome ?? '');
            reset({ cliente_id: motorcycle.cliente_id, marca: motorcycle.marca, modelo: motorcycle.modelo, ano: motorcycle.ano, placa: motorcycle.placa, cor: motorcycle.cor ?? '', cilindrada_cc: motorcycle.cilindrada_cc });
          }
        }
      } catch (error) { if (active) setLoadError(getApiError(error)); }
      finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [id, reset]);

  const submit = handleSubmit(async (values) => {
    setApiError('');
    const input = { ...values, cor: values.cor || null };
    try { if (id) await motorcyclesApi.update(id, input); else await motorcyclesApi.create(input); showToast(id ? 'Motocicleta atualizada.' : 'Motocicleta cadastrada.'); navigate('/motocicletas', { replace: true }); }
    catch (error) { setApiError(getApiError(error)); }
  });

  if (loading) return <LoadingState label="Carregando dados da motocicleta…" />;
  if (loadError) return <div className="mx-auto max-w-2xl space-y-4"><Alert>{loadError}</Alert><ButtonLink to="/motocicletas" variant="secondary" icon={<ArrowLeft size={17} />}>Voltar às motocicletas</ButtonLink></div>;

  return <div className="mx-auto max-w-4xl space-y-6">
    <PageHeader title={isEditing ? 'Editar motocicleta' : 'Nova motocicleta'} description="Associe o veículo a um cliente cadastrado e informe os dados de identificação." />
    <Card className="p-5 sm:p-7"><div className="mb-6 flex items-center gap-3"><span className="rounded-xl bg-red-50 p-2.5 text-torque-red"><Bike size={20} /></span><div><h3 className="font-bold">Identificação do veículo</h3><p className="text-sm text-slate-500">A placa precisa ser única no cadastro.</p></div></div>
      {apiError && <div className="mb-5"><Alert>{apiError}</Alert></div>}
      <form onSubmit={(event) => { void submit(event); }} className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><AsyncSearchSelect<Customer> label="Proprietário" placeholder="Buscar cliente por nome ou CPF" selectedId={watchedOwnerId} selectedLabel={ownerLabel} load={customersApi.list} getLabel={(owner) => `${owner.nome} · ${owner.cpf}`} onSelect={(owner) => { setOwnerLabel(owner ? `${owner.nome} · ${owner.cpf}` : ''); setValue('cliente_id', owner?.id ?? 0, { shouldValidate: true }); }} error={errors.cliente_id?.message} required /></div>
        <TextField label="Marca" required placeholder="Honda" error={errors.marca?.message} {...register('marca')} />
        <TextField label="Modelo" required placeholder="CB 500F" error={errors.modelo?.message} {...register('modelo')} />
        <TextField label="Ano" required type="number" min="1885" max={new Date().getFullYear() + 1} error={errors.ano?.message} {...register('ano', { valueAsNumber: true })} />
        <TextField label="Placa" required placeholder="ABC1D23" maxLength={7} className="uppercase" error={errors.placa?.message} {...register('placa')} />
        <TextField label="Cilindrada (cc)" required type="number" min="1" error={errors.cilindrada_cc?.message} {...register('cilindrada_cc', { valueAsNumber: true })} />
        <TextField label="Cor" placeholder="Preta" error={errors.cor?.message} {...register('cor')} />
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:col-span-2 sm:flex-row sm:justify-end"><ButtonLink to="/motocicletas" variant="secondary">Cancelar</ButtonLink><Button type="submit" busy={isSubmitting}>Salvar motocicleta</Button></div>
      </form>
    </Card>
  </div>;
}
