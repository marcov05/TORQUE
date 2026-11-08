import type { RowDataPacket } from 'mysql2/promise';
import { AppError } from '../errors/AppError.js';
import type { CrudRepository, PageInput } from '../repositories/CrudRepository.js';

export class CrudService {
  constructor(private readonly repository: CrudRepository, private readonly resourceName: 'clientes' | 'motocicletas' | 'servicos') {}

  list(input: PageInput, filters: Record<string, string | number | undefined> = {}) { return this.repository.list(input, filters); }
  async get(id: number): Promise<RowDataPacket> { return this.repository.find(id); }
  async create(data: Record<string, unknown>): Promise<RowDataPacket> {
    const id = await this.repository.create(data);
    return this.repository.find(id);
  }
  async update(id: number, data: Record<string, unknown>): Promise<RowDataPacket> {
    await this.repository.find(id);
    await this.repository.update(id, data);
    return this.repository.find(id);
  }
  async delete(id: number): Promise<void> {
    await this.repository.find(id);
    if (this.resourceName === 'servicos') {
      const service = await this.repository.find(id);
      if (Boolean(service.ativo)) { await this.repository.update(id, { ativo: false }); return; }
    }
    try { await this.repository.delete(id); }
    catch (error) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }
}
