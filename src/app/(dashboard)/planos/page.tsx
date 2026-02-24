
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { createCheckoutSession, createCustomerPortal } from "./actions"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export default async function PricingPage() {
    const session = await auth()
    const user = await prisma.user.findUnique({
        where: { id: session?.user?.id }
    })

    const isPro = user?.plan === 'pro' || user?.plan === 'business'
    const isFree = user?.plan === 'free'

    return (
        <div className="container py-10">
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Planos e Preços
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Escolha o plano ideal para alavancar suas análises de agronegócio.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* FREE PLAN */}
                <Card className={isFree ? "border-primary" : ""}>
                    <CardHeader>
                        <CardTitle>Gratuito</CardTitle>
                        <CardDescription>Para produtores iniciantes</CardDescription>
                        <div className="mt-4 text-4xl font-bold">R$ 0</div>
                        <div className="text-sm text-muted-foreground">/mês</div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" /> 10 Mensagens de Chat/dia
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" /> 3 Relatórios/dia
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" /> Cotações Básicas
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant="outline" disabled={isFree}>
                            {isFree ? "Plano Atual" : "Downgrade"}
                        </Button>
                    </CardFooter>
                </Card>

                {/* PRO PLAN */}
                <Card className={isPro ? "border-primary shadow-lg scale-105" : "border-primary/50"}>
                    <CardHeader>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
                            Popular
                        </div>
                        <CardTitle>Pro</CardTitle>
                        <CardDescription>Para profissionais exigentes</CardDescription>
                        <div className="mt-4 text-4xl font-bold">R$ 97</div>
                        <div className="text-sm text-muted-foreground">/mês</div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" /> 100 Mensagens de Chat/dia
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" /> 20 Relatórios/dia
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" /> Análise de Sentimento
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" /> Acesso a GPT-4/Claude 3.5
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        {isPro ? (
                            <form action={createCustomerPortal} className="w-full">
                                <Button className="w-full" variant="outline">
                                    Gerenciar Assinatura
                                </Button>
                            </form>
                        ) : (
                            <form action={async () => {
                                "use server"
                                await createCheckoutSession("price_1QjKIQFjG8kR5s9J5zXy8Vl9") // ID DE EXEMPLO - DEVE SER CONFIGURADO NO ENV
                            }} className="w-full">
                                <Button type="submit" className="w-full">Assinar Agora</Button>
                            </form>
                        )}
                    </CardFooter>
                </Card>

                {/* BUSINESS PLAN */}
                <Card>
                    <CardHeader>
                        <CardTitle>Business</CardTitle>
                        <CardDescription>Para grandes empresas</CardDescription>
                        <div className="mt-4 text-4xl font-bold">Sob Consulta</div>
                        <div className="text-sm text-muted-foreground">/mês</div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" /> Uso Ilimitado
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" /> API Dedicada
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" /> Suporte Prioritário
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant="outline">Fale Conosco</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
