"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { updateUserRole, updateUserPlan, deleteUser } from "./actions"
import { toast } from "sonner"
import { useState } from "react"
import { UserForm } from "./user-form"

// This type is used to define the shape of our data.
export type UserColumn = {
    id: string
    name: string | null
    email: string
    role: string
    plan: string
    createdAt: Date
}

export const columns: ColumnDef<UserColumn>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "email",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Email
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
    },
    {
        accessorKey: "role",
        header: "Role",
    },
    {
        accessorKey: "plan",
        header: "Plan",
    },
    {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => {
            return format(new Date(row.getValue("createdAt")), "dd/MM/yyyy")
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const user = row.original
            const [showDeleteDialog, setShowDeleteDialog] = useState(false)
            const [showEditDialog, setShowEditDialog] = useState(false)

            return (
                <>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(user.id)}
                            >
                                Copy User ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                            <DropdownMenuItem onClick={async () => {
                                await updateUserRole(user.id, "ADMIN")
                                toast.success("User role updated to ADMIN")
                            }}>
                                Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={async () => {
                                await updateUserRole(user.id, "USER")
                                toast.success("User role updated to USER")
                            }}>
                                Make User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Change Plan</DropdownMenuLabel>
                            <DropdownMenuItem onClick={async () => {
                                await updateUserPlan(user.id, "pro")
                                toast.success("User plan updated to PRO")
                            }}>
                                Upgrade to Pro
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={async () => {
                                await updateUserPlan(user.id, "free")
                                toast.success("User plan updated to Free")
                            }}>
                                Downgrade to Free
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault()
                                    setShowEditDialog(true)
                                }}
                            >
                                Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setShowDeleteDialog(true)}
                                className="text-red-600 focus:text-red-600"
                            >
                                Delete User
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {showEditDialog && (
                        <UserForm
                            user={user}
                            open={showEditDialog}
                            onOpenChange={setShowEditDialog}
                        />
                    )}

                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the user account
                                    and remove their data from our servers.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={async () => {
                                        const result = await deleteUser(user.id)
                                        if (result.success) {
                                            toast.success("User deleted successfully")
                                        } else {
                                            toast.error("Failed to delete user")
                                        }
                                    }}
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )
        },
    },
]
