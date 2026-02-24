"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function toggleCommodityStatus(id: string, currentStatus: boolean) {
    const session = await auth()

    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    try {
        await prisma.commodity.update({
            where: { id },
            data: { ativo: !currentStatus }
        })
        revalidatePath("/admin/commodities")
        return { success: true }
    } catch (error) {
        console.error("Failed to toggle commodity status:", error)
        return { success: false, error: "Failed to update status" }
    }
}
