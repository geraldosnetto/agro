
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function ConfiguracoesPage() {
    return (
        <div className="container px-4 py-6 md:py-8 max-w-2xl">
            <PageHeader
                title="Configurações"
                description="Gerencie as configurações da sua conta e preferências do sistema."
                icon={Settings}
            />

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
