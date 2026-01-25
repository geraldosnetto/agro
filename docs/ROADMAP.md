# IndicAgro - Roadmap de Produto

> Documento gerado em 22/01/2026 com base em análise competitiva de mercado.
> Atualizado em 23/01/2026 com estratégia de monetização, feed de notícias e IndicAgro IA.

---

## Visão do Produto

**IndicAgro** é uma plataforma gratuita e moderna para acompanhamento de cotações de commodities agrícolas brasileiras. Nosso objetivo é ser o **"Datagro para o produtor rural"** - mesma qualidade de dados, mas com interface simples, mobile-first e acessível.

---

## Análise Competitiva

### Concorrentes Nacionais

| Concorrente | Pontos Fortes | Pontos Fracos |
|-------------|---------------|---------------|
| **[Notícias Agrícolas](https://www.noticiasagricolas.com.br/)** | 25+ categorias, bolsas internacionais, widget embeddable | Interface datada |
| **[Agrolink](https://www.agrolink.com.br/)** | 4.878 preços/dia, 997 cidades, previsão do tempo | UX complexa |
| **[CEPEA](https://www.cepea.org.br/)** | Fonte oficial, API (paga R$10.500+), séries históricas | Sem interface moderna |
| **[Canal Rural](https://www.canalrural.com.br/)** | Análises com IA, vídeos | Foco em notícias |
| **[Datagro](https://portal.datagro.com/)** | 50k+ séries, app mobile, WhatsApp alerts | Enterprise ($$), UX densa |

### Concorrentes Internacionais

| Concorrente | Pontos Fortes |
|-------------|---------------|
| **[CME Group](https://www.cmegroup.com/markets/agriculture.html)** | Alertas de preço, APIs REST/streaming, dados real-time |
| **[DTN](https://www.dtnpf.com/agriculture/web/ag/markets)** | 2M clientes, weather analytics, insights acionáveis |
| **[S&P Global](https://www.spglobal.com/commodity-insights/en/commodity/agriculture)** | Análises profissionais, dados históricos |
| **[Fastmarkets](https://www.fastmarkets.com/agriculture/)** | Spot/forward pricing, biocombustíveis, orgânicos |

---

## O Que o IndicAgro Já Tem

- [x] Design moderno e responsivo (Next.js 16 + Tailwind)
- [x] Gráficos interativos (Recharts)
- [x] Dados CEPEA em tempo real (16 commodities)
- [x] Categorias organizadas (Grãos, Pecuária, Sucroenergetico, Fibras, Outros)
- [x] Dólar PTAX integrado (API BCB)
- [x] Sparklines nos cards
- [x] Seletor de commodity no gráfico principal
- [x] Dark mode

---

## 🚀 Em Desenvolvimento Agora

### Página Detalhada por Commodity (`/cotacoes/[slug]`)

**Status:** Em desenvolvimento

**Objetivo:** Criar uma página dedicada para cada commodity com todas as informações relevantes em um só lugar.

**Componentes:**
1. Header com preço atual e variações
2. Gráfico grande com seletores de período
3. Cards de estatísticas (mín/máx/média/volatilidade)
4. Tabela de preços por região
5. Informações do produto
6. Botões de ação (alerta, download, compartilhar)

**Arquivos a criar/modificar:**
- `src/app/(dashboard)/cotacoes/[slug]/page.tsx` - Página principal
- `src/components/dashboard/CommodityStats.tsx` - Cards de estatísticas
- `src/components/dashboard/RegionPrices.tsx` - Tabela de preços por região
- `src/components/dashboard/CotacaoCard.tsx` - Adicionar link para detalhe

---

## Roadmap de Features

### Fase 1: Fundação (Curto Prazo)

#### 1.1 Página Detalhada por Commodity ⭐ PRÓXIMO
**Prioridade:** MÁXIMA | **Referência:** Todos os concorrentes

Página dedicada para cada commodity com informações completas.

**Estrutura da página `/cotacoes/[slug]`:**

```
┌─────────────────────────────────────────────────────┐
│  🌾 Soja                              GRÃOS         │
│  R$ 138,50 /sc 60kg                                 │
│  ▲ +1,25% hoje  │  ▲ +3,2% semana  │  ▼ -2,1% mês  │
├─────────────────────────────────────────────────────┤
│  [7d] [30d] [90d] [1a] [5a] [máx]     📥 Download   │
│  ┌─────────────────────────────────────────────┐    │
│  │            📈 GRÁFICO GRANDE                │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│  Estatísticas                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Mín 52s  │ │ Máx 52s  │ │ Média 30d│ │ Volat. │ │
│  │ R$125,00 │ │ R$158,00 │ │ R$142,50 │ │ 3,2%   │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
├─────────────────────────────────────────────────────┤
│  Preços por Região                                  │
│  ┌─────────────────────────────────────────────┐    │
│  │ Paranaguá (PR)    R$ 139,20   ▲ +0,8%      │    │
│  │ Rio Grande (RS)   R$ 137,80   ▼ -0,3%      │    │
│  │ Santos (SP)       R$ 140,10   ▲ +1,1%      │    │
│  └─────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│  [🔔 Criar Alerta]  [📥 Baixar CSV]  [📤 Compartilhar]│
└─────────────────────────────────────────────────────┘
```

**Checklist de implementação:**

- [ ] Rota dinâmica `/cotacoes/[slug]/page.tsx`
- [ ] Header com preço atual, variações (dia/semana/mês)
- [ ] Gráfico grande interativo com seletores de período
- [ ] Cards de estatísticas (mín/máx 52 semanas, média, volatilidade)
- [ ] Tabela de preços por praça/região (se disponível)
- [ ] Seção de informações (unidade, fonte, descrição)
- [ ] Botões de ação (alerta, download, compartilhar)
- [ ] SEO: meta tags dinâmicas por commodity
- [ ] Link dos CotacaoCards para página de detalhe
- [ ] Breadcrumb de navegação

**Benefícios:**
- SEO: URLs indexáveis (`/cotacoes/soja`, `/cotacoes/milho`)
- Compartilhamento direto de commodity específica
- Mais espaço para dados detalhados
- Base para futuras features (alertas, download)

**Páginas:** `/cotacoes/[slug]`

---

#### 1.2 Sistema de Autenticação
**Prioridade:** Alta | **Pré-requisito para:** Alertas, Favoritos, Métricas

Sistema de login para personalização e funcionalidades avançadas.

**Métodos de autenticação:**
- [ ] OAuth com Google
- [ ] OAuth com GitHub
- [ ] Email + Senha tradicional
- [ ] Verificação de email
- [ ] Reset de senha

**Funcionalidades do perfil:**
- [ ] Página de perfil (`/perfil`)
- [ ] Editar dados (nome, email)
- [ ] Gerenciar sessões
- [ ] Excluir conta (LGPD)

**Stack sugerida:**
- NextAuth.js (Auth.js) para autenticação
- Prisma para modelo User
- Resend ou SendGrid para emails transacionais

**Páginas:** `/login`, `/cadastro`, `/perfil`, `/esqueci-senha`

---

#### 1.3 Alertas de Preço
**Prioridade:** Alta | **Referência:** CME, Stock Alarm | **Requer:** Auth

- [ ] Cadastro de alertas por commodity
- [ ] Notificação por email quando preço atinge valor X
- [ ] Notificação quando variação > Y%
- [ ] Dashboard de alertas ativos
- [ ] Histórico de alertas disparados

**Páginas:** `/alertas`, `/alertas/novo`, `/alertas/historico`

#### 1.4 Favoritar Commodities
**Prioridade:** Alta | **Requer:** Auth

- [ ] Botão de favoritar em cada commodity
- [ ] Seção "Meus Favoritos" no dashboard
- [ ] Ordenar favoritos primeiro na listagem
- [ ] Sincronizar entre dispositivos

---

#### 1.5 Histórico com Download
**Prioridade:** Alta | **Referência:** CEPEA, Agrolink

- [ ] Gráfico de 1 ano, 2 anos, 5 anos
- [ ] Seletor de período customizado
- [ ] Download CSV/Excel
- [ ] Comparação entre períodos
- [ ] Médias móveis (7d, 30d, 90d)

*Nota: Integrado na página de detalhe da commodity*

#### 1.6 Mais Praças/Regiões
**Prioridade:** Média | **Referência:** Agrolink (997 cidades)

- [ ] Expandir cotações por estado
- [ ] Preços por praça de comercialização
- [ ] Filtro por região no dashboard

---

### Fase 2: Diferenciação (Médio Prazo)

#### 2.1 Mapa de Calor
**Prioridade:** Média | **Referência:** CME, USDA

- [ ] Mapa do Brasil interativo
- [ ] Cores por faixa de preço
- [ ] Tooltip com detalhes por estado
- [ ] Filtro por commodity

**Páginas:** `/mapa`

#### 2.2 Previsão do Tempo
**Prioridade:** Média | **Referência:** Agroclima, Rural Clima, INMET

- [ ] Integração com API de clima (INMET/CPTEC)
- [ ] Previsão por região produtora
- [ ] Alertas de eventos climáticos
- [ ] Correlação clima x preços

**Páginas:** `/clima`

#### 2.3 Feed de Notícias
**Prioridade:** Média | **Referência:** Agrolink, Notícias Agrícolas

Agregador de notícias do setor agrícola com duas abordagens complementares.

**Fontes RSS disponíveis:**
- Canal Rural (canalrural.com.br/rss)
- Notícias Agrícolas (noticiasagricolas.com.br/rss)
- Agrolink (agrolink.com.br/rss)
- USDA (usda.gov/rss) - internacional
- Reuters Commodities - internacional

**Implementação em 2 etapas:**

1. **Na página de detalhe `/cotacoes/[slug]`** (Fase 1.1)
   - [ ] Seção "Notícias sobre [Commodity]"
   - [ ] 5-10 últimas notícias filtradas por keyword
   - [ ] Links externos para fonte original

2. **Página dedicada `/noticias`** (Fase 2)
   - [ ] Feed agregado de todas as fontes
   - [ ] Filtro por commodity
   - [ ] Filtro por fonte
   - [ ] Busca por texto
   - [ ] Resumo por IA (opcional)

**Arquivos a criar:**
- `src/lib/data-sources/news.ts` - Agregador de RSS
- `src/app/api/news/route.ts` - API endpoint com cache
- `src/components/dashboard/NewsFeed.tsx` - Componente reutilizável

**Páginas:** `/noticias`, seção em `/cotacoes/[slug]`

#### 2.4 Comparador
**Prioridade:** Média | **Referência:** Agrolink

- [ ] Comparar múltiplas commodities lado a lado
- [ ] Comparar mesma commodity em diferentes praças
- [ ] Gráfico de correlação

**Páginas:** `/comparar`

#### 2.5 Calculadora de Rentabilidade
**Prioridade:** Média | **Referência:** Farmbrite, Tend

- [ ] Input de custos de produção
- [ ] Cálculo de margem por hectare
- [ ] Simulação de cenários de preço
- [ ] Ponto de equilíbrio

**Páginas:** `/calculadora`

#### 2.6 IndicAgro IA - Inteligência Artificial
**Prioridade:** ALTA | **Diferencial competitivo** | **Base da monetização**

Suite de ferramentas de IA para análise e previsão de mercado agrícola. Este é o principal diferencial do IndicAgro e a base para monetização, pois são serviços de valor agregado que podemos cobrar (diferente dos dados públicos do CEPEA/BCB).

##### 2.6.1 Previsões de Preço (Machine Learning)
**Viabilidade:** Média-Alta | **Monetizável:** Sim

Modelos de machine learning para prever tendências de preço.

**Dados de entrada:**
- Histórico de preços (já temos no banco)
- Sazonalidade (safra/entressafra)
- Dólar PTAX (já temos)
- Clima (API INMET - futuro)
- Sentimento de notícias (futuro)

**Modelos sugeridos:**
- [ ] Prophet (Facebook) - séries temporais, fácil de implementar
- [ ] ARIMA/SARIMA - estatístico clássico
- [ ] XGBoost - gradient boosting, boa accuracy
- [ ] LSTM (futuro) - deep learning para padrões complexos

**Output exemplo:** "Soja tem 72% de probabilidade de subir nos próximos 7 dias"

**Implementação:**
- [ ] Endpoint `/api/ai/predict/[slug]`
- [ ] Componente `PredictionCard.tsx`
- [ ] Gráfico com área de confiança
- [ ] Disclaimer obrigatório (não é recomendação financeira)

**Páginas:** Integrado em `/cotacoes/[slug]`, `/ia/previsoes`

##### 2.6.2 Relatórios Automáticos (LLM)
**Viabilidade:** Alta | **Monetizável:** Sim

Geração automática de análises de mercado usando Claude API ou similar.

**Tipos de relatórios:**
- [ ] Resumo diário do mercado (todas commodities)
- [ ] Análise semanal por commodity
- [ ] Relatório mensal completo (PDF)
- [ ] Alertas contextuais ("Boi gordo atingiu máxima de 6 meses")

**Exemplo de output:**
```
📊 Resumo Semanal - Soja (13-17 Jan 2026)

A soja encerrou a semana em R$ 142,50/sc, alta de 3,2% em relação
à semana anterior. O movimento foi impulsionado pela valorização
do dólar (+1,8%) e pela menor oferta no mercado spot.

Destaques:
• Máxima da semana: R$ 144,20 (quarta-feira)
• Volume negociado acima da média
• Prêmios nos portos em alta

Perspectiva: Tendência de alta para próxima semana devido à
demanda chinesa e clima adverso no Meio-Oeste americano.
```

**Implementação:**
- [ ] Endpoint `/api/ai/report/[tipo]`
- [ ] Job agendado para geração automática
- [ ] Template de email para envio
- [ ] Página `/ia/relatorios` com histórico

##### 2.6.3 Assistente/Chatbot
**Viabilidade:** Alta | **Monetizável:** Sim (limite por tier)

Chatbot especializado em commodities agrícolas brasileiras.

**Capacidades:**
- [ ] Responder perguntas sobre preços e tendências
- [ ] Explicar movimentos de mercado
- [ ] Comparar períodos históricos
- [ ] Sugerir melhores momentos para venda
- [ ] Contexto com dados em tempo real do IndicAgro

**Exemplos de perguntas:**
- "Como está o preço da soja comparado ao ano passado?"
- "Qual a melhor época para vender milho?"
- "Por que o boi subiu essa semana?"
- "Quanto era o café em dezembro de 2025?"

**Implementação:**
- [ ] Endpoint `/api/ai/chat`
- [ ] Componente `ChatWidget.tsx` (flutuante)
- [ ] Página dedicada `/ia/assistente`
- [ ] RAG com dados do banco + contexto de mercado
- [ ] Histórico de conversas por usuário

##### 2.6.4 Análise de Sentimento de Notícias
**Viabilidade:** Média | **Monetizável:** Sim

Processar notícias e classificar impacto no mercado.

**Funcionalidades:**
- [ ] Classificar notícias: Positivo/Negativo/Neutro
- [ ] Score de impacto por commodity
- [ ] Correlação sentimento x preço
- [ ] Alertas de mudança de sentimento

**Páginas:** Widget em `/cotacoes/[slug]`, `/ia/sentimento`

##### 2.6.5 Detecção de Anomalias
**Viabilidade:** Alta | **Monetizável:** Sim

Alertas inteligentes baseados em padrões estatísticos.

**Tipos de anomalias:**
- [ ] Preço fora do desvio padrão histórico
- [ ] Volatilidade acima do normal
- [ ] Quebra de correlação (ex: dólar sobe mas soja não)
- [ ] Volume atípico de variação

**Implementação:**
- [ ] Job agendado para análise diária
- [ ] Notificação por email/push
- [ ] Dashboard de anomalias detectadas

---

**Stack Técnica para IA:**

| Componente | Tecnologia | Custo Estimado |
|------------|------------|----------------|
| Previsões | Python + Prophet/XGBoost | Grátis (self-hosted) |
| Relatórios | Claude API | ~R$ 0,05-0,25/relatório |
| Chatbot | Claude API + RAG | ~R$ 0,10-0,50/conversa |
| Sentimento | Claude API ou modelo local | Variável |
| Infraestrutura | FastAPI (Python) ou Edge Functions | ~R$ 50-200/mês |

**Arquivos a criar:**
```
src/
├── lib/
│   └── ai/
│       ├── predict.ts      # Cliente para serviço de previsão
│       ├── report.ts       # Gerador de relatórios
│       ├── chat.ts         # Cliente do chatbot
│       └── sentiment.ts    # Análise de sentimento
├── app/
│   ├── api/ai/
│   │   ├── predict/[slug]/route.ts
│   │   ├── report/[tipo]/route.ts
│   │   ├── chat/route.ts
│   │   └── sentiment/route.ts
│   └── (dashboard)/ia/
│       ├── page.tsx              # Hub de IA
│       ├── previsoes/page.tsx
│       ├── relatorios/page.tsx
│       ├── assistente/page.tsx
│       └── sentimento/page.tsx
└── components/
    └── ai/
        ├── PredictionCard.tsx
        ├── ReportViewer.tsx
        ├── ChatWidget.tsx
        └── SentimentBadge.tsx
```

**Ordem de implementação sugerida:**
1. Relatórios automáticos (mais fácil, alto valor percebido)
2. Chatbot/Assistente (diferencial competitivo forte)
3. Previsões simples (começar com Prophet)
4. Sentimento de notícias (depende do feed estar pronto)
5. Detecção de anomalias (complementar aos alertas)

---

### Fase 3: Escala (Longo Prazo)

#### 3.1 App Mobile
**Prioridade:** Baixa | **Referência:** Datagro, INMET, DTN

- [ ] App nativo iOS/Android (React Native ou Flutter)
- [ ] Push notifications
- [ ] Widget de home screen
- [ ] Modo offline

#### 3.2 API Pública
**Prioridade:** Baixa | **Referência:** CEPEA (paga), USDA (grátis)

- [ ] REST API documentada
- [ ] Rate limiting
- [ ] Autenticação por API key
- [ ] Plano gratuito com limites
- [ ] Plano premium para desenvolvedores

**Páginas:** `/api-docs`

#### 3.3 Mercado Futuro
**Prioridade:** Baixa | **Referência:** Notícias Agrícolas, CME

- [ ] Integração com B3 (futuros agrícolas)
- [ ] Cotações CME/CBOT
- [ ] Spread físico vs futuro

**Páginas:** `/futuros`

#### 3.4 WhatsApp Alerts
**Prioridade:** Baixa | **Referência:** Datagro

- [ ] Integração com WhatsApp Business API
- [ ] Alertas de preço via WhatsApp
- [ ] Resumo diário opcional

#### 3.5 Widget Embeddable
**Prioridade:** Baixa | **Referência:** Notícias Agrícolas

- [ ] Código para sites parceiros
- [ ] Customização de cores/tamanho
- [ ] Tracking de uso

---

## Novas Páginas Sugeridas

| Rota | Descrição | Fase | Status |
|------|-----------|------|--------|
| `/cotacoes/[slug]` | **Página detalhada por commodity** | 1 | ⭐ PRÓXIMO |
| `/login` | Login (OAuth + Email/Senha) | 1 | Pendente |
| `/cadastro` | Criar conta | 1 | Pendente |
| `/perfil` | Perfil do usuário | 1 | Pendente |
| `/alertas` | Gerenciar alertas de preço | 1 | Pendente |
| `/mapa` | Mapa de calor por região | 2 | Pendente |
| `/clima` | Previsão do tempo agrícola | 2 | Pendente |
| `/noticias` | Feed de notícias do agro | 2 | Pendente |
| `/comparar` | Comparador de commodities | 2 | Pendente |
| `/calculadora` | Calculadora de rentabilidade | 2 | Pendente |
| `/futuros` | Cotações B3/CME | 3 | Pendente |
| `/api-docs` | Documentação da API pública | 3 | Pendente |
| `/precos` | Página de planos e preços | 2 | Pendente |
| `/ia` | Hub de ferramentas de IA | 2 | Pendente |
| `/ia/previsoes` | Previsões de preço por IA | 2 | Pendente |
| `/ia/relatorios` | Relatórios automáticos | 2 | Pendente |
| `/ia/assistente` | Chatbot especializado | 2 | Pendente |

---

## Métricas de Sucesso

### Fase 1
- [ ] 1.000 usuários cadastrados
- [ ] 500 alertas ativos
- [ ] 100 downloads de histórico/mês

### Fase 2
- [ ] 5.000 usuários cadastrados
- [ ] 50.000 pageviews/mês
- [ ] NPS > 40

### Fase 3
- [ ] 20.000 usuários cadastrados
- [ ] 100 desenvolvedores usando API
- [ ] 10.000 downloads do app

---

## Estratégia de Monetização

### Modelo Freemium (Recomendado)

| Tier | Preço | Funcionalidades |
|------|-------|-----------------|
| **Free** | R$ 0 | Dashboard completo, cotações diárias, 1 alerta, histórico 30 dias, relatório semanal básico |
| **Pro** | R$ 29-49/mês | Alertas ilimitados, histórico completo, download CSV/Excel, API básica (1000 req/dia), **Previsões IA (7 dias)**, **Chatbot (50 msgs/mês)**, **Relatórios completos** |
| **Business** | R$ 199+/mês | API completa (ilimitada), dados por praça, white-label, suporte prioritário, webhooks, **Previsões IA (30 dias)**, **Chatbot ilimitado**, **Relatórios customizados**, **Análise de sentimento** |

### O Que Podemos Cobrar (Valor Agregado)

**Importante:** Dados do CEPEA e BCB são públicos e não podemos cobrar por eles diretamente. Porém, podemos cobrar por **serviços de valor agregado** que criamos em cima desses dados:

| Cobrável | Justificativa |
|----------|---------------|
| Previsões de IA | Modelo treinado por nós, output original |
| Relatórios gerados | Conteúdo criado pela nossa IA |
| Chatbot/Assistente | Serviço de conveniência + infraestrutura |
| Alertas inteligentes | Lógica proprietária + infraestrutura |
| API de acesso | Conveniência + infraestrutura |
| Histórico organizado | Curadoria + armazenamento |
| Análise de sentimento | Processamento proprietário |
| Detecção de anomalias | Algoritmo nosso |

### Outras Fontes de Receita

1. **Anúncios Contextuais**
   - Banners de insumos agrícolas (Bayer, Syngenta, BASF)
   - Maquinário (John Deere, Case, New Holland)
   - Crédito rural (Sicredi, BB, Santander)
   - Seguros agrícolas

2. **Programa de Afiliados**
   - Corretoras de commodities
   - Plataformas de gestão agrícola
   - Seguros e financiamentos

3. **Dados Premium (B2B)**
   - Séries históricas para fintechs/agritechs
   - Integração via API para sistemas de gestão
   - Reports customizados

4. **Consultoria/Reports**
   - Análises semanais pagas
   - Reports por safra
   - Projeções de mercado

### Referência de Pricing do Mercado

| Concorrente | Modelo | Preço |
|-------------|--------|-------|
| CEPEA API | Assinatura | R$ 10.500+/ano |
| Aegro | SaaS | R$ 89-299/mês |
| Datagro | Enterprise | Não divulgado ($$$$) |
| Agrolink | Freemium + Ads | Grátis + Premium |

### Estratégia de Go-to-Market

1. **Fase 1:** Produto 100% gratuito - foco em aquisição de usuários
2. **Fase 2:** Introduzir tier Pro com features avançadas
3. **Fase 3:** Lançar API pública e tier Business

**Meta:** Atingir 5.000 usuários antes de monetizar agressivamente.

---

## Stack Técnica Atual

- **Frontend:** Next.js 16, React 19, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Gráficos:** Recharts
- **Deploy:** Docker, VPS
- **Dados:** CEPEA (scraping), BCB API (PTAX)

---

## Fontes da Pesquisa

- [Agrolink](https://www.agrolink.com.br/)
- [Notícias Agrícolas](https://www.noticiasagricolas.com.br/)
- [CEPEA](https://www.cepea.org.br/)
- [Datagro](https://portal.datagro.com/)
- [CME Group](https://www.cmegroup.com/markets/agriculture.html)
- [DTN](https://www.dtnpf.com/agriculture/web/ag/markets)
- [Agroclima](https://agroclima.climatempo.com.br)
- [Rural Clima](https://ruralclima.com.br)
- [INMET](https://portal.inmet.gov.br/)

---

*Documento gerado com auxílio de Claude (Anthropic) em 22/01/2026. Atualizado em 23/01/2026 (IA adicionada).*
