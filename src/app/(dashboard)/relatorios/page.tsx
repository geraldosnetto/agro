'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Loader2,
  Clock,
  TrendingUp,
  Lock,
  ChevronRight,
  Sparkles,
  Calendar,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ReportRenderer } from '@/components/ai/ReportRenderer';

interface DailyReport {
  id: string;
  title: string;
  content: string;
  summary: string;
  reportDate: string;
  generatedAt: string;
  validUntil: string;
  tokensUsed: number;
  model: string;
  cached: boolean;
}

interface CommodityInfo {
  commoditySlug: string;
  commodityName: string;
  hasReport: boolean;
  reportId: string | null;
  reportDate: string | null;
  generatedAt: string | null;
}

interface CommodityReport {
  id: string;
  commoditySlug: string;
  commodityName: string;
  title: string;
  content: string;
  summary: string;
  reportDate: string;
  generatedAt: string;
  validUntil: string;
  tokensUsed: number;
  model: string;
  cached: boolean;
}

export default function RelatoriosPage() {
  const { status } = useSession();
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [commodities, setCommodities] = useState<CommodityInfo[]>([]);
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);
  const [commodityReport, setCommodityReport] = useState<CommodityReport | null>(null);
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);
  const [isLoadingCommodity, setIsLoadingCommodity] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [noReportsYet, setNoReportsYet] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  // Auto-load daily report on page mount
  useEffect(() => {
    if (status === 'authenticated') {
      loadCommoditiesList();
      loadDailyReport();
    }
  }, [status]);

  const loadCommoditiesList = async () => {
    try {
      setIsLoadingList(true);
      const response = await fetch('/api/ai/reports/commodity');
      if (response.ok) {
        const data = await response.json();
        setCommodities(data.commodities || []);
      }
    } catch (err) {
      console.error('Error loading commodities:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  const loadDailyReport = async (date?: string) => {
    try {
      setIsLoadingDaily(true);
      setError(null);
      setNoReportsYet(false);

      const url = date
        ? `/api/ai/reports/daily?date=${date}`
        : '/api/ai/reports/daily';
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'NO_REPORTS') {
          setNoReportsYet(true);
          setDailyReport(null);
          return;
        }
        throw new Error(data.error || 'Erro ao carregar relatório');
      }

      setDailyReport(data.report);
      setAvailableDates(data.availableDates || []);
      if (data.report?.reportDate) {
        setSelectedDate(data.report.reportDate);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
    } finally {
      setIsLoadingDaily(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    loadDailyReport(date);
  };

  const loadCommodityReport = async (slug: string) => {
    try {
      setIsLoadingCommodity(true);
      setError(null);
      setSelectedCommodity(slug);

      const url = `/api/ai/reports/commodity/${slug}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'PLAN_REQUIRED') {
          setUserPlan('free');
        }
        throw new Error(data.error || 'Erro ao carregar relatório');
      }

      setCommodityReport(data.report);
      setUserPlan('pro');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      setCommodityReport(null);
    } finally {
      setIsLoadingCommodity(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    return `há ${Math.floor(diffHours / 24)}d`;
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Hoje';
    }
    if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Ontem';
    }

    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  if (status === 'loading') {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios de Mercado</h1>
          <p className="text-muted-foreground mt-1">
            Análises geradas por IA sobre o mercado agrícola
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          <Sparkles className="h-3 w-3 mr-1" />
          Powered by Claude
        </Badge>
      </div>

      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList>
          <TabsTrigger value="daily">
            <TrendingUp className="h-4 w-4 mr-2" />
            Resumo Diário
          </TabsTrigger>
          <TabsTrigger value="commodity">
            <FileText className="h-4 w-4 mr-2" />
            Análises por Commodity
          </TabsTrigger>
        </TabsList>

        {/* Daily Report Tab */}
        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Resumo do Mercado</CardTitle>
                  <CardDescription>
                    Visão geral diária de todas as commodities agrícolas
                  </CardDescription>
                </div>

                {/* Date selector for history */}
                {availableDates.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Select value={selectedDate || ''} onValueChange={handleDateChange}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Selecione a data" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDates.map((date) => (
                          <SelectItem key={date} value={date}>
                            {formatDateLabel(date)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {error && !dailyReport && !noReportsYet && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {noReportsYet && !isLoadingDaily && (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium text-foreground mb-2">Relatório em preparação</h3>
                  <p>O relatório diário é gerado automaticamente pelo sistema.</p>
                  <p className="text-xs mt-2">
                    Volte mais tarde para ver a análise do mercado de hoje.
                  </p>
                </div>
              )}

              {isLoadingDaily && (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Carregando relatório...</p>
                </div>
              )}

              {dailyReport && !isLoadingDaily && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Gerado {formatTimeAgo(dailyReport.generatedAt)}
                    </span>
                    {availableDates.length > 1 && (
                      <Badge variant="outline" className="text-xs">
                        {availableDates.length} dias de histórico
                      </Badge>
                    )}
                  </div>

                  <ReportRenderer content={dailyReport.content} title={dailyReport.title} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commodity Reports Tab */}
        <TabsContent value="commodity" className="space-y-4">
          <div className="grid md:grid-cols-[280px_1fr] gap-6">
            {/* Commodity List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Commodities</CardTitle>
                <CardDescription className="text-xs">
                  Selecione para ver a análise semanal
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingList ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {commodities.map((c) => (
                      <button
                        key={c.commoditySlug}
                        onClick={() => loadCommodityReport(c.commoditySlug)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors hover:bg-muted ${selectedCommodity === c.commoditySlug ? 'bg-muted' : ''
                          }`}
                      >
                        <span className="font-medium">{c.commodityName}</span>
                        <div className="flex items-center gap-2">
                          {c.hasReport ? (
                            <Badge variant="secondary" className="text-xs">
                              Sem. {c.reportDate?.split('-')[1]}/{c.reportDate?.split('-')[2]}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Em breve
                            </Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected Commodity Report */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {commodityReport?.commodityName || 'Análise Semanal'}
                    </CardTitle>
                    <CardDescription>
                      Análise detalhada com tendências e perspectivas
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {error && selectedCommodity && userPlan === 'free' && (
                  <div className="text-center py-12">
                    <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium mb-2">Recurso Premium</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Análises semanais por commodity estão disponíveis nos planos Pro e Business.
                    </p>
                    <Button disabled title="Em breve">Fazer Upgrade</Button>
                  </div>
                )}

                {error && selectedCommodity && userPlan !== 'free' && error.includes('Nenhum relatório') && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium text-foreground mb-2">Relatório em preparação</h3>
                    <p>O relatório semanal é gerado automaticamente pelo sistema.</p>
                    <p className="text-xs mt-2">
                      Volte mais tarde para ver a análise desta commodity.
                    </p>
                  </div>
                )}

                {error && selectedCommodity && userPlan !== 'free' && !error.includes('Nenhum relatório') && (
                  <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {!selectedCommodity && !isLoadingCommodity && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Selecione uma commodity na lista ao lado</p>
                  </div>
                )}

                {isLoadingCommodity && (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Carregando análise...</p>
                  </div>
                )}

                {commodityReport && !isLoadingCommodity && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Gerado {formatTimeAgo(commodityReport.generatedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Semana de {new Date(commodityReport.reportDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <ReportRenderer content={commodityReport.content} title={commodityReport.title} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
