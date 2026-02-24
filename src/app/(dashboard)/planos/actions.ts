"use server"

import { auth } from "@/auth"
import { stripe } from "@/lib/stripe"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"

// URL base para redirecionamento
const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

export async function createCheckoutSession(priceId: string) {
    const session = await auth()

    if (!session?.user?.id || !session.user.email) {
        throw new Error("Unauthorized")
    }

    const { id: userId, email } = session.user

    // Verificar se usuário já tem customerId
    const user = await prisma.user.findUnique({
        where: { id: userId }
    })

    let customerId = user?.stripeCustomerId

    // Se não tiver, criar no Stripe e salvar
    if (!customerId) {
        const customer = await stripe.customers.create({
            email,
            name: session.user.name ?? undefined,
            metadata: {
                userId
            }
        })
        customerId = customer.id

        await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customerId }
        })
    }

    // Criar sessão de checkout
    const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: "subscription",
        success_url: `${BASE_URL}/planos?success=true`,
        cancel_url: `${BASE_URL}/planos?canceled=true`,
        metadata: {
            userId,
        },
    })

    if (!checkoutSession.url) {
        throw new Error("Failed to create checkout session")
    }

    redirect(checkoutSession.url)
}

export async function createCustomerPortal() {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    })

    let customerId = user?.stripeCustomerId

    if (!customerId) {
        const customer = await stripe.customers.create({
            email: session.user.email ?? undefined,
            name: session.user.name ?? undefined,
            metadata: {
                userId: session.user.id
            }
        })
        customerId = customer.id

        await prisma.user.update({
            where: { id: session.user.id },
            data: { stripeCustomerId: customerId }
        })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId as string,
        return_url: `${BASE_URL}/planos`,
    })

    redirect(portalSession.url)
}
