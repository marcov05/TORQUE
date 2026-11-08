import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidCpf, normalizeCpf } from '../utils/cpf.js';
import { canTransitionOrder } from '../domain/statusTransitions.js';
import { orderSchema, statusSchema } from '../validators/schemas.js';

test('CPF normalizado remove máscara e valida dígitos verificadores', () => {
  assert.equal(normalizeCpf('529.982.247-25'), '52998224725');
  assert.equal(isValidCpf('529.982.247-25'), true);
  assert.equal(isValidCpf('111.111.111-11'), false);
  assert.equal(isValidCpf('529.982.247-24'), false);
});

test('matriz de status permite somente transições definidas', () => {
  assert.equal(canTransitionOrder('ABERTA', 'EM_ANDAMENTO'), true);
  assert.equal(canTransitionOrder('EM_ANDAMENTO', 'CONCLUIDA'), true);
  assert.equal(canTransitionOrder('AGUARDANDO_APROVACAO', 'EM_ANDAMENTO'), false);
  assert.equal(canTransitionOrder('CONCLUIDA', 'ABERTA'), false);
  assert.equal(canTransitionOrder('CANCELADA', 'EM_ANDAMENTO'), false);
  const statuses = ['ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_APROVACAO', 'CONCLUIDA', 'CANCELADA'] as const;
  const transitions = statuses.flatMap((current) => statuses.filter((next) => canTransitionOrder(current, next)).map((next) => `${current}:${next}`));
  assert.deepEqual(transitions, ['ABERTA:EM_ANDAMENTO', 'ABERTA:AGUARDANDO_APROVACAO', 'ABERTA:CANCELADA', 'EM_ANDAMENTO:AGUARDANDO_APROVACAO', 'EM_ANDAMENTO:CONCLUIDA', 'EM_ANDAMENTO:CANCELADA']);
});

test('DTOs de criação e transição rejeitam campos não autorizados', () => {
  const creation = orderSchema.safeParse({ motocicleta_id: 1, descricao: 'Revisão', itens: [{ servico_id: 1, quantidade: 1 }], status: 'CONCLUIDA' });
  const transition = statusSchema.safeParse({ status: 'CONCLUIDA', funcionario_responsavel_id: 99 });
  assert.equal(creation.success, false);
  assert.equal(transition.success, false);
});
