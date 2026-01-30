'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Lock, CheckCircle, AlertCircle } from 'lucide-react';

function RedefinirSenhaForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    if (!token) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle>Link inválido</CardTitle>
                    <CardDescription>
                        Este link de redefinição de senha é inválido ou expirou.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center">
                    <Link href="/esqueci-senha">
                        <Button>Solicitar novo link</Button>
                    </Link>
                </CardFooter>
            </Card>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Erro ao redefinir senha');
                return;
            }

            setSuccess(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch {
            setError('Erro de conexão. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle>Senha redefinida!</CardTitle>
                    <CardDescription>
                        Sua senha foi atualizada com sucesso. Você será redirecionado para o login...
                    </CardDescription>
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
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Redefinir senha</CardTitle>
                <CardDescription>
                    Digite sua nova senha abaixo.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Nova senha</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            minLength={6}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar senha</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                            minLength={6}
                        />
                    </div>
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar nova senha'}
                    </Button>
                    <Link href="/login" className="text-sm text-muted-foreground hover:underline">
                        <ArrowLeft className="inline mr-1 h-3 w-3" />
                        Voltar para login
                    </Link>
                </CardFooter>
            </form>
        </Card>
    );
}

export default function RedefinirSenhaPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
            <Suspense fallback={
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                    </CardContent>
                </Card>
            }>
                <RedefinirSenhaForm />
            </Suspense>
        </div>
    );
}
