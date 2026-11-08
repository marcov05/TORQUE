export class Motocicleta {
  constructor(
    public readonly id: number | null,
    public clienteId: number,
    public marca: string,
    public modelo: string,
    public ano: number,
    public placa: string,
    public cor: string | null,
    public cilindradaCc: number,
  ) {}
}
