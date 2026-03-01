
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings } from "lucide-react";

export default function ConfiguracoesPage() {
    return (
        <div className="container max-w-2xl py-10">
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Settings className="h-8 w-8 text-primary" />
                    Configurações
                </h1>
                <p className="text-muted-foreground">
                    Ajuste as preferências do seu sistema
                </p>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Perfil</CardTitle>
                        <CardDescription>Gerencie suas informações pessoais</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input id="name" placeholder="Seu nome" disabled />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" placeholder="seu@email.com" disabled />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            Edição de perfil estará disponível em breve.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Preferências</CardTitle>
                        <CardDescription>Personalize sua experiência</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Configurações de notificações e aparência em desenvolvimento.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
