export class Cliente {
  constructor(
    public readonly id: number | null,
    public nome: string,
    public cpf: string,
    public telefone: string,
    public email: string | null,
  ) {}
}
