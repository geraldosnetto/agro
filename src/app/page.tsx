import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  TrendingUp,
  BarChart3,
  MapPin,
  DollarSign,
  Shield,
  Smartphone,
  Bot,
  FileText,
  LineChart,
  Newspaper,
  Cloud,
  Bell,
  Calculator,
  GitCompare,
  Map,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
} from "lucide-react";

// Features principais
const mainFeatures = [
  {
    icon: TrendingUp,
    title: "Cotações em Tempo Real",
    description: "16 commodities atualizadas diariamente com dados do CEPEA/ESALQ",
    href: "/cotacoes",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  {
    icon: Bot,
    title: "Assistente IA",
    description: "Chat inteligente para tirar dúvidas sobre mercado agrícola",
    href: "/assistente",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    badge: "Novo",
  },
  {
    icon: FileText,
    title: "Relatórios IA",
    description: "Análises automáticas de mercado geradas por inteligência artificial",
    href: "/relatorios",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    badge: "Novo",
  },
  {
    icon: LineChart,
    title: "Previsões de Preço",
    description: "Tendências baseadas em análise estatística e machine learning",
    href: "/cotacoes",
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    badge: "Beta",
  },
  {
    icon: Map,
    title: "Mapa de Calor",
    description: "Visualize preços por estado em um mapa interativo do Brasil",
    href: "/mapa",
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  {
    icon: GitCompare,
    title: "Comparador",
    description: "Compare evolução de preços entre diferentes commodities",
    href: "/comparador",
    color: "text-cyan-600",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
  },
  {
    icon: Newspaper,
    title: "Notícias do Agro",
    description: "Feed atualizado com as principais notícias do setor",
    href: "/noticias",
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    icon: Cloud,
    title: "Previsão do Tempo",
    description: "Clima detalhado para qualquer cidade do Brasil",
    href: "/clima",
    color: "text-sky-600",
    bgColor: "bg-sky-100 dark:bg-sky-900/30",
  },
  {
    icon: Calculator,
    title: "Calculadora",
    description: "Simule rentabilidade e ponto de equilíbrio da safra",
    href: "/calculadora",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    icon: Bell,
    title: "Alertas de Preço",
    description: "Receba notificações quando o preço atingir seu alvo",
    href: "/alertas",
    color: "text-rose-600",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
  },
];

// Diferenciais
const highlights = [
  {
    icon: Shield,
    title: "Fontes Oficiais",
    description: "Dados de CEPEA/ESALQ, BCB e outras fontes confiáveis",
  },
  {
    icon: Zap,
    title: "Atualização Diária",
    description: "Cotações sincronizadas automaticamente todos os dias",
  },
  {
    icon: Smartphone,
    title: "100% Responsivo",
    description: "Acesse de qualquer dispositivo, em qualquer lugar",
  },
  {
    icon: DollarSign,
    title: "Totalmente Gratuito",
    description: "Sem taxas, sem assinatura, sem pegadinhas",
  },
];

// Commodities para preview
const commoditiesPreview = [
  { nome: "Soja", emoji: "🌱", unidade: "sc 60kg" },
  { nome: "Milho", emoji: "🌽", unidade: "sc 60kg" },
  { nome: "Boi Gordo", emoji: "🐂", unidade: "@" },
  { nome: "Café Arábica", emoji: "☕", unidade: "sc 60kg" },
  { nome: "Açúcar", emoji: "🍬", unidade: "sc 50kg" },
  { nome: "Algodão", emoji: "🧶", unidade: "@" },
  { nome: "Trigo", emoji: "🌾", unidade: "t" },
  { nome: "Frango", emoji: "🐔", unidade: "kg" },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-green-500/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

          <div className="container relative px-4 py-20 md:py-28 lg:py-36">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Badge variant="secondary" className="px-4 py-1.5 text-sm">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Agora com Inteligência Artificial
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight">
                Cotações Agrícolas{" "}
                <span className="text-primary">Inteligentes</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Acompanhe preços de commodities, receba análises por IA,
                previsões de mercado e muito mais. Tudo gratuito.
              </p>

              {/* Commodities ticker */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {commoditiesPreview.map((c) => (
                  <span
                    key={c.nome}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-sm"
                  >
                    <span>{c.emoji}</span>
                    <span className="font-medium">{c.nome}</span>
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="text-base h-12 px-8" asChild>
                  <Link href="/cotacoes">
                    Ver Cotações
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-base h-12 px-8" asChild>
                  <Link href="/assistente">
                    <Bot className="mr-2 h-4 w-4" />
                    Perguntar à IA
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* AI Highlight Section */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-purple-500/5 to-transparent">
          <div className="container px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Exclusivo IndicAgro
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Inteligência Artificial a seu favor
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Nosso módulo de IA analisa o mercado e gera insights personalizados para você tomar melhores decisões.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 flex items-center justify-center mb-4">
                      <Bot className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Assistente Virtual</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Tire dúvidas sobre preços, tendências e mercado em linguagem natural.
                    </p>
                    <Button variant="link" className="p-0 h-auto text-purple-600" asChild>
                      <Link href="/assistente">
                        Conversar agora <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center mb-4">
                      <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Relatórios Automáticos</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Resumos diários e análises semanais geradas automaticamente.
                    </p>
                    <Button variant="link" className="p-0 h-auto text-blue-600" asChild>
                      <Link href="/relatorios">
                        Ver relatórios <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-background">
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 flex items-center justify-center mb-4">
                      <LineChart className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Previsões de Preço</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Tendências baseadas em análise estatística dos dados históricos.
                    </p>
                    <Button variant="link" className="p-0 h-auto text-amber-600" asChild>
                      <Link href="/cotacoes/soja">
                        Ver previsões <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* All Features Grid */}
        <section className="py-16 md:py-24">
          <div className="container px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Tudo que você precisa em um só lugar
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Ferramentas completas para acompanhar o mercado agrícola brasileiro
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-w-7xl mx-auto">
              {mainFeatures.map((feature) => (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="group relative p-5 rounded-xl border bg-card hover:shadow-lg hover:border-primary/50 transition-all duration-300"
                >
                  {feature.badge && (
                    <Badge
                      variant="secondary"
                      className="absolute top-3 right-3 text-xs"
                    >
                      {feature.badge}
                    </Badge>
                  )}
                  <div className={`h-10 w-10 rounded-lg ${feature.bgColor} ${feature.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {feature.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Highlights / Why Us */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Por que escolher o IndicAgro?
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {highlights.map((item) => (
                  <div key={item.title} className="text-center">
                    <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Commodities List */}
        <section className="py-16 md:py-20">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Commodities Disponíveis
              </h2>
              <p className="text-muted-foreground mb-8">
                Acompanhe as principais commodities do agronegócio brasileiro
              </p>

              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {[
                  "Soja", "Milho", "Boi Gordo", "Café Arábica", "Café Robusta",
                  "Açúcar Cristal", "Etanol Hidratado", "Etanol Anidro", "Trigo",
                  "Algodão", "Arroz", "Frango", "Suíno", "Bezerro", "Leite", "Mandioca"
                ].map((name) => (
                  <Badge key={name} variant="outline" className="text-sm py-1.5 px-3">
                    <CheckCircle2 className="h-3 w-3 mr-1.5 text-green-500" />
                    {name}
                  </Badge>
                ))}
              </div>

              <Button asChild>
                <Link href="/cotacoes">
                  Ver todas as cotações
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Comece agora, é grátis
              </h2>
              <p className="text-lg opacity-90 max-w-xl mx-auto">
                Crie sua conta gratuita para salvar favoritos, configurar alertas e acessar relatórios exclusivos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-base h-12 px-8"
                  asChild
                >
                  <Link href="/cadastro">
                    Criar conta grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base h-12 px-8 bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10"
                  asChild
                >
                  <Link href="/cotacoes">
                    Acessar sem conta
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
