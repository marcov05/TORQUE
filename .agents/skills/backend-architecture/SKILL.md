# Backend Architecture

Use esta orientação ao implementar o backend TORQUE, a partir da Fase 2 autorizada.

- Use TypeScript estrito e mantenha entidades/domínio, repositórios, serviços, controllers, middlewares, validadores, rotas e erros em módulos separados.
- Controllers fazem a tradução HTTP; regras de negócio ficam nos serviços; SQL fica nos repositórios.
- Validar corpos, parâmetros e consultas com Zod. Rejeitar campos protegidos ou não autorizados explicitamente.
- Usar consultas parametrizadas com `mysql2/promise`, transações para gravações relacionadas e erros HTTP consistentes.
- Autenticar com JWT e armazenar senhas com bcrypt. Obter identidade do funcionário exclusivamente do token validado.
- Não expor senha/hash, stack trace ou segredos nas respostas. Configurar Helmet, rate limit e variáveis de ambiente.
- Para ordens de serviço, seguir integralmente as regras e matriz da seção 27 da especificação mestre; manter decisões e transições históricas append-only.
- Criar testes unitários e de API com banco de testes isolado conforme escopo da fase. Nunca apontar testes destrutivos para dados reais.
- Não iniciar implementação funcional antes da aprovação da Fase 1.
