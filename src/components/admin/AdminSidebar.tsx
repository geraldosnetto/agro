"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Package,
    Activity,
    BrainCircuit,
    Settings,
    Shield
} from "lucide-react";

const sidebarNavItems = [
    {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "Usuários",
        href: "/admin/users",
        icon: Users,
    },
    {
        title: "Commodities",
        href: "/admin/commodities",
        icon: Package,
    },
    {
        title: "Logs do Sistema",
        href: "/admin/logs",
        icon: Activity,
    },
    {
        title: "Uso de IA",
        href: "/admin/ai",
        icon: BrainCircuit,
    },
];

export function AdminSidebar({ className }: { className?: string }) {
    const pathname = usePathname();

    return (
        <div className={cn("pb-12 w-64 border-r bg-muted/40 hidden lg:block h-screen fixed left-0 top-0", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="mb-2 px-4 flex items-center gap-2 font-semibold text-lg tracking-tight">
                        <Shield className="h-6 w-6 text-primary" />
                        <span>Admin Panel</span>
                    </div>
                </div>
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
                        Gerenciamento
                    </h2>
                    <div className="space-y-1">
                        {sidebarNavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all",
                                    pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
