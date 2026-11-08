# TORQUE

**Motorcycle Service Management** — sistema administrativo para oficinas de motocicletas. O TORQUE reúne cadastro e consulta de clientes, motocicletas e serviços, ordens de serviço com aprovação e histórico, perfil de usuário e um dashboard com indicadores operacionais.

As Fases 1 a 4 têm implementação e validações registradas abaixo. A Fase 5 está em andamento: os problemas de encaminhamento de `ref` nos componentes de formulário `TextField` e `TextAreaField` foram corrigidos e testados em Compose isolado. A revisão final da rubrica e a confirmação manual na instalação principal continuam pendentes; a Fase 5 não está concluída.

## Stack e organização

- `frontend/`: React + TypeScript + Vite, Tailwind CSS, React Router, Axios, Context API, Lucide React, React Hook Form e Zod.
- `backend/`: Node.js + TypeScript + Express, JWT, bcrypt, Zod, mysql2/promise, Helmet e express-rate-limit.
- `database/migrations/`: migrations SQL versionadas para MySQL 8.
- `nginx/`: proxy reverso e entrega do frontend.
- Docker Compose: serviços isolados, rede interna e volumes persistentes.

O backend está organizado em módulos de domínio/entidades, repositórios, serviços, controllers, middlewares, validadores e rotas. O frontend separa páginas, layout, UI, contexto, hooks e serviços de API.

## Fases

1. **Planejamento e estrutura** — concluída.
2. **Banco de dados e backend** — implementada; migration e suíte de integração MySQL 8 executadas com sucesso em 2026-11-03.
3. **Frontend** — implementação concluída; typecheck e build de produção aprovados.
4. **Infraestrutura final** — implementada e iniciada em projeto Docker isolado; healthchecks, rotas de borda e conexão ao MySQL verificados em 2026-11-03.
5. **Validação final** — em andamento; os testes recentes dos formulários estão registrados em “Fase 5 — validação dos formulários”. A conclusão permanece pendente da revisão final e das validações ainda não confirmadas na instalação principal.

Ao concluir cada fase, registrar arquivos, decisões, validações, resultados e pendências. Consultar `AGENTS.md` e as skills locais em `.agents/skills/`.

## Requisitos centrais

O produto terá autenticação e perfil de funcionário, dashboard, CRUD de clientes, motocicletas e serviços, ordens de serviço, busca avançada de motocicletas e interface responsiva. A seção 27 da especificação mestre é a fonte oficial para estados, aprovação, imutabilidade e histórico de ordens de serviço.

## Fase 2 — Banco e backend

O backend e a migration inicial estão implementados. Requisitos locais: Node.js 20+ e MySQL 8. Em 2026-11-03, `001_initial_schema.sql` foi aplicada no banco isolado `torque_test` (MySQL 8.0.46), e os testes reais de integração via API passaram. Para desenvolvimento, copie `../.env.example` para `backend/.env`, ajuste as credenciais para um banco apropriado e execute:

```sh
cd backend
npm install
npm run migrate
npm run dev
```

O servidor expõe `http://localhost:3000`; `GET /api/health` não requer autenticação. As migrations ficam em `database/migrations` e registram checksums em `schema_migrations`.

## Fase 3 — Frontend

O frontend inclui autenticação e restauração de sessão, perfil, dashboard, listagens/formulários de clientes, motocicletas, serviços e ordens, pesquisa avançada, paginação, confirmação de ações e layout responsivo. No diretório `frontend/`, use `npm install` e `npm run dev`. O Vite encaminha `/api` para `http://127.0.0.1:3000`.

O dashboard usa `GET /api/dashboard`; o faturamento cobre o mês calendário atual no fuso `America/Sao_Paulo`. O endpoint foi validado por teste de integração contra MySQL 8 isolado, comparando os agregados da API com consultas diretas ao mesmo banco. No frontend, typecheck e build de produção foram executados; a conferência visual autenticada depende de uma sessão e de dados reais disponíveis, e não foi substituída por registros simulados.

### Rotas implementadas

- Público: `POST /api/auth/register`, `POST /api/auth/login`.
- Perfil (JWT): `GET /api/users/me`, `PUT /api/users/me`.
- Dashboard (JWT): `GET /api/dashboard`; contagens reais e faturamento de OS concluídas no mês atual.
- Clientes: `GET/POST /api/clientes`, `GET/PUT/DELETE /api/clientes/:id`.
- Motocicletas: `GET/POST /api/motocicletas`, `GET/PUT/DELETE /api/motocicletas/:id`; busca textual e filtros combináveis por marca, modelo, cilindrada, cor, ano e proprietário (`cliente_id`).
- Serviços: `GET/POST /api/servicos`, `GET/PUT/DELETE /api/servicos/:id`; listagem aceita `ativo=true|false`, e exclusão desativa o serviço.
- Ordens: `GET/POST /api/ordens-servico`, `GET/PUT/DELETE /api/ordens-servico/:id`, `PATCH /api/ordens-servico/:id/status`, `PATCH /api/ordens-servico/:id/aprovacao`.

