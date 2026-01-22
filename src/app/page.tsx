import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CotacaoCard } from "@/components/dashboard/CotacaoCard";

// Dados para o ticker
// Dados movidos para layout.tsx

// Dados de exemplo para preview
const cotacoesPreview = [
  {
    slug: "soja",
    nome: "Soja",
    valor: 142.5,
    unidade: "sc 60kg",
    variacao: 1.25,
    categoria: "graos" as const,
    praca: "Paranaguá/PR",
    dataAtualizacao: "Hoje, 14:30",
  },
  {
    slug: "boi-gordo",
    nome: "Boi Gordo",
    valor: 312.8,
    unidade: "@",
    variacao: -0.45,
    categoria: "pecuaria" as const,
    praca: "São Paulo/SP",
    dataAtualizacao: "Hoje, 14:30",
  },
  {
    slug: "etanol-hidratado",
    nome: "Etanol Hidratado",
    valor: 2.85,
    unidade: "litro",
    variacao: 2.1,
    categoria: "sucroenergetico" as const,
    praca: "Paulínia/SP",
    dataAtualizacao: "Hoje, 14:30",
  },
];

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: "Cotações em Tempo Real",
    description: "Preços atualizados de soja, milho, boi gordo, café e mais commodities.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Gráficos Históricos",
    description: "Visualize tendências de 30, 90 ou 365 dias para análise de mercado.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Preços por Região",
    description: "Cotações específicas por praça e estado em todo o Brasil.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Cotação do Dólar",
    description: "PTAX atualizado do Banco Central para cálculo de exportação.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Fontes Oficiais",
    description: "Dados de CEPEA/ESALQ, CONAB, IBGE e Banco Central.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: "Mobile First",
    description: "Interface otimizada para acompanhar cotações de qualquer lugar.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

          <div className="container relative px-4 py-16 md:py-24 lg:py-32">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <Badge variant="secondary" className="px-4 py-1.5">
                🌱 Dados atualizados em tempo real
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Indicadores Agrícolas{" "}
                <span className="text-primary">Brasileiros</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Acompanhe cotações de soja, milho, boi gordo, café e outras
                commodities com dados de fontes oficiais. Simples, rápido e
                gratuito.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" asChild>
                  <Link href="/cotacoes">
                    Ver Cotações
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/sobre">Saiba Mais</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Preview Cotações */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">
                Principais Cotações
              </h2>
              <p className="text-muted-foreground mt-2">
                Veja algumas das cotações mais acompanhadas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {cotacoesPreview.map((cotacao) => (
                <CotacaoCard key={cotacao.nome} {...cotacao} />
              ))}
            </div>

            <div className="text-center mt-8">
              <Button variant="outline" asChild>
                <Link href="/cotacoes">
                  Ver todas as cotações
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 md:py-24">
          <div className="container px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold">
                Por que usar o IndicAgro?
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                Desenvolvido para produtores, traders e profissionais do agronegócio brasileiro
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group p-6 rounded-xl border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Comece a acompanhar agora
              </h2>
              <p className="text-lg opacity-90">
                Acesso gratuito a todas as cotações. Sem cadastro necessário.
              </p>
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="mt-4"
              >
                <Link href="/cotacoes">
                  Acessar Cotações
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
