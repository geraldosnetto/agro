# Claude - Contexto do Projeto IndicAgro

> Arquivo de referência rápida para manter contexto entre sessões.

---

## Sobre o Projeto

**IndicAgro** - Plataforma gratuita para acompanhamento de cotações de commodities agrícolas brasileiras. Objetivo: ser o "Datagro para o produtor rural" com interface moderna e acessível.

---

## Stack Técnica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL |
| Gráficos | Recharts |
| Auth | NextAuth.js (OAuth + Email/Senha) |
| Deploy | Docker + VPS (Hostinger) |
| Dados | CEPEA (scraping), BCB API (PTAX), OpenMeteo (clima) |

---

## Estrutura de Pastas

```
src/
├── app/                    # App Router (Next.js)
│   ├── (auth)/            # Rotas de autenticação
│   ├── (dashboard)/       # Rotas protegidas/dashboard
│   └── api/               # API Routes
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── dashboard/         # Componentes do dashboard
│   └── auth/              # Componentes de autenticação
├── lib/
│   ├── data-sources/      # Fontes de dados (CEPEA, BCB, news)
│   └── utils/             # Utilitários
└── prisma/                # Schema do banco
```

---

## Funcionalidades Implementadas

### Core
- [x] Dashboard com 16 commodities (CEPEA)
- [x] Dólar PTAX (API BCB)
- [x] Páginas detalhadas `/cotacoes/[slug]`
- [x] Autenticação (NextAuth + OAuth Google/GitHub + Email)
- [x] Alertas de preço
- [x] Favoritos
- [x] Múltiplas praças/regiões
- [x] Exportação CSV/Excel
- [x] Previsão do tempo `/clima`
- [x] Feed de notícias `/noticias`
- [x] Comparador de commodities `/comparar`
- [x] Dark mode

### Ferramentas
- [x] **Mapa de Calor** `/mapa` - Visualização de preços por estado
- [x] **Calculadora de Rentabilidade** `/calculadora` - Custos, margens e ponto de equilíbrio

### Módulo de IA (100% Completo)
- [x] **Chatbot IA** `/assistente` + Widget flutuante (Claude Haiku)
- [x] **Relatórios IA** `/relatorios` - Resumo diário + Análises semanais (Claude Sonnet)
- [x] **Previsões de Preço** - SMA, EMA, Regressão Linear (TypeScript puro)
- [x] **Análise de Sentimento** - Classificação de notícias por IA
- [x] **Detecção de Anomalias** - Alertas de preços atípicos (Z-score, volatilidade)

---

## Módulo de IA (100% Completo - 31/01/2026)

### Arquitetura
```
src/lib/ai/
├── anthropic.ts           # Cliente Claude API (Haiku p/ chat, Sonnet p/ relatórios)
├── rate-limit-ai.ts       # Rate limiting por plano
├── prompts/
│   ├── chat-assistant.ts  # System prompt do chatbot
│   ├── market-report.ts   # Prompts para relatórios
│   └── sentiment.ts       # Prompt análise de sentimento
├── generators/
│   ├── daily-report.ts    # Gerador de resumo diário (com histórico)
│   └── commodity-report.ts # Gerador de análise semanal (com histórico)
└── rag/
    └── context-builder.ts # Construtor de contexto RAG

src/lib/ml/
├── predictions/           # Previsões de preço (TypeScript puro)
│   ├── index.ts
│   ├── moving-average.ts  # SMA e EMA
│   ├── trend-analysis.ts  # Regressão linear
│   ├── volatility.ts      # Análise de volatilidade
│   └── price-predictor.ts # Ensemble
└── anomaly/
    └── detector.ts        # Detecção de anomalias (Z-score, volatilidade)

src/components/ai/
├── ChatWidget.tsx         # Widget flutuante do chat
├── PredictionCard.tsx     # Card de previsão de preços
├── SentimentBadge.tsx     # Badge de sentimento
├── SentimentWidget.tsx    # Widget de sentimento agregado
├── AnomalyAlert.tsx       # Alertas de anomalias
└── ReportRenderer.tsx     # Renderizador de relatórios markdown

src/app/api/ai/
├── chat/route.ts          # API do chatbot
├── predictions/[slug]/route.ts
├── sentiment/route.ts     # Análise de sentimento (POST/GET)
├── anomalies/route.ts     # Buscar/marcar anomalias (GET/PATCH)
└── reports/
    ├── daily/route.ts
    └── commodity/[slug]/route.ts

src/app/api/cron/          # Jobs agendados
├── generate-daily-report/route.ts    # Cron diário (08:00)
├── generate-weekly-reports/route.ts  # Cron semanal (seg 08:00)
└── check-anomalies/route.ts          # Cron diário após cotações
```

### Rate Limits por Plano
| Recurso | Free | Pro | Business |
|---------|------|-----|----------|
| Chat msgs/dia | 10 | 100 | Ilimitado |
| Relatórios/dia | 3 | 20 | Ilimitado |
| Previsões/dia | 5 | 50 | Ilimitado |
| Tokens/dia | 10k | 100k | Ilimitado |

