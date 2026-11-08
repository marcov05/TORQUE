# Database & Infrastructure

Use esta orientação para banco e infraestrutura TORQUE nas fases autorizadas.

- Usar MySQL 8 e migrations SQL versionadas. Não substituir por SQLite ou outro banco.
- Modelar chaves primárias/estrangeiras, constraints, índices e regras de exclusão para preservar integridade e histórico.
- Usar InnoDB e transações nas operações que alterem múltiplos registros. Evoluir o schema por migration; não editar migrations já aplicadas.
- Preservar ordens de serviço, itens, solicitações/decisões e eventos de status. Consultar a seção 27 da especificação mestre para o ciclo de vida e histórico append-only.
- Manter segredos fora do repositório; fornecer apenas valores de exemplo não sensíveis em `.env.example`.
- Configurar Docker Compose, MySQL, volumes, redes, API, frontend e Nginx nas fases previstas, com health checks e dependências coerentes.
- Nunca executar testes destrutivos contra banco de desenvolvimento/produção; usar banco de testes isolado.
- Não iniciar migrations ou infraestrutura final antes da fase autorizada.
