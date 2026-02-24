"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, Copy } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ShareButtonProps {
    title: string;
    text: string;
    size?: "sm" | "default" | "lg";
}

export function ShareButton({ title, text, size = "sm" }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const url = window.location.href;

        // Use Web Share API if available (mobile and some desktop browsers)
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                return;
            } catch (err) {
                // User cancelled or error — fall through to clipboard
                if (err instanceof DOMException && err.name === "AbortError") return;
            }
        }

        // Fallback: copy URL to clipboard
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Last resort: use textarea trick for older browsers
            const textarea = document.createElement("textarea");
            textarea.value = url;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <TooltipProvider>
            <Tooltip open={copied ? true : undefined}>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size={size}
                        onClick={handleShare}
                    >
                        {copied ? (
                            <Check className="h-4 w-4 mr-2 text-positive" />
                        ) : (
                            <Share2 className="h-4 w-4 mr-2" />
                        )}
                        {copied ? "Link copiado!" : "Compartilhar"}
                    </Button>
                </TooltipTrigger>
                {copied && (
                    <TooltipContent>
                        <p>Link copiado para a área de transferência</p>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );
}
