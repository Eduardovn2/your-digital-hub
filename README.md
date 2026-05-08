---

## ✒️ Autor

Desenvolvido por **Eduardo Viana** – Desenvolvedor Fullstack & Especialista em Automação.

---

### Dica para o seu GitHub:
Como o layout **Glass** é um ponto forte, não esqueça de adicionar uma pasta `assets` ou `screenshots` no seu repositório e incluir imagens do dashboard aqui no README usando `![Dashboard](./screenshots/dashboard.png)`. Isso valoriza muito o projeto visualmente!

Este é um excelente projeto para o seu portfólio, especialmente por unir tecnologias modernas de frontend com integrações complexas de pagamento e autenticação. Como você está usando o **Supabase** e o **Mercado Pago** no seu dashboard, é importante destacar a robustez do backend e a segurança.

Aqui está uma proposta de **README.md** profissional, focada em atrair a atenção de recrutadores e outros desenvolvedores:

---

# 🛒 VianaHub - E-commerce Intelligence

![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-blue)
![License](https://img.shields.io/badge/License-MIT-green)

O **VianaHub** é uma solução completa de E-commerce para o setor alimentício, focada em oferecer uma experiência fluida de compra e uma gestão simplificada para o lojista. Com um design moderno baseado na estética **Glassmorphism**, o projeto une alta performance com uma interface visualmente impactante.

---

## 💎 Diferenciais do Projeto

### 🎨 Design & UX
*   **Glassmorphism UI:** Interface moderna com transparências, desfoque de fundo e bordas sutis, seguindo as tendências de design de alto padrão.
*   **Customização por Lojista:** Sistema que permite a cada lojista aplicar sua identidade visual (cores e temas) de forma dinâmica.
*   **Hubs Dedicados:** Áreas exclusivas e intuitivas para o **Cliente** (pedidos, histórico, perfil) e para o **Lojista** (estoque, vendas, dashboard).

### ⚙️ Funcionalidades Core
*   **Autenticação Segura:** Login via Google OAuth e E-mail (Magic Links/Password) via Supabase.
*   **Gestão de Pagamentos:** Integração nativa com a API do **Mercado Pago** para pagamentos online seguros.
*   **Real-time Notifications:** Webhooks configurados para notificações de novos pedidos em tempo real.
*   **Dashboard de Vendas:** Visão analítica para lojistas monitorarem faturamento e métricas de entrega.

---

## 🚀 Tecnologias Utilizadas

Este projeto foi construído com o que há de mais moderno no ecossistema web:

*   **Frontend:** React.js / Next.js
*   **Estilização:** CSS-in-JS ou Tailwind CSS (focado em Glassmorphism)
*   **Backend & DB:** Supabase (PostgreSQL, Auth e Real-time)
*   **Pagamentos:** Mercado Pago SDK
*   **Automação/Testes:** Selenium / Playwright

---

## 🛠️ Como executar o projeto

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/vianahub.git](https://github.com/seu-usuario/vianahub.git)
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente (`.env`):**
    Crie um arquivo `.env` na raiz e adicione suas credenciais:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=seu_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key
    MERCADO_PAGO_PUBLIC_KEY=sua_key
    ```

4.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

---

## 🏗️ Estrutura do Projeto
```text
src/
├── components/       # Componentes reutilizáveis (Glass UI)
├── hooks/            # Lógica de estado e chamadas API
├── pages/            # Rotas da aplicação (Client/Admin Hubs)
├── services/         # Integrações (Supabase, Mercado Pago)
└── styles/           # Temas globais e variáveis de cor
