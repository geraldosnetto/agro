import { z } from "zod"

export const userSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    password: z.string().min(6, {
        message: "Password must be at least 6 characters."
    }).optional().or(z.literal("")),
    role: z.enum(["USER", "ADMIN"]),
    plan: z.enum(["free", "pro", "business"]),
})

export type UserFormValues = z.infer<typeof userSchema>
