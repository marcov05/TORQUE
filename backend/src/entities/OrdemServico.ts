export const ordemStatuses = ['ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_APROVACAO', 'CONCLUIDA', 'CANCELADA'] as const;
export type OrdemStatus = (typeof ordemStatuses)[number];
export interface OrdemItemInput { servico_id: number; quantidade: number }
export class OrdemServico {
  constructor(
    public readonly id: number | null,
    public motocicletaId: number,
    public descricao: string,
    public status: OrdemStatus,
    public valorTotal: number,
    public dataAbertura: Date,
    public dataConclusao: Date | null,
  ) {}
}
