"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
    return (
        <Button
            variant="destructive"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full sm:w-auto"
        >
            <LogOut className="h-4 w-4 mr-2" />
            Sair da Conta
        </Button>
    );
}
