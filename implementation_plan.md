# SAAS YF - Plano de Evolução e Multi-Tenancy

Este documento descreve o plano de desenvolvimento para atender aos 9 pontos de evolução solicitados, divididos em três fases estratégicas para minimizar riscos arquiteturais e entregar valor rapidamente.

## Fase 1: Correções e Melhorias de UX (Quick Wins)
Foco em resolver bugs relatados e melhorar a usabilidade de telas existentes.

### 1. Performance: Metas & OKRs (Ponto 5)
- **Problema:** Falha na apresentação ao clicar em "Nova Meta".
- **Solução:** Investigar o formulário em [Metas.tsx](file:///c:/Users/YF/Downloads/SAAS_YF-main/SAAS_YF-main/src/pages/Metas.tsx) ou modal correspondente. Corrigir o estado de renderização e garantir que o formulário de criação de Goal/KeyResults abra corretamente sem quebrar a UI.

### 2. Inteligência: Central de Alertas (Ponto 6)
- **Problema:** Botão "Resolver" não tem ação efetiva estruturada.
- **Solução:** 
  - Adicionar uma tabela/campo no banco ou aproveitar o status atual, de forma que o botão "Resolver" abra um modal com um campo textual para a "Tratativa".
  - Adicionar link dinâmico no alerta para redirecionar o usuário para a página matriz do problema antes ou depois de resolvê-lo.

### 3. Inteligência: Mente de CEO (Ponto 7)
- **Problema:** Tela pouco instrutiva.
- **Solução:** Adicionar *tooltips* ou seções descritivas em cada um dos quadros, explicando conceitualmente como o sistema chegou naquele número e qual deve ser a postura do CEO perante a métrica.

### 4. Clientes: Correção de Filtros (Ponto 3)
- **Problema:** Filtros não funcionais na tela de Clientes.
- **Solução:** Refatorar a lógica de filtragem (ex: por status ou segmento) no componente [Clientes.tsx](file:///c:/Users/YF/Downloads/SAAS_YF-main/SAAS_YF-main/src/pages/Clientes.tsx) garantindo que a visualização final obedeça ativamente aos critérios de busca.

---

## Fase 2: Desenvolvimento de Novos CRUDs (Funcionalidades Core)
Foco em preencher as lacunas operacionais do sistema implementando páginas consistentes.

### 1. Auditoria / Configurações (Ponto 1)
- **Problema:** Tela de Configurações > Auditoria sem botão "Criar" e gestão.
- **Solução:** Entender qual é o modelo exato visual desta "auditoria" e implementar lista genérica estruturada com botão "Novo", modais de formulário e exclusão, construindo um CRUD coeso.

### 2. Módulo de Operações (Ponto 4)
- **Problema:** A página `Operações` está inacabada/inexistente.
- **Solução:** Desenvolver a interface visual de "Operações" (ex: Kanban de Fluxo Padrão), com CRUD completo, baseada nos modelos [OperatingFlow](file:///c:/Users/YF/Downloads/SAAS_YF-main/SAAS_YF-main/src/types/api.ts#70-81), [FlowStage](file:///c:/Users/YF/Downloads/SAAS_YF-main/SAAS_YF-main/src/types/api.ts#82-90) e [OperatingItem](file:///c:/Users/YF/Downloads/SAAS_YF-main/SAAS_YF-main/src/types/api.ts#91-111). A tela será bem documentada e componentizada de maneira similar aos outros módulos para manter coesão.

### 3. Ficha Detalhada do Cliente (Ponto 2)
- **Problema:** Clientes mostram apenas as "capas" (mocks). Não é possível visualizar informações de cada um separadamente.
- **Solução:** Adicionar um Drawer, Painel lateral ou Rota Dedicada (`/clientes/:id`) que ao clicar na capa liste os detalhes completos (Histórico de Tickets vinculados àquele Client, receitas contábeis que pertencem a ele, etc).

---

## Fase 3: Multi-Tenancy e Perfil Consultor (Arquitetura Completa)
Mudança arquitetural severa focando nos Pontos 8 e 9.

### User Review Required
> [!CAUTION]
> A injeção de Multi-Tenancy altera as rotas de backend (middlewares de autorização) e componentes frontend universais (Axios Interceptors, Context API). Realizaremos essa fase por último para proteger a estabilidade funcional das fases anteriores.

### 1. Separação de Acessos
- Atualização do controle de acesso: Criar o papel `consultant` no campo `role` da tabela [User](file:///c:/Users/YF/Downloads/SAAS_YF-main/SAAS_YF-main/src/types/api.ts#13-22) (ou usar o papel original de outra forma clara) e o papel padrão `client`.
- Usuários normais (Clientes) enxergarão informações limitadas estritamente à sua `companyId` logada.
- O Consultor terá bypass do middleware, enxergando TODOS os objetos se assinado como `companyId: null` ou se tiver o papel de Consultor expresso no JWT.

### 2. O "Seletor de Contexto do Cliente"
- Criar dropdown global `CompanySelector` na Navbar/Sidebar do Frontend.
- Caso o usuário seja Consultor, ele pode alternar seu "Contexto Atual" entre as empresas gerenciadas, e as telas carregarão automaticamente as informações pertinentes (ex: `GET /api/dashboard?targetCompanyId=123`).
- Se selecionar a visão de "Todo o Portfólio", os dashboards apresentarão as somatórias globais e um rankeamento de como as empresas daquela consultoria estão performando no SGE Score.

---

## Processo de Implementação
Aguardando o "OK" do usuário para prosseguir, iniciaremos o ataque pelo ponto 1 até o 9 progressivamente.
