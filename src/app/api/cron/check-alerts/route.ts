import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import logger from "@/lib/logger";
import { sendAlertNotificationEmail } from "@/lib/email";

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
// Recommended frequency: every 30 minutes during market hours

export async function GET(request: Request) {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
        const startTime = Date.now();
        let alertsChecked = 0;
        let alertsTriggered = 0;
        let emailsSent = 0;

        // Get all active alerts that haven't been triggered
        const activeAlerts = await prisma.alertaUsuario.findMany({
            where: {
                ativo: true,
                disparado: false,
            },
            include: {
                user: {
                    select: { email: true, name: true },
                },
            },
        });

        if (activeAlerts.length === 0) {
            logger.info("Nenhum alerta ativo para verificar");
            return NextResponse.json({
                message: "Nenhum alerta ativo",
                checked: 0,
                triggered: 0,
            });
        }

        // Get unique commodity IDs
        const commodityIds = [...new Set(activeAlerts.map((a) => a.commodityId))];

        // Get latest prices for those commodities
        const commodities = await prisma.commodity.findMany({
            where: { id: { in: commodityIds } },
            select: {
                id: true,
                nome: true,
                slug: true,
                cotacoes: {
                    orderBy: { dataReferencia: "desc" },
                    take: 2, // Current and previous for variation calculation
                    select: {
                        valor: true,
                        valorAnterior: true,
                        variacao: true,
                    },
                },
            },
        });

        const commodityPrices = new Map(
            commodities.map((c) => [
                c.id,
                {
                    nome: c.nome,
                    slug: c.slug,
                    precoAtual: c.cotacoes[0]?.valor?.toNumber() ?? 0,
                    variacao: c.cotacoes[0]?.variacao?.toNumber() ?? 0,
                },
            ])
        );

        // Check each alert
        const alertsToTrigger: Array<{
            alertId: string;
            email: string;
            userName: string | null;
            commodityName: string;
            commoditySlug: string;
            tipo: string;
            valorAlvo: number | null;
            percentual: number | null;
            precoAtual: number;
            variacao: number;
        }> = [];

        for (const alert of activeAlerts) {
            alertsChecked++;
            const priceData = commodityPrices.get(alert.commodityId);

            if (!priceData || priceData.precoAtual === 0) {
                continue;
            }

            let shouldTrigger = false;

            if (alert.tipo === "ACIMA" && alert.valorAlvo) {
                shouldTrigger = priceData.precoAtual >= alert.valorAlvo.toNumber();
            } else if (alert.tipo === "ABAIXO" && alert.valorAlvo) {
                shouldTrigger = priceData.precoAtual <= alert.valorAlvo.toNumber();
            } else if (alert.tipo === "VARIACAO" && alert.percentual) {
                shouldTrigger = Math.abs(priceData.variacao) >= alert.percentual.toNumber();
            }

            if (shouldTrigger) {
                alertsTriggered++;
                alertsToTrigger.push({
                    alertId: alert.id,
                    email: alert.user.email,
                    userName: alert.user.name,
                    commodityName: priceData.nome,
                    commoditySlug: priceData.slug,
                    tipo: alert.tipo,
                    valorAlvo: alert.valorAlvo?.toNumber() ?? null,
                    percentual: alert.percentual?.toNumber() ?? null,
                    precoAtual: priceData.precoAtual,
                    variacao: priceData.variacao,
                });
            }
        }

        // Mark triggered alerts as disparado
        if (alertsToTrigger.length > 0) {
            await prisma.alertaUsuario.updateMany({
                where: {
                    id: { in: alertsToTrigger.map((a) => a.alertId) },
                },
                data: {
                    disparado: true,
                },
            });

            // Send email notifications
            for (const alert of alertsToTrigger) {
                logger.info("Alerta disparado", {
                    alertId: alert.alertId,
                    email: alert.email,
                    commodity: alert.commodityName,
                    tipo: alert.tipo,
                    precoAtual: alert.precoAtual,
                    valorAlvo: alert.valorAlvo,
                    percentual: alert.percentual,
                });

                // Envia email de notificação
                try {
                    const targetValue = alert.valorAlvo ?? alert.percentual ?? 0;
                    await sendAlertNotificationEmail(
                        alert.email,
                        alert.commodityName,
                        alert.tipo,
                        targetValue,
                        alert.precoAtual,
                        alert.userName ?? undefined
                    );
                    emailsSent++;
                    logger.info("Email de alerta enviado", { email: alert.email, commodity: alert.commodityName });
                } catch (emailError) {
                    logger.error("Erro ao enviar email de alerta", {
                        email: alert.email,
                        error: emailError instanceof Error ? emailError.message : String(emailError),
                    });
                }
            }
        }

        const duration = Date.now() - startTime;

        // Log execution
        await prisma.atualizacaoLog.create({
            data: {
                fonte: "CHECK_ALERTS",
                status: "SUCCESS",
                mensagem: `Verificados ${alertsChecked} alertas, ${alertsTriggered} disparados`,
                registros: alertsTriggered,
                duracao: duration,
            },
        });

        logger.info("Verificação de alertas concluída", {
            checked: alertsChecked,
            triggered: alertsTriggered,
            duration,
        });

        return NextResponse.json({
            message: "Verificação concluída",
            checked: alertsChecked,
            triggered: alertsTriggered,
            emailsSent,
            triggeredAlerts: alertsToTrigger.map((a) => ({
                email: a.email,
                commodity: a.commodityName,
                tipo: a.tipo,
            })),
            duration,
        });
    } catch (error) {
        logger.error("Erro ao verificar alertas", {
            error: error instanceof Error ? error.message : String(error),
        });

        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