Listagens usam `page`, `limit` (padrão 10, máximo 100) e `search`; ordens também aceitam filtro `status`. Rotas administrativas exigem `Authorization: Bearer <token>`. As transições e decisões das OS usam bloqueio transacional, histórico de eventos e status imutáveis conforme a seção 27 da especificação.

### Validação da Fase 2

Dentro de `backend/`, execute `npm test`, `npm run typecheck` e `npm run build`. `npm test` cobre validações de domínio e endpoints sem conexão ao banco. `npm run test:integration` aplica a migration e cobre persistência via API no banco MySQL isolado descrito abaixo; nunca use esse executor contra banco de desenvolvimento.

Para testes de integração, `backend/docker-compose.test.yml` inicia apenas MySQL 8 com banco `torque_test`, porta local 33306, dados em `tmpfs` e sem volume persistente. Com Docker Desktop ativo, em `backend/`:

```powershell
docker compose -f docker-compose.test.yml up -d --wait
$env:NODE_ENV = 'test'
$env:MYSQL_HOST = '127.0.0.1'
$env:MYSQL_PORT = '33306'
$env:MYSQL_DATABASE = 'torque_test'
$env:MYSQL_USER = 'torque_test'
$env:MYSQL_PASSWORD = 'torque_test_only'
$env:JWT_SECRET = 'integration-test-only-secret-that-is-at-least-32-characters'
npm run test:integration
docker compose -f docker-compose.test.yml down
```

O executor recusa qualquer configuração diferente e confirma o hostname e a versão MySQL antes de aplicar a migration. Em 2026-11-03, confirmou `torque_test`, MySQL 8.0.46 e hostname `torque-mysql-test`; a migration foi aplicada e a suíte de integração executou **2 testes aprovados, 0 reprovados**. A suíte cobriu CRUD persistente de clientes/motocicletas/serviços, integridade referencial, transições, idempotência, aprovações concorrentes, rejeição após aprovação anterior, histórico, bloqueios de edição/exclusão e rollback. O container de teste usa `tmpfs` e foi removido após a execução.

No mesmo dia, `npm run typecheck`, `npm test` (**4 aprovados, 0 reprovados**) e `npm run build` também passaram no backend. Uma execução intermediária encontrou uma expectativa de busca incorreta no teste e, depois, um defeito na chave usada para desativar serviços com OS vinculadas; ambos foram corrigidos e a suíte foi repetida em um banco isolado limpo até passar. O executor de integração agora também aguarda a disponibilidade do MySQL antes de confirmar sua identidade.

Em 2026-11-03, a suíte complementar chamou `GET /api/dashboard` após criar os registros de integração e comparou todos os indicadores e os IDs das ordens recentes com consultas diretas ao mesmo MySQL 8.0.46. Resultado observado e coincidente com as consultas: 1 cliente, 1 motocicleta, 1 serviço ativo, 0 OS abertas, 1 em andamento, 1 concluída e faturamento do mês atual de 600; IDs recentes `[5,4,3,2,1]`. A API também retornou 401 para a rota sem JWT. Nenhuma validação depende de mocks ou dados permanentes fictícios.

## Fase 4 — Infraestrutura

O `docker-compose.yml` define MySQL 8 com volume persistente, uma rede interna exclusiva do banco, API Node compilada, uma etapa de migration versionada, frontend compilado servido por Nginx interno e Nginx de borda como único serviço com porta publicada. O frontend não participa da rede do banco; backend e MySQL não publicam portas no host. A porta de acesso do Nginx é configurável por `HTTP_PORT` (padrão 8080).

Os Dockerfiles usam builds multi-stage; a imagem da API é executada como usuário não-root. A migration roda como serviço de execução única antes da API e verifica o checksum da migration inicial já registrada.

### Iniciar a aplicação completa com Docker Compose

Execute a partir da raiz do projeto. O Compose lê as variáveis de `./.env`, constrói as imagens, inicia MySQL, aplica a migration antes da API e sobe backend, frontend e Nginx. Não é necessário iniciar cada serviço manualmente.

No PowerShell, prepare o arquivo de ambiente uma vez e substitua os valores demonstrativos por credenciais fortes e exclusivas:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env } else { Write-Output '.env já existe; revise-o sem sobrescrever.' }
```

Depois de editar `.env`, inicie e confira todos os serviços:

```powershell
docker compose config --quiet
docker compose up --build -d --wait
docker compose ps
Invoke-WebRequest http://localhost:8080/
Invoke-RestMethod http://localhost:8080/api/health
```

O frontend fica disponível em `http://localhost:8080`; a porta pode ser alterada por `HTTP_PORT` no `.env`. Para encerrar preservando o banco, use `docker compose down`. Evite `docker compose down -v` quando quiser manter os dados do volume `mysql_data`.

