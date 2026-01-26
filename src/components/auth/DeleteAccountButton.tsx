'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Trash2, AlertTriangle } from 'lucide-react';

export function DeleteAccountButton() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        if (!password) {
            setError('Digite sua senha para confirmar');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/delete-account', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Erro ao excluir conta');
                setLoading(false);
                return;
            }

            // Logout e redireciona
            await signOut({ redirect: false });
            router.push('/?deleted=true');
        } catch (err) {
            setError('Erro de conexão. Tente novamente.');
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir minha conta
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Excluir conta permanentemente
                    </DialogTitle>
                    <DialogDescription>
                        Esta ação é <strong>irreversível</strong>. Todos os seus dados serão excluídos permanentemente:
                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                            <li>Informações do perfil</li>
                            <li>Alertas de preço configurados</li>
                            <li>Lista de favoritos</li>
                            <li>Histórico de sessões</li>
                        </ul>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">
                            Digite sua senha para confirmar:
                        </Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                        {loading ? 'Excluindo...' : 'Excluir minha conta'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
