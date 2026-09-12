# JoyFix Tracker

Sistema interno para gerenciar a operação da JoyFix: estoque de controles, peças, manutenções e vendas/lucros.

## Tecnologias

**Backend** (`/backend`)
- Node.js + Express
- SQLite (better-sqlite3)
- TypeScript + tsx

**Frontend** (`/frontend`)
- React 19 + Vite
- TypeScript
- Tailwind CSS
- React Router
- Recharts (relatórios/gráficos)
- Zod (validação de formulários)

## Requisitos

- Node.js 18+
- npm

## Instalação e Setup

```bash
# Backend
cd backend
npm install
npm run setup        # roda migrations + seed com dados de exemplo

# Frontend
cd ../frontend
npm install
```

## Como rodar

```bash
# Terminal 1 - Backend (API na porta 3001)
cd backend
npm run dev

# Terminal 2 - Frontend (app na porta 5173)
cd frontend
npm run dev
```

Acesse `http://localhost:5173`. O frontend usa proxy do Vite para a API em `http://localhost:3001`.

## Scripts

| Comando         | Descrição                                            |
| --------------- | ---------------------------------------------------- |
| `npm run dev`   | Inicia o servidor com hot-reload (backend) / Vite (frontend) |
| `npm run setup` | Executa migrations e seed (back-end)                 |
| `npm run migrate` | Aplica apenas as migrations                        |
| `npm run seed`  | Insere apenas os dados de exemplo                    |
| `npm run build` | Compila TypeScript (backend) / build de produção (frontend) |

## Funcionalidades

- **Dashboard**: resumo de controles por status, peças em estoque, lucro total e manutenções recentes
- **Controles**: listar, criar, editar, consultar detalhes e atualizar status (Estoque, Em manutenção, Pronto, Vendido, Sucata)
- **Manutenções**: registrar consertos com peças utilizadas, custo de mão de obra e total
- **Peças**: controle de estoque com alerta de estoque baixo
- **Relatórios**: lucro por período, gráficos de vendas e custos

## API

| Método | Rota                       | Descrição                              |
| ------ | -------------------------- | -------------------------------------- |
| GET    | `/api/dashboard/stats`     | Indicadores do dashboard               |
| GET    | `/api/controllers`         | Lista de controles (com filtros)       |
| POST   | `/api/controllers`         | Cria um controle                       |
| GET    | `/api/controllers/:id`     | Detalhe de um controle                 |
| PUT    | `/api/controllers/:id`     | Atualiza um controle                   |
| DELETE | `/api/controllers/:id`     | Remove um controle                     |
| GET    | `/api/parts`               | Lista de peças                         |
| POST   | `/api/parts`               | Cria uma peça                          |
| PUT    | `/api/parts/:id`           | Atualiza uma peça                      |
| GET    | `/api/maintenance?controllerId=` | Histórico de manutenções          |
| POST   | `/api/maintenance`         | Registra uma manutenção                |
| GET    | `/api/transactions`        | Transações (compras e vendas)          |
| POST   | `/api/transactions`        | Registra uma transação                 |

## Estrutura do Banco

Tabelas: `controllers`, `parts`, `maintenance_logs`, `transactions`. O banco SQLite fica em `backend/joyfix.db` e é criado automaticamente pelas migrations.