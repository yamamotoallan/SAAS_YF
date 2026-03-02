# SAAS_YF — Referência da API

Base URL: `https://saasyf-production.up.railway.app/api`

Todas as rotas protegidas requerem header: `Authorization: Bearer <token>`

---

## Autenticação

### `POST /auth/login`
```json
// Body
{ "email": "user@example.com", "password": "secret" }
// Response 200
{ "token": "jwt...", "user": { "id", "name", "email", "role", "company" } }
```

### `POST /auth/register`
```json
// Body
{ "email", "password", "name", "companyName", "industry?", "revenue?", "headcount?" }
// Response 201
{ "token": "jwt...", "user": { ... } }
```

### `POST /auth/forgot-password`
```json
{ "email": "user@example.com" }
// Response 200
{ "message": "Se o e-mail existir, um link será enviado." }
```

### `POST /auth/reset-password`
```json
{ "token": "reset-jwt...", "password": "newPassword" }
// Response 200
{ "message": "Senha alterada com sucesso" }
```

### `GET /auth/me`
```json
// Response 200
{ "id", "name", "email", "role", "company" }
```

---

## Clientes

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/clients?search=&status=&page=&limit=` | Listar (paginado) | Todos |
| GET | `/clients/:id` | Buscar por ID | Todos |
| GET | `/clients/:id/intelligence` | LTV, Health Score, Churn Risk | Todos |
| POST | `/clients` | Criar | Todos |
| PUT | `/clients/:id` | Atualizar | Todos |
| DELETE | `/clients/:id` | Remover | admin, manager |

---

## Fluxos Operacionais

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/flows` | Listar todos | Todos |
| GET | `/flows/:id` | Buscar com stages e items | Todos |
| GET | `/flows/:id/analytics` | Funnel, win rate, velocity | Todos |
| POST | `/flows` | Criar fluxo (+ stages opcionais) | admin |
| PUT | `/flows/:id` | Atualizar nome/tipo/descrição | Todos |
| DELETE | `/flows/:id` | Remover | admin |
| POST | `/flows/:id/stages` | Adicionar etapa | admin |

---

## Items (Cards do Kanban)

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/items?flowId=&status=` | Listar | Todos |
| GET | `/items/:id` | Buscar por ID | Todos |
| POST | `/items` | Criar card | Todos |
| PUT | `/items/:id` | Atualizar | Todos |
| PATCH | `/items/:id/move` | Mover de etapa | Todos |
| PATCH | `/items/:id/close` | Fechar (won/lost) | Todos |
| DELETE | `/items/:id` | Remover | admin, manager |

---

## Processos

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/process-blocks` | Listar blocos + processos | Todos |
| POST | `/process-blocks` | Criar bloco | Todos |
| PUT | `/process-blocks/items/:id` | Atualizar processo | Todos |
| GET | `/process-blocks/diagnosis` | Diagnóstico de maturidade | Todos |
| GET | `/process-blocks/actions` | Planos de ação sugeridos | Todos |

---

## KPIs

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/kpis?category=&status=` | Listar | Todos |
| POST | `/kpis` | Criar | admin, manager |
| PUT | `/kpis/:id` | Atualizar | Todos |
| DELETE | `/kpis/:id` | Remover | admin |

---

## Financeiro

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/financial?type=&period=&page=&limit=` | Listar (paginado) | Todos |
| GET | `/financial/summary` | Resumo (receita, custos, margem, anomalias, burn rate) | Todos |
| GET | `/financial/projection` | Projeção de caixa (6 meses) | Todos |
| POST | `/financial` | Criar lançamento | Todos |
| PUT | `/financial/:id` | Atualizar | Todos |
| DELETE | `/financial/:id` | Remover | admin |

---

## Pessoas

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/people?department=&status=&page=&limit=` | Listar (paginado) | Todos |
| GET | `/people/:id` | Buscar por ID | Todos |
| GET | `/people/summary` | Resumo (headcount, turnover, eNPS, equipes) | Todos |
| POST | `/people` | Criar (name, role, department, email?, phone?, salary?) | Todos |
| PUT | `/people/:id` | Atualizar | Todos |
| DELETE | `/people/:id` | Remover | admin, manager |

---

## Alertas

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/alerts?status=&type=&priority=` | Listar | Todos |
| POST | `/alerts` | Criar | Todos |
| PATCH | `/alerts/:id/resolve` | Resolver | Todos |
| PATCH | `/alerts/:id/dismiss` | Dispensar | Todos |
| DELETE | `/alerts/:id` | Remover | Todos |

---

## Metas (OKRs)

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/goals?type=&status=&period=` | Listar | Todos |
| POST | `/goals` | Criar meta | Todos |
| PUT | `/goals/:id` | Atualizar | Todos |
| DELETE | `/goals/:id` | Remover | Todos |
| POST | `/goals/:id/key-results` | Adicionar Key Result | Todos |
| PUT | `/goals/key-results/:id` | Atualizar Key Result | Todos |
| POST | `/goals/sync` | Sincronizar KRs com métricas reais | Todos |

---

## Empresa

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/company` | Dados da empresa logada | Todos |
| PUT | `/company` | Atualizar dados | Todos |
| GET | `/company/users` | Listar usuários da empresa | Todos |

---

## Regras de Negócio

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/rules` | Listar regras | Todos |
| POST | `/rules` | Criar regra | admin |
| PUT | `/rules/:id` | Atualizar regra | admin |
| DELETE | `/rules/:id` | Remover regra | admin |

---

## Dashboard

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/dashboard` | SGE Score, financeiro, pipeline, processos, alertas, heatmap, spider |

## Operações

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/operations/metrics` | Métricas de fluxos, gargalos, SLA, produtividade |

## Logs

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/logs?days=&limit=&module=&action=` | Activity logs (paginado) |

---

## Códigos de Erro

| Código | Significado |
|--------|-------------|
| 400 | Campos obrigatórios faltando |
| 401 | Token não fornecido / inválido / expirado |
| 403 | Sem permissão (role insuficiente) |
| 404 | Recurso não encontrado |
| 409 | Conflito (email já cadastrado) |
| 429 | Rate limit excedido |
| 500 | Erro interno do servidor |

## Health Check

`GET /api/health` → `{ "status": "ok", "timestamp": "..." }`