### Variável de Ambiente
```env
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Roadmap

### ✅ Fase 2 - IndicAgro IA (COMPLETO)
1. ~~Chatbot/Assistente especializado~~ ✅
2. ~~Relatórios automáticos (LLM) com histórico~~ ✅
3. ~~Previsões de preço (TypeScript - SMA/EMA/Regressão)~~ ✅
4. ~~Análise de sentimento de notícias~~ ✅
5. ~~Detecção de anomalias~~ ✅

### ✅ Ferramentas (COMPLETO)
- ~~Mapa de calor `/mapa`~~ ✅
- ~~Calculadora de rentabilidade `/calculadora`~~ ✅

### Próximas Features (Fase 3)
- [ ] Notificações push (PWA)
- [ ] App mobile (React Native ou PWA)
- [ ] API pública para integrações
- [ ] Exportação PDF dos relatórios
- [ ] Dashboard customizável

---

## Regras de Desenvolvimento (SEGUIR RIGOROSAMENTE)

### 🚫 Proibições Absolutas (Inaceitável)
1. **Nunca fazer downgrade** de bibliotecas/dependências. Resolver a compatibilidade, não fugir dela.
2. **Nunca simplificar ou falsificar testes** para passar. Encontrar o erro real.
3. **Nunca fazer "quick fixes"** (gambiarras). Soluções temporárias são dívida técnica imediata.
4. **Nunca usar `any`, `any[]` ou `as any`**. TypeScript é para segurança. Use type narrowing/guards.
5. **Nunca "esconder" erros**. Nada de `try/catch` vazio, `.passthrough()` em Zod, ou ignorar validações.
6. **Nunca assumir caminhos de produção** (ex: `/opt/`). Verificar o ambiente real sempre.
7. **Nunca usar cores hardcoded** (ex: `blue-500`, `green-600`). SEMPRE consultar `globals.css` e usar tokens do design system (`primary`, `destructive`, `chart-1`, `muted`, etc). Cores semânticas garantem consistência e suporte a dark mode.

### ✅ Processo & Metodologia
8. **Preview Visual Obrigatório:** Sempre conferir no browser se o que foi codado realmente funciona visualmente.
9. **Planejamento Antes de Código:** Pensar, desenhar e planejar passo a passo antes de digitar.
10. **Divisão de Tarefas:** Quebrar problemas grandes em etapas menores e testáveis.
11. **Schema-First:** Definir contratos (Zod/Interfaces) ANTES da lógica. Backend e Frontend devem concordar no contrato primeiro.
12. **Server is Source of Truth:** O Backend dita a estrutura. O Frontend se adapta.
13. **Reiniciar Dev Server:** Ao terminar uma tarefa que modifica código, sempre reiniciar o servidor de desenvolvimento (`npm run dev`) para garantir que as mudanças estão funcionando.

### 🛠️ Engenharia & Qualidade
14. **Fix Priority (Bugs de Dados):**
    1. Logar erro detalhado (identificar campos).
    2. Corrigir origem (Backend).
    3. Atualizar Schema.
    4. *Jamais* relaxar validação no cliente.
15. **Logging Detalhado:** Em falhas de validação, logar *quais* campos falharam e *por quê*.
16. **Perguntar Sempre:** Na dúvida, pergunte. Não assuma.

### 🔄 Melhoria Contínua
17. **Refactoring (Boy Scout Rule):** Deixar o código sempre melhor do que encontrou.
18. **Atomicidade e Limpeza:** Manter commits/tarefas focados. Código limpo é responsabilidade de todos.

---

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Prisma
npx prisma generate
npx prisma db push
npx prisma studio

# Docker
docker-compose up -d
```

---

## Notas de Sessão

*Atualize aqui com contexto relevante da sessão atual.*

- **28/01/2026**: Sessão inicial. Usuário apresentou projeto e regras.
- **28/01/2026**: Implementado módulo de IA com chatbot:
  - Instalado @anthropic-ai/sdk
  - Criados schemas Zod para IA (src/lib/schemas/ai.ts)
  - Adicionados modelos Prisma (ChatConversation, ChatMessage, AIUsage, etc)
  - Implementado cliente Anthropic com configurações por tipo de uso
  - Implementado rate limiting por plano (free/pro/business)
  - Criado context builder RAG para contexto de mercado
  - Criada API do chat (POST/GET /api/ai/chat)
  - Criado ChatWidget flutuante
  - Criada página /assistente com interface completa
- **28/01/2026**: Implementado sistema de relatórios de IA:
  - Prompts específicos para relatórios (market-report.ts)
  - Gerador de resumo diário (daily-report.ts) com cache de 6h
  - Gerador de análise semanal por commodity (commodity-report.ts) com cache de 24h
  - APIs: /api/ai/reports/daily e /api/ai/reports/commodity/[slug]
  - Página /relatorios com interface completa
  - Relatórios de commodity são exclusivos para planos Pro/Business
  - Usando Claude Sonnet para qualidade nos relatórios
- **28/01/2026**: Implementado sistema de previsão de preços (TypeScript puro, sem LLM):
  - Algoritmos: SMA (Média Móvel Simples), EMA (Exponencial), Regressão Linear
  - Ensemble combina os 3 modelos com pesos dinâmicos baseados em R² e volatilidade
  - Cálculo de confiança baseado em concordância entre modelos
  - API: GET /api/ai/predictions/[slug]?horizon=7|14|30
  - Componente PredictionCard integrado na página de detalhes da commodity
  - Rate limiting: 5/dia (free), 50/dia (pro), ilimitado (business)
  - Disclaimer obrigatório: "Não é recomendação de investimento"
- **31/01/2026**: Verificação e atualização de status - **TODAS AS FEATURES COMPLETAS**:
  - ✅ Análise de Sentimento: API `/api/ai/sentiment`, componentes SentimentBadge/SentimentWidget
  - ✅ Detecção de Anomalias: detector.ts (Z-score, volatilidade), API `/api/ai/anomalies`, cron check-anomalies
  - ✅ Relatórios automáticos: cron jobs para geração diária/semanal, histórico com seletor de datas
  - ✅ Mapa de Calor `/mapa`: BrazilMap.tsx, HeatMapContainer.tsx
  - ✅ Calculadora de Rentabilidade `/calculadora`: CalculatorForm.tsx, CalculatorResults.tsx, profitability.ts
  - Módulo de IA 100% completo conforme plano original

---
