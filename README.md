# YF Consultoria - Sistema de Gestão Integrada (MVP)

Sistema SaaS B2B desenvolvido para a YF Consultoria, focado em diagnóstico empresarial, eficiência operacional e gestão estratégica.

![Status do Projeto](https://img.shields.io/badge/status-MVP%20Conclu%C3%ADdo-success)
![Versão](https://img.shields.io/badge/version-1.0.0-blue)
![Stack](https://img.shields.io/badge/stack-React%20%7C%20Vite%20%7C%20TypeScript-blueviolet)

## 🚀 Sobre o Projeto

Este sistema atua como um "Mission Control" para empresas, unificando ERP, CRM e ferramentas de diagnóstico em uma interface moderna e intuitiva. Ele foi desenhado para escalabilidade (Planos C, B, A) e para fornecer insights automáticos ao invés de apenas registrar dados.

### Módulos Principais

1.  **📊 Dashboard Executivo**: Visão consolidada de estratégia, operação, finanças e pessoas. Identificação imediata de riscos e oportunidades.
2.  **🧠 Maturidade de Processos**: Avaliação de 30 processos padrão (6 blocos), gerando Score de Maturidade e diagnóstico automático.
3.  **⚡ Eficiência Operacional**: Análise de gargalos em fluxos (ex: Funil de Vendas), com cálculo de ciclo médio, SLA e retrabalho.
4.  **🔄 Operações Unificadas (Fluxos/Kanban)**: Gestão visual de qualquer unidade de trabalho (Leads, Projetos, Chamados) em um board universal.
5.  **🤝 CRM (Clientes)**: Gestão da carteira de clientes e relacionamento.
6.  **💰 Financeiro & Pessoas**: Acompanhamento de KPIs essenciais de sustentabilidade e clima organizacional.

## 🛠️ Tecnologias Utilizadas

-   **Frontend**: React 18, TypeScript, Vite
-   **Estilização**: CSS Modules (Variáveis Globais, Design System próprio), Lucide React (Ícones)
-   **Roteamento**: React Router Dom v6
-   **Build**: Vite (Rollup)

## 📦 Instalação e Execução

### Pré-requisitos
-   Node.js (versão 16 ou superior)
-   npm ou yarn

### Passo a Passo

1.  **Clone o repositório**
    ```bash
    git clone https://github.com/seu-usuario/yf-consultoria-saas.git
    cd yf-consultoria-saas
    ```

2.  **Instale as dependências**
    ```bash
    npm install
    ```

3.  **Execute em modo de desenvolvimento**
    ```bash
    npm run dev
    ```
    O sistema estará acessível em `http://localhost:5173`.

4.  **Build para Produção**
    ```bash
    npm run build
    ```
    Os arquivos otimizados serão gerados na pasta `dist/`.

## 📂 Estrutura do Projeto

```
src/
├── components/      # Componentes reutilizáveis (Layout, UI)
├── data/            # Mock data e definições de tipos (Simulação de Backend)
├── pages/           # Telas principais da aplicação
│   ├── Dashboard    # Visão Geral
│   ├── Processos    # Módulo de Maturidade
│   ├── Operacao     # Módulo de Eficiência
│   ├── Fluxos       # Kanban Unificado
│   ├── Clientes     # CRM
│   └── ...          # Outros módulos (Finanças, RH, Config)
├── styles/          # Variáveis globais e tokens de design
├── App.tsx          # Configuração de Rotas
└── index.css        # Estilos globais e reset
```

## 🎨 Design System

O projeto utiliza um sistema de design consistente focado em legibilidade e hierarquia visual:
-   **Cores**: Paleta sóbria (Slate/Blue) com acentos semânticos (Success, Warning, Danger).
-   **Tipografia**: Inter (Google Fonts) para interface limpa e moderna.
-   **Interações**: Feedback visual em hover, transições suaves (`animate-fade`) e micro-interações.

---

Desenvolvido para **YF Consultoria**.
