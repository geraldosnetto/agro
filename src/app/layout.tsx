import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { WeatherProvider } from "@/contexts/WeatherContext";
import { TickerServer } from "@/components/layout/TickerServer";
import { Suspense } from "react";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
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
      <body className={`${plusJakartaSans.variable} font-sans antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <WeatherProvider>
            <ThemeProvider>
              <Suspense fallback={<div className="h-10 bg-zinc-900 border-b w-full" />}>
                <TickerServer />
              </Suspense>
              {children}
            </ThemeProvider>
          </WeatherProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
