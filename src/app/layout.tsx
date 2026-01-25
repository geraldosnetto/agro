import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { Ticker } from "@/components/layout/Ticker";
import prisma from "@/lib/prisma";
import logger from "@/lib/logger";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IndicAgro - Indicadores Agrícolas Brasileiros",
  description:
    "Acompanhe cotações de commodities agrícolas em tempo real. Soja, milho, boi gordo, café e mais. Dados de fontes oficiais brasileiras.",
  keywords: [
    "cotações agrícolas",
    "commodities",
    "soja",
    "milho",
    "boi gordo",
    "café",
    "agronegócio",
    "brasil",
  ],
  openGraph: {
    title: "IndicAgro - Indicadores Agrícolas Brasileiros",
    description: "Cotações de commodities agrícolas em tempo real",
    locale: "pt_BR",
    type: "website",
  },
};

// Busca dados reais para o Ticker (Server Component)
async function getTickerData() {
  try {
    const commodities = await prisma.commodity.findMany({
      where: { ativo: true },
      include: {
        cotacoes: {
          orderBy: { dataReferencia: 'desc' },
          take: 1
        }
      },
      take: 8 // Limitar para não sobrecarregar o ticker
    });

    return commodities.map(c => ({
      symbol: c.slug.toUpperCase().replace('-', ' '),
      value: c.cotacoes[0]?.valor?.toNumber() ?? 0,
      change: c.cotacoes[0]?.variacao?.toNumber() ?? 0
    })).filter(item => item.value > 0); // Só mostra se tiver valor
  } catch (error) {
    logger.error('Erro ao buscar dados do Ticker', { error: error instanceof Error ? error.message : String(error) });
    // Retorna array vazio em caso de erro - ticker não será exibido
    return [];
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tickerData = await getTickerData();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <ThemeProvider>
            <Ticker items={tickerData} />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
