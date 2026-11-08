import type { OrdemStatus } from '../entities/OrdemServico.js';

export const allowedOrderTransitions: Record<OrdemStatus, readonly OrdemStatus[]> = {
  ABERTA: ['EM_ANDAMENTO', 'AGUARDANDO_APROVACAO', 'CANCELADA'],
  EM_ANDAMENTO: ['AGUARDANDO_APROVACAO', 'CONCLUIDA', 'CANCELADA'],
  AGUARDANDO_APROVACAO: [],
  CONCLUIDA: [],
  CANCELADA: [],
};

export function canTransitionOrder(current: OrdemStatus, next: OrdemStatus): boolean {
  return allowedOrderTransitions[current].includes(next);
}
