'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

function VerificarEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    // Inicializa estado baseado na presença do token
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>(() =>
        token ? 'loading' : 'error'
    );
    const [message, setMessage] = useState(() =>
        token ? '' : 'Token de verificação não encontrado.'
    );

    useEffect(() => {
        if (!token) return;

        const verifyEmail = async () => {
            try {
                const res = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                const data = await res.json();

                if (!res.ok) {
                    setStatus('error');
                    setMessage(data.error || 'Erro ao verificar email');
                    return;
                }

                setStatus('success');
                setMessage('Seu email foi verificado com sucesso!');
            } catch {
                setStatus('error');
                setMessage('Erro de conexão. Tente novamente.');
            }
        };

        verifyEmail();
    }, [token]);

    if (status === 'loading') {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                    <CardTitle>Verificando...</CardTitle>
                    <CardDescription>
                        Aguarde enquanto verificamos seu email.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (status === 'error') {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle>Erro na verificação</CardTitle>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center">
                    <Link href="/login">
                        <Button>Ir para login</Button>
                    </Link>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Email verificado!</CardTitle>
                <CardDescription>{message}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
                <Link href="/cotacoes">
                    <Button>Acessar o IndicAgro</Button>
                </Link>
            </CardFooter>
        </Card>
    );
}

export default function VerificarEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
            <Suspense fallback={
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                    </CardContent>
                </Card>
            }>
                <VerificarEmailContent />
            </Suspense>
        </div>
    );
}
