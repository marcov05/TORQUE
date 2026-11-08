export class Servico {
  constructor(
    public readonly id: number | null,
    public nome: string,
    public descricao: string,
    public preco: number,
    public duracaoEstimada: number,
    public ativo: boolean,
  ) {
    if (preco <= 0 || duracaoEstimada <= 0) throw new RangeError('Preço e duração devem ser positivos.');
  }
}
