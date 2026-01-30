"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/auth/UserMenu";
import { HeaderWidget } from "@/components/weather/HeaderWidget";

export function Header() {

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <svg
              className="h-5 w-5 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">
            Indic<span className="text-primary">Agro</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/cotacoes"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cotações
          </Link>

          <Link
            href="/noticias"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Notícias
          </Link>
          <Link
            href="/clima"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Clima
          </Link>
          <Link
            href="/calculadora"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Calculadora
          </Link>
          <Link
            href="/comparador"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Comparador
          </Link>
          <Link
            href="/mapa"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Mapa
          </Link>
          <Link
            href="/relatorios"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Relatórios
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Weather Widget */}
          <HeaderWidget />

          {/* Theme Toggle */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* User Menu */}
          <UserMenu />

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/cotacoes" className="text-lg font-medium">
                  Cotações
                </Link>

                <Link href="/noticias" className="text-lg font-medium">
                  Notícias
                </Link>
                <Link href="/clima" className="text-lg font-medium">
                  Clima
                </Link>
                <Link href="/calculadora" className="text-lg font-medium">
                  Calculadora
                </Link>
                <Link href="/comparador" className="text-lg font-medium">
                  Comparador
                </Link>
                <Link href="/mapa" className="text-lg font-medium">
                  Mapa
                </Link>
                <Link href="/relatorios" className="text-lg font-medium">
                  Relatórios
                </Link>
                <div className="mt-4">
                  <ThemeToggle />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
