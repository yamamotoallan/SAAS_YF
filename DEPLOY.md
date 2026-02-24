# YF Consultoria — Guia de Deploy em Produção

## Visão Geral da Arquitetura

| Componente | Tecnologia | Hospedagem |
|---|---|---|
| **Frontend** | React + Vite | **Vercel** |
| **Backend API** | Node.js + Express + TypeScript | **Railway** |
| **Banco de Dados** | PostgreSQL + Prisma | **Railway** (ou Neon.tech) |

---

## 1. Variáveis de Ambiente

### Backend (Railway)
Configure as seguintes variáveis no painel do Railway:

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Chave secreta para assinar tokens JWT | Mínimo 32 chars aleatórios |
| `PORT` | Porta do servidor | `3001` |
| `NODE_ENV` | Ambiente | `production` |

### Frontend (Vercel)
Configure no painel da Vercel em **Project → Settings → Environment Variables**:

| Variável | Descrição | Exemplo |
|---|---|---|
| `VITE_API_URL` | URL completa do backend no Railway | `https://yf-api.up.railway.app/api` |

---

## 2. Deploy do Backend (Railway)

### Passo a passo:

1. **Crie um novo projeto** no [railway.app](https://railway.app)

2. **Conecte o repositório GitHub** — aponte para a pasta `backend/`

3. **Configure o Root Directory** para `backend/`

4. **Adicione as variáveis de ambiente** (ver Seção 1)

5. O Railway irá detectar o `package.json` e executar automaticamente:
   ```bash
   npm install
   npm run build
   npm start    # → node dist/src/server.js
   ```

6. **Após deploy, rode as migrations**:
   - Acesse o Railway Shell ou configure um Start Command temporário:
   ```bash
   npx prisma migrate deploy
   ```

7. **Verifique** acessando `https://sua-url.railway.app/api/health` (ou qualquer endpoint autenticado)

---

## 3. Deploy do Frontend (Vercel)

### Passo a passo:

1. **Crie um novo projeto** no [vercel.com](https://vercel.com)

2. **Conecte o repositório GitHub**

3. **Configure as Build Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `/` (raiz do projeto, onde está o `package.json` do frontend)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Adicione a variável de ambiente** `VITE_API_URL` com a URL do backend Railway

5. **Verifique que o `vercel.json` está presente** na raiz:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
   Isso garante que as rotas do React Router funcionem corretamente.

6. **Deploy!** — A Vercel detecta o push e faz deploy automático.

---

## 4. Banco de Dados

### Opção A: PostgreSQL no Railway

1. Adicione um serviço PostgreSQL ao seu projeto Railway
2. Copie a `DATABASE_URL` gerada e configure no serviço do backend
3. Rode as migrations: `npx prisma migrate deploy`
4. (Opcional) Rode o seed para dados iniciais: `npx ts-node prisma/seed.ts`

### Opção B: Neon.tech (PostgreSQL Serverless)

1. Crie um banco em [neon.tech](https://neon.tech)
2. Use a connection string fornecida como `DATABASE_URL`
3. Siga os mesmos passos de migration acima

---

## 5. Checklist Final

- [ ] `DATABASE_URL` configurada no Railway
- [ ] `JWT_SECRET` configurada (mínimo 32 chars)
- [ ] `VITE_API_URL` configurada na Vercel apontando para o Railway
- [ ] Migrations rodadas (`prisma migrate deploy`)
- [ ] Login funcional em produção
- [ ] Verificar CORS — o backend aceita requisições da URL da Vercel

### Verificar CORS

No arquivo `backend/src/server.ts`, confirme que a URL do frontend Vercel está na lista de origins permitidas:

```typescript
const corsOptions = {
  origin: [
    'http://localhost:5173', // dev
    'https://seu-app.vercel.app', // produção
  ],
};
```

---

## 6. Atualizações Futuras

Para atualizar o sistema após mudanças de código:

1. Faça `git push` para o repositório
2. Railway e Vercel detectam o push e fazem deploy automático
3. Se houver mudanças no schema Prisma: rode `npx prisma migrate deploy` manualmente via Railway Shell
