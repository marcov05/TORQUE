import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { workOrderFormSchema } from '../../utils/validation';
import { motorcyclesApi, ordersApi, servicesApi } from '../../services/api';
import { getApiError } from '../../services/http';
import type { Motorcycle, Service, WorkOrder } from '../../types/api';
import { formatCurrency } from '../../utils/format';
import { Alert, LoadingState } from '../../components/ui/Feedback';
import { Button } from '../../components/ui/Button';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { TextAreaField, TextField } from '../../components/ui/Fields';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/shared/PageHeader';
import { AsyncSearchSelect } from '../../components/shared/AsyncSearchSelect';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../contexts/ToastContext';

type FormInput = z.input<typeof workOrderFormSchema>;
type FormValues = z.output<typeof workOrderFormSchema>;

export function OrderFormPage() {
  const { id: idParam } = useParams();
  const id = idParam ? Number(idParam) : null;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(id !== null);
  const [loadError, setLoadError] = useState('');
  const [apiError, setApiError] = useState('');
  const [motorcycleLabel, setMotorcycleLabel] = useState('');
  const [serviceLabels, setServiceLabels] = useState<Record<number, string>>({});
  const [servicePrices, setServicePrices] = useState<Record<number, number>>({});
  const [originalOrder, setOriginalOrder] = useState<WorkOrder | null>(null);
  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(workOrderFormSchema), defaultValues: { motocicleta_id: 0, descricao: '', itens: [{ servico_id: 0, quantidade: 1 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'itens' });
  const watchedItems = watch('itens');
  const watchedMotorcycleValue = watch('motocicleta_id');
  const watchedMotorcycle = typeof watchedMotorcycleValue === 'number' ? watchedMotorcycleValue : Number(watchedMotorcycleValue);
  const existingItemIds = useMemo(() => new Set(originalOrder?.itens.map((item) => item.servico_id) ?? []), [originalOrder]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    void ordersApi.get(id).then((order) => {
      if (!active) return;
      if (order.status !== 'ABERTA' && order.status !== 'EM_ANDAMENTO') {
        setLoadError(`Ordens em status ${order.status} não podem ser editadas.`);
        return;
      }
      setOriginalOrder(order);
      setMotorcycleLabel(`${order.marca} ${order.modelo} · ${order.placa} · ${order.cliente_nome}`);
      setServiceLabels(Object.fromEntries(order.itens.map((item) => [item.servico_id, `${item.servico_nome} · ${formatCurrency(Number(item.preco_aplicado))}`])));
      setServicePrices(Object.fromEntries(order.itens.map((item) => [item.servico_id, Number(item.preco_aplicado)])));
      reset({ motocicleta_id: order.motocicleta_id, descricao: order.descricao, itens: order.itens.map((item) => ({ servico_id: item.servico_id, quantidade: item.quantidade })) });
    }).catch((error: unknown) => { if (active) setLoadError(getApiError(error)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, reset]);

  const loadServices = async (params: Parameters<typeof servicesApi.list>[0]) => {
    const result = await servicesApi.list({ ...params, ativo: true });
    return { ...result, data: result.data.filter((service) => Boolean(service.ativo) || existingItemIds.has(service.id)) };
  };

  const previewTotal = (watchedItems ?? []).reduce((total, item) => {
    const price = servicePrices[Number(item.servico_id)] ?? 0;
    return total + price * (Number(item.quantidade) || 0);
  }, 0);

  const submit = handleSubmit(async (values) => {
    setApiError('');
    const input = { motocicleta_id: values.motocicleta_id, descricao: values.descricao, itens: values.itens.map((item) => ({ servico_id: item.servico_id, quantidade: item.quantidade })) };
    try {
      const saved = id ? await ordersApi.update(id, input) : await ordersApi.create(input);
      showToast(id ? 'Ordem atualizada.' : 'Ordem criada como aberta.');
      navigate(`/ordens-servico/${saved.id}`, { replace: true });
    } catch (error) { setApiError(getApiError(error, 'A ordem mudou no servidor. Atualize os dados e tente novamente.')); }
  });

  if (loading) return <LoadingState label="Carregando ordem de serviço…" />;
  if (loadError) return <div className="mx-auto max-w-2xl space-y-4"><Alert>{loadError}</Alert><ButtonLink to={id ? `/ordens-servico/${id}` : '/ordens-servico'} variant="secondary" icon={<ArrowLeft size={17} />}>Voltar às ordens</ButtonLink></div>;

  return <div className="mx-auto max-w-5xl space-y-6">
    <PageHeader title={id ? `Editar OS #${id}` : 'Nova ordem de serviço'} description="Selecione a motocicleta e os serviços do atendimento. O backend define preços, total e estado persistido." />
    <Card className="p-5 sm:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold">Dados do atendimento</h3><p className="mt-1 text-sm text-slate-500">Valores exibidos são uma estimativa; o servidor calcula os valores finais.</p></div><StatusBadge status={originalOrder?.status ?? 'ABERTA'} /></div>
      {apiError && <div className="mb-5"><Alert>{apiError}</Alert></div>}
      <form onSubmit={(event) => { void submit(event); }} className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2"><AsyncSearchSelect<Motorcycle> label="Motocicleta" placeholder="Buscar por placa, modelo ou proprietário" selectedId={watchedMotorcycle || null} selectedLabel={motorcycleLabel} load={motorcyclesApi.list} getLabel={(motorcycle) => `${motorcycle.marca} ${motorcycle.modelo} · ${motorcycle.placa} · ${motorcycle.proprietario_nome ?? ''}`} onSelect={(motorcycle) => { setMotorcycleLabel(motorcycle ? `${motorcycle.marca} ${motorcycle.modelo} · ${motorcycle.placa} · ${motorcycle.proprietario_nome ?? ''}` : ''); setValue('motocicleta_id', motorcycle?.id ?? 0, { shouldValidate: true }); }} error={errors.motocicleta_id?.message} required /><TextAreaField label="Descrição do problema ou atendimento" required placeholder="Descreva o que será verificado ou executado" error={errors.descricao?.message} {...register('descricao')} /></div>
        <div className="border-t border-slate-200 pt-5"><div className="mb-4 flex items-center justify-between gap-3"><div><h4 className="font-bold">Serviços</h4><p className="mt-1 text-sm text-slate-500">Cada linha recebe preço vigente na inclusão; itens existentes preservam o preço histórico.</p></div><Button variant="secondary" onClick={() => append({ servico_id: 0, quantidade: 1 })} icon={<Plus size={17} />}>Adicionar serviço</Button></div>
          {errors.itens?.root?.message && <div className="mb-3"><Alert>{errors.itens.root.message}</Alert></div>}
          <div className="space-y-3">{fields.map((field, index) => {
            const selectedServiceId = watchedItems?.[index]?.servico_id ?? 0;
            return <div key={field.id} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-end">
              <AsyncSearchSelect<Service> label={`Serviço ${index + 1}`} placeholder="Buscar serviço" selectedId={Number(selectedServiceId) > 0 ? Number(selectedServiceId) : null} selectedLabel={serviceLabels[Number(selectedServiceId)] ?? ''} load={loadServices} getLabel={(service) => `${service.nome} · ${formatCurrency(Number(service.preco))}`} onSelect={(service) => { setValue(`itens.${index}.servico_id`, service?.id ?? 0, { shouldValidate: true }); if (service) { setServiceLabels((current) => ({ ...current, [service.id]: `${service.nome} · ${formatCurrency(Number(service.preco))}` })); setServicePrices((current) => ({ ...current, [service.id]: Number(service.preco) })); } }} error={errors.itens?.[index]?.servico_id?.message} required />
              <TextField label="Quantidade" type="number" min="1" max="1000" required error={errors.itens?.[index]?.quantidade?.message} {...register(`itens.${index}.quantidade`, { valueAsNumber: true })} />
              <Button variant="ghost" disabled={fields.length <= 1} onClick={() => remove(index)} aria-label={`Remover serviço ${index + 1}`}><Trash2 size={17} /><span className="sm:hidden">Remover item</span></Button>
            </div>;
          })}</div>
          <div className="mt-5 flex flex-col gap-1 border-t border-slate-200 pt-4 text-right"><span className="text-sm text-slate-500">Estimativa de total</span><span className="text-2xl font-bold">{formatCurrency(previewTotal)}</span><span className="text-xs text-slate-500">Total definitivo calculado pelo servidor após salvar.</span></div>
        </div>
        {!id && <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">A ordem será criada com status <strong>Aberta</strong>. O status inicial é definido pelo sistema.</p>}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end"><ButtonLink to={id ? `/ordens-servico/${id}` : '/ordens-servico'} variant="secondary">Cancelar</ButtonLink><Button type="submit" busy={isSubmitting}>Salvar ordem</Button></div>
      </form>
    </Card>
  </div>;
}
