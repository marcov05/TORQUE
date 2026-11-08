export interface User {
  id: number;
  nome: string;
  email: string;
  cpf: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Page<T> {
  data: T[];
  pagination: Pagination;
}

export interface Customer {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export type CustomerInput = Pick<Customer, 'nome' | 'cpf' | 'telefone'> & { email?: string | null };

export interface Motorcycle {
  id: number;
  cliente_id: number;
  marca: string;
  modelo: string;
  ano: number;
  placa: string;
  cor: string | null;
  cilindrada_cc: number;
  proprietario_nome?: string;
  proprietario_cpf?: string;
  proprietario_telefone?: string;
  proprietario_email?: string | null;
}

export type MotorcycleInput = Pick<Motorcycle, 'cliente_id' | 'marca' | 'modelo' | 'ano' | 'placa' | 'cilindrada_cc'> & { cor?: string | null };

export interface Service {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  duracao_estimada: number;
  ativo: boolean | number;
}

export type ServiceInput = Pick<Service, 'nome' | 'descricao' | 'preco' | 'duracao_estimada'> & { ativo?: boolean };

export type OrderStatus = 'ABERTA' | 'EM_ANDAMENTO' | 'AGUARDANDO_APROVACAO' | 'CONCLUIDA' | 'CANCELADA';
export type ApprovalDecision = 'PENDENTE' | 'APROVADA' | 'REJEITADA';

export interface OrderItemInput { servico_id: number; quantidade: number }
export interface OrderItem extends OrderItemInput {
  id: number;
  ordem_servico_id: number;
  preco_aplicado: number;
  subtotal: number;
  servico_nome: string;
}

export interface Approval {
  id: number;
  status_decisao: ApprovalDecision;
  data_solicitacao: string;
  data_decisao: string | null;
  funcionario_responsavel_id: number | null;
  funcionario_nome: string | null;
  observacao: string | null;
}

export interface OrderHistory {
  id: number;
  status_anterior: OrderStatus | null;
  status_novo: OrderStatus;
  data_alteracao: string;
  funcionario_responsavel_id: number | null;
  funcionario_nome: string | null;
}

export interface WorkOrder {
  id: number;
  motocicleta_id: number;
  descricao: string;
  status: OrderStatus;
  valor_total: number;
  data_abertura: string;
  data_conclusao: string | null;
  placa: string;
  marca: string;
  modelo: string;
  cliente_id: number;
  cliente_nome: string;
  cliente_cpf?: string;
  itens: OrderItem[];
  aprovacoes: Approval[];
  historico: OrderHistory[];
}

export interface WorkOrderInput {
  motocicleta_id: number;
  descricao: string;
  itens: OrderItemInput[];
}

export interface DashboardSummary {
  indicadores: {
    total_clientes: number;
    total_motocicletas: number;
    servicos_ativos: number;
    ordens_abertas: number;
    ordens_andamento: number;
    ordens_concluidas: number;
    faturamento_mes_atual: number;
  };
  periodo_faturamento: 'MES_ATUAL';
  ordens_recentes: Array<Pick<WorkOrder, 'id' | 'status' | 'valor_total' | 'data_abertura' | 'placa' | 'marca' | 'modelo' | 'cliente_nome'>>;
}
