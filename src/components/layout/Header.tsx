"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/auth/UserMenu";
import { HeaderWidget } from "@/components/weather/HeaderWidget";

import {
  TrendingUp,
  Newspaper,
  CloudRain,
  Calculator,
  ArrowLeftRight,
  Map as MapIcon,
  FileText,
  Menu,
  Leaf,
  CreditCard,
  LucideIcon
} from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary group-hover:bg-primary/90 transition-colors">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Indic<span className="text-primary">Agro</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLinks />
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
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] flex flex-col p-0 border-l">
              <SheetHeader className="p-6 border-b">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Leaf className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <SheetTitle className="text-xl font-bold">Indic<span className="text-primary">Agro</span></SheetTitle>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-auto py-6 px-4">
                <nav className="flex flex-col gap-2">
                  <MobileNavLink href="/cotacoes" icon={TrendingUp}>Cotações</MobileNavLink>
                  <MobileNavLink href="/noticias" icon={Newspaper}>Notícias</MobileNavLink>
                  <MobileNavLink href="/clima" icon={CloudRain}>Clima</MobileNavLink>
                  <MobileNavLink href="/calculadora" icon={Calculator}>Calculadora</MobileNavLink>
                  <MobileNavLink href="/comparador" icon={ArrowLeftRight}>Comparador</MobileNavLink>
                  <MobileNavLink href="/mapa" icon={MapIcon}>Mapa</MobileNavLink>
                  <MobileNavLink href="/relatorios" icon={FileText}>Relatórios</MobileNavLink>
                  <MobileNavLink href="/planos" icon={CreditCard}>Planos e Assinatura</MobileNavLink>
                </nav>
              </div>

              <div className="p-6 border-t bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Tema</span>
                  <ThemeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function NavLinks() {
  return (
    <>
      <Link href="/cotacoes" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cotações</Link>
      <Link href="/noticias" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Notícias</Link>
      <Link href="/clima" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Clima</Link>
      <Link href="/calculadora" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Calculadora</Link>
      <Link href="/comparador" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Comparador</Link>
      <Link href="/mapa" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Mapa</Link>
      <Link href="/relatorios" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Relatórios</Link>
      <Link href="/planos" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">Planos</Link>
    </>
  );
}

function MobileNavLink({ href, icon: Icon, children }: { href: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all font-medium"
    >
      <Icon className="h-5 w-5" />
      {children}
    </Link>
  );
}
