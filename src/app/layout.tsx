import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Ticker } from "@/components/layout/Ticker";
import "./globals.css";

const tickerData = [
  { symbol: "SOJA", value: 142.50, change: 1.25 },
  { symbol: "MILHO", value: 72.80, change: -0.50 },
  { symbol: "BOI", value: 312.80, change: 0.15 },
  { symbol: "DÓLAR", value: 5.91, change: 0.35 },
  { symbol: "CAFÉ", value: 1250.00, change: 1.10 },
  { symbol: "AÇÚCAR", value: 145.20, change: -1.20 },
];

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <Ticker items={tickerData} />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