Somente o Nginx publica uma porta no host; o backend e o MySQL permanecem acessíveis pelas redes do Compose.

Validação executada em 2026-11-03 com o projeto isolado `torque-validation`: os cinco serviços iniciaram com healthchecks saudáveis (MySQL, migration concluída com código 0, backend, frontend e Nginx). O MySQL 8.4.13 registrou uma migration e zero usuários. A partir do host, `GET /` retornou HTTP 200 e `GET /api/health` retornou HTTP 200 através do Nginx. Uma consulta somente de leitura executada no container backend retornou `torque_validation`, MySQL 8.4.13, uma migration e zero usuários. O Nginx foi o único container com porta publicada. O projeto e seu volume isolado de validação foram removidos após a coleta das evidências.

### Validação complementar de OS e interface (2026-11-04)

Uma execução da suíte de integração em MySQL 8 isolado cobriu a edição de OS que preserva um serviço já associado quando ele é desativado. O teste cria uma OS com preço aplicado de 400, altera o preço do serviço para 450, desativa o serviço e edita a OS; a edição mantém o total e o preço histórico em 400, o status ABERTA e o histórico original. A criação de nova OS usando esse serviço inativo continua rejeitada. Resultado dessa execução: **2 testes aprovados, 0 reprovados**, em MySQL 8.0.46.

Na auditoria complementar de 2026-11-04, a migration `001_initial_schema.sql` e a suíte de integração foram executadas novamente em MySQL 8.4.13 (`torque_test`, hostname `torque-mysql-test`), em container descartável sem volume. Resultado: **2 testes aprovados, 0 reprovados**. A suíte registrou CRUD persistente, transições, decisões, histórico, concorrência e rollback; também comparou `GET /api/dashboard` com os agregados do banco: 1 cliente, 1 motocicleta, 1 serviço ativo, 0 OS abertas, 1 em andamento, 1 concluída e faturamento do mês de 600. Os registros foram fixtures efêmeras da suíte automatizada e não foram usados como evidência para validação de telas autenticadas. O container foi removido após a execução.

Um segundo projeto Compose isolado (`torque-phase5-audit`), com banco vazio, volume próprio e porta 18088, iniciou com os cinco serviços saudáveis. O registro da migration foi consultado antes e depois de reiniciar somente o MySQL: uma linha em ambas as leituras. `GET /api/health` retornou `ok` antes e depois do reinício. Os containers, redes e volume temporários foram removidos; a instância principal não foi interrompida.

Na validação visual headless de login e cadastro (1440×900, 768×1024 e 390×844), os documentos mantiveram a largura do viewport e os controles ficaram dentro da tela nos três tamanhos. Para 390 px, a borda direita máxima dos controles foi 370 px. A correção responsiva foi aplicada às páginas de login e cadastro e confirmada novamente após o build. As telas autenticadas permanecem sem validação visual: nenhuma conta real foi disponibilizada durante a execução, e nenhum dado simulado foi criado.

### Fase 5 — validação dos formulários (2026-11-06 e 2026-11-08)

Os testes abaixo foram executados pelo Codex em cópias isoladas da aplicação no Docker Compose, com bancos e volumes temporários. Eles validam a aplicação construída e executada em Docker, mas **não são testes da instalação principal do usuário**.

- **Cadastro de usuário (2026-11-06):** dados inválidos mostraram erros de nome, e-mail, CPF, senha e confirmação de senha; o formulário não enviou o cadastro inválido. Com dados válidos, a interface enviou `POST /api/auth/register` e recebeu **HTTP 201**. O backend recebeu o CPF normalizado, não recebeu o campo de confirmação e persistiu a senha como hash. Uma requisição inválida direta ao backend recebeu **HTTP 400**.
- **Cadastro de serviço (2026-11-08):** descrição vazia mostrou a mensagem de validação e não enviou a requisição. Com descrição e demais campos válidos, a interface enviou `POST /api/servicos` com nome, descrição, preço, duração e estado, e recebeu **HTTP 201**.
- **Build e tipos após as correções:** typecheck e build do frontend passaram. O build emitiu dois avisos não fatais do Rollup sobre comentários `@__PURE__` na dependência Zod.

As duas cópias de teste foram removidas após a coleta dos resultados. Não há, nesta documentação, evidência separada de uma validação manual na instalação principal; os resultados isolados acima não devem ser interpretados como tal.

### Pendências restantes

As validações de migrations, persistência, CRUDs, transações e ciclo de vida de OS solicitadas para a Fase 2, incluindo o dashboard, passaram nos casos registrados acima. Login e cadastro foram validados visualmente em desktop, tablet e celular. Permanecem pendentes a validação visual autenticada com uma sessão real, a confirmação manual das correções na instalação principal e a revisão final da rubrica. A Fase 5 não está declarada concluída.
