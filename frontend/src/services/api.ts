import { http } from './http';
import type {
  Customer, CustomerInput, DashboardSummary, LoginResponse, Motorcycle, MotorcycleInput,
  Page, Service, ServiceInput, User, WorkOrder, WorkOrderInput,
} from '../types/api';

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  marca?: string;
  modelo?: string;
  cilindrada_cc?: number;
  cor?: string;
  ano?: number;
  cliente_id?: number;
  status?: import('../types/api').OrderStatus;
  ativo?: boolean;
}

export const authApi = {
  async login(email: string, senha: string): Promise<LoginResponse> {
    const { data } = await http.post<LoginResponse>('/auth/login', { email, senha });
    return data;
  },
  async register(input: { nome: string; email: string; senha: string; cpf: string }): Promise<void> {
    await http.post('/auth/register', input);
  },
  async profile(): Promise<User> {
    const { data } = await http.get<User>('/users/me');
    return data;
  },
  async updateProfile(input: { nome: string; cpf: string; senha: string }): Promise<User> {
    const { data } = await http.put<User>('/users/me', input);
    return data;
  },
};

export const customersApi = {
  async list(params: ListParams): Promise<Page<Customer>> { return (await http.get<Page<Customer>>('/clientes', { params })).data; },
  async get(id: number): Promise<Customer> { return (await http.get<Customer>(`/clientes/${id}`)).data; },
  async create(input: CustomerInput): Promise<Customer> { return (await http.post<Customer>('/clientes', input)).data; },
  async update(id: number, input: CustomerInput): Promise<Customer> { return (await http.put<Customer>(`/clientes/${id}`, input)).data; },
  async remove(id: number): Promise<void> { await http.delete(`/clientes/${id}`); },
};

export const motorcyclesApi = {
  async list(params: ListParams): Promise<Page<Motorcycle>> { return (await http.get<Page<Motorcycle>>('/motocicletas', { params })).data; },
  async get(id: number): Promise<Motorcycle> { return (await http.get<Motorcycle>(`/motocicletas/${id}`)).data; },
  async create(input: MotorcycleInput): Promise<Motorcycle> { return (await http.post<Motorcycle>('/motocicletas', input)).data; },
  async update(id: number, input: MotorcycleInput): Promise<Motorcycle> { return (await http.put<Motorcycle>(`/motocicletas/${id}`, input)).data; },
  async remove(id: number): Promise<void> { await http.delete(`/motocicletas/${id}`); },
};

export const servicesApi = {
  async list(params: ListParams): Promise<Page<Service>> { return (await http.get<Page<Service>>('/servicos', { params })).data; },
  async get(id: number): Promise<Service> { return (await http.get<Service>(`/servicos/${id}`)).data; },
  async create(input: ServiceInput): Promise<Service> { return (await http.post<Service>('/servicos', input)).data; },
  async update(id: number, input: ServiceInput): Promise<Service> { return (await http.put<Service>(`/servicos/${id}`, input)).data; },
  async remove(id: number): Promise<void> { await http.delete(`/servicos/${id}`); },
};

export const ordersApi = {
  async list(params: ListParams): Promise<Page<WorkOrder>> { return (await http.get<Page<WorkOrder>>('/ordens-servico', { params })).data; },
  async get(id: number): Promise<WorkOrder> { return (await http.get<WorkOrder>(`/ordens-servico/${id}`)).data; },
  async create(input: WorkOrderInput): Promise<WorkOrder> { return (await http.post<WorkOrder>('/ordens-servico', input)).data; },
  async update(id: number, input: WorkOrderInput): Promise<WorkOrder> { return (await http.put<WorkOrder>(`/ordens-servico/${id}`, input)).data; },
  async changeStatus(id: number, status: WorkOrder['status']): Promise<WorkOrder> { return (await http.patch<WorkOrder>(`/ordens-servico/${id}/status`, { status })).data; },
  async decide(id: number, decisao: 'APROVADA' | 'REJEITADA'): Promise<WorkOrder> { return (await http.patch<WorkOrder>(`/ordens-servico/${id}/aprovacao`, { decisao })).data; },
  async remove(id: number): Promise<void> { await http.delete(`/ordens-servico/${id}`); },
};

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> { return (await http.get<DashboardSummary>('/dashboard')).data; },
};
