import { pool } from '../config/database.js';
import { CrudRepository } from './CrudRepository.js';

export const clientesRepository = new CrudRepository(pool, 'clientes', ['nome', 'cpf', 'telefone', 'email'], ['nome', 'cpf', 'telefone', 'email']);
export const motocicletasRepository = new CrudRepository(pool, 'motocicletas', ['cliente_id', 'marca', 'modelo', 'ano', 'placa', 'cor', 'cilindrada_cc'], ['marca', 'modelo', 'placa']);
export const servicosRepository = new CrudRepository(pool, 'servicos', ['nome', 'descricao', 'preco', 'duracao_estimada', 'ativo'], ['nome', 'descricao']);
