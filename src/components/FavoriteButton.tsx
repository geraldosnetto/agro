"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
    commoditySlug: string;
    variant?: "icon" | "button";
    size?: "sm" | "default" | "lg";
    className?: string;
}

export function FavoriteButton({
    commoditySlug,
    variant = "icon",
    size = "default",
    className,
}: FavoriteButtonProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isFavorited, setIsFavorited] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    const checkFavoriteStatus = useCallback(async () => {
        try {
            const res = await fetch(`/api/favoritos/check?commodityId=${commoditySlug}`);
            const data = await res.json();
            setIsFavorited(data.isFavorited);
        } catch (error) {
            console.error("Erro ao verificar favorito:", error);
        } finally {
            setChecking(false);
        }
    }, [commoditySlug]);

    useEffect(() => {
        if (status === "authenticated") {
            checkFavoriteStatus();
        } else if (status === "unauthenticated") {
            setChecking(false);
        }
    }, [status, checkFavoriteStatus]);

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!session) {
            router.push(`/login?callbackUrl=/cotacoes/${commoditySlug}`);
            return;
        }

        setLoading(true);

        try {
            if (isFavorited) {
                // Remove favorite
                const res = await fetch(`/api/favoritos?commodityId=${commoditySlug}`, {
                    method: "DELETE",
                });

                if (res.ok) {
                    setIsFavorited(false);
                }
            } else {
                // Add favorite
                const res = await fetch("/api/favoritos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ commodityId: commoditySlug }),
                });

                if (res.ok) {
                    setIsFavorited(true);
                }
            }
        } catch (error) {
            console.error("Erro ao alterar favorito:", error);
        } finally {
            setLoading(false);
        }
    };

    const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

    if (variant === "icon") {
        return (
            <button
                onClick={toggleFavorite}
                disabled={loading || checking}
                className={cn(
                    "p-1.5 rounded-full transition-colors",
                    "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    className
                )}
                title={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                aria-label={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
                {loading || checking ? (
                    <Loader2 className={cn(iconSize, "animate-spin text-muted-foreground")} />
                ) : (
                    <Heart
                        className={cn(
                            iconSize,
                            "transition-colors",
                            isFavorited
                                ? "fill-rose-500 text-rose-500"
                                : "text-muted-foreground hover:text-rose-500"
                        )}
                    />
                )}
            </button>
        );
    }

    return (
        <Button
            variant={isFavorited ? "default" : "outline"}
            size={size}
            onClick={toggleFavorite}
            disabled={loading || checking}
            className={cn(
                isFavorited && "bg-rose-500 hover:bg-rose-600 border-rose-500",
                className
            )}
        >
            {loading || checking ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
                <Heart
                    className={cn(
                        "h-4 w-4 mr-2",
                        isFavorited && "fill-current"
                    )}
                />
            )}
            {isFavorited ? "Favoritado" : "Favoritar"}
        </Button>
    );
}
