"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

import { Role } from "@prisma/client"

export async function updateUserRole(userId: string, newRole: Role) {
    const session = await auth()

    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { role: newRole }
        })
        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Failed to update user role:", error)
        return { success: false, error: "Failed to update role" }
    }
}

export async function updateUserPlan(userId: string, newPlan: string) {
    const session = await auth()

    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { plan: newPlan }
        })
        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Failed to update user plan:", error)
        return { success: false, error: "Failed to update plan" }
    }
}

export async function deleteUser(userId: string) {
    const session = await auth()

    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    try {
        await prisma.user.delete({
            where: { id: userId }
        })
        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete user:", error)
        return { success: false, error: "Failed to delete user" }
    }
}

import bcrypt from "bcryptjs"

export async function createUser(data: any) {
    const session = await auth()

    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    try {
        const hashedPassword = await bcrypt.hash(data.password, 10)

        await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: data.role,
                plan: data.plan
            }
        })
        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Failed to create user:", error)
        return { success: false, error: "Failed to create user" }
    }
}

export async function updateUser(userId: string, data: any) {
    const session = await auth()

    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    try {
        const updateData: any = {
            name: data.name,
            email: data.email,
            role: data.role,
            plan: data.plan
        }

        if (data.password && data.password.length > 0) {
            updateData.password = await bcrypt.hash(data.password, 10)
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        })
        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Failed to update user:", error)
        return { success: false, error: "Failed to update user" }

    }
}
