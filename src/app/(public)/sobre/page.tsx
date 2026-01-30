
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Database, Sprout, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
    title: "Sobre | IndicAgro",
    description: "Conheça a missão e a tecnologia por trás do IndicAgro.",
};

export default function SobrePage() {
    return (
        <div className="container mx-auto py-12 px-4 md:px-6 max-w-5xl">
            {/* Hero Section */}
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
                    Democratizando a Inteligência no Agro 🇧🇷
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    O IndicAgro nasceu para ser o "Datagro do produtor rural": a mesma qualidade de dados dos grandes players, mas com uma interface simples, acessível e focada em quem está no campo.
                </p>
            </div>

            {/* Missão */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
                <div className="flex flex-col items-center text-center p-6 bg-card rounded-xl border">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Database className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Dados de Confiança</h3>
                    <p className="text-muted-foreground">
                        Centralizamos dados do CEPEA, ESALQ, Banco Central e USDA. Transparência total nas fontes.
                    </p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-card rounded-xl border">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Análise Inteligente</h3>
                    <p className="text-muted-foreground">
                        Não entregamos apenas números. Usamos IA para interpretar tendências e gerar insights acionáveis.
                    </p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-card rounded-xl border">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Sprout className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Foco no Produtor</h3>
                    <p className="text-muted-foreground">
                        Design mobile-first, alertas no WhatsApp e relatórios simples. Tecnologia que funciona na lavoura.
                    </p>
                </div>
            </div>

            {/* Fontes e Transparência */}
            <div className="bg-muted/30 rounded-2xl p-8 mb-16">
                <h2 className="text-2xl font-bold mb-4">Nossas Fontes de Dados</h2>
                <p className="mb-6">
                    Acreditamos que a informação de qualidade deve ser pública e acessível. O IndicAgro agrega, organiza e enriquece dados das seguintes fontes oficiais:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <strong>CEPEA / ESALQ - USP</strong> (Cotações Físicas)
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <strong>Banco Central do Brasil</strong> (Câmbio / PTAX)
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <strong>OpenMeteo / INMET</strong> (Dados Meteorológicos)
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <strong>B3 / CME Group</strong> (Futuros - em breve)
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Faça parte dessa revolução</h2>
                <p className="text-muted-foreground mb-8">
                    Junte-se a milhares de produtores que tomam decisões mais inteligentes todos os dias.
                </p>
                <div className="flex justify-center gap-4">
                    <Button asChild size="lg">
                        <Link href="/cadastro">Criar Conta Grátis</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/termos">Termos de Uso</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
