import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { UserNav } from "@/components/dashboard/UserNav"; // Assuming this exists or using a simple placeholder
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
        redirect("/");
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <AdminSidebar />
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    {/* Mobile Menu Placeholder - can implement later with Sheet */}
                    <div className="relative ml-auto flex-1 md:grow-0">
                        {/* Search or other header items */}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium hidden md:inline-block">
                            {session.user.name} (Admin)
                        </span>
                        {/* We can re-use UserNav if compatible, or just a simple signout for now */}
                    </div>
                </header>
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
