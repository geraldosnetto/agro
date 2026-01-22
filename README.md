# AgroIndica

Dashboard de cotações agrícolas brasileiras em tempo real com dados oficiais do CEPEA/ESALQ e Banco Central.

## Stack

- **Next.js 16** (App Router, React Server Components)
- **React 19** + **TypeScript 5**
- **Tailwind CSS 4**
- **Prisma 7** + **PostgreSQL**
- **Recharts** (gráficos)
- **SWR** (data fetching)
- **Radix UI** (componentes acessíveis)

## Funcionalidades

- 11 commodities (Soja, Milho, Boi Gordo, Café, Etanol, etc.)
- 3 categorias: Grãos, Pecuária, Sucroenergetico
- Gráficos históricos (7, 30, 90, 365 dias)
- Dólar PTAX em tempo real
- Ticker animado com variações
- Dark/Light mode
- Mobile-first

## Estrutura

```
src/
├── app/                    # Rotas Next.js
│   ├── (dashboard)/        # Layout com Header/Footer
│   │   └── cotacoes/       # Página principal
│   └── api/                # API Routes
│       ├── cotacoes/       # GET cotações e histórico
│       └── admin/          # Atualização de preços
├── components/
│   ├── dashboard/          # CotacaoCard, PriceChart, Sparkline
│   ├── layout/             # Header, Footer, Ticker
│   └── ui/                 # Shadcn components
└── lib/
    ├── data-sources/       # BCB, CEPEA scrapers
    └── prisma.ts           # Cliente Prisma
```

## Instalação

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Editar .env com DATABASE_URL e CRON_SECRET

# Criar banco e rodar migrations
npx prisma migrate dev

# Popular dados iniciais
npx tsx prisma/seed.ts

# Rodar em desenvolvimento
npm run dev
```

## Variáveis de Ambiente

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/indicagro
CRON_SECRET=sua-chave-secreta
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## API

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/cotacoes` | GET | Lista cotações (query: `categoria`) |
| `/api/cotacoes/[slug]/historico` | GET | Histórico (query: `days`) |
| `/api/admin/update-prices` | POST | Atualiza preços (auth required) |

## Fontes de Dados

- **CEPEA/ESALQ** - Indicadores agropecuários (web scraping)
- **BCB** - Dólar PTAX via API Open Data

## Scripts

```bash
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run start        # Rodar produção
npm run lint         # ESLint
npx tsx prisma/seed.ts              # Seed do banco
npx tsx scripts/diagnose-cepea.ts   # Diagnóstico CEPEA
```

## Licença

Projeto privado.
