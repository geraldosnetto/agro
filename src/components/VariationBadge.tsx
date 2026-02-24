import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface VariationBadgeProps {
    /** Percentage variation value (e.g. 2.5 for +2.5%) */
    value: number;
    /** Optional label shown before the badge */
    label?: string;
    /** Size variant */
    size?: "sm" | "md";
    className?: string;
}

/**
 * Reusable variation badge showing positive/negative price changes.
 * Uses design system tokens (positive/negative) for consistent theming.
 */
export function VariationBadge({ value, label, size = "sm", className }: VariationBadgeProps) {
    const isPositive = value >= 0;

    const badge = (
        <span
            className={cn(
                "inline-flex items-center gap-1 font-medium rounded-full border",
                size === "sm"
                    ? "text-sm px-2 py-0.5"
                    : "text-base px-2.5 py-1",
                isPositive
                    ? "text-positive bg-positive-muted border-positive-subtle"
                    : "text-negative bg-negative-muted border-negative-subtle",
                className
            )}
        >
            {isPositive ? (
                <TrendingUp className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
            ) : (
                <TrendingDown className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
            )}
            <span>
                {isPositive ? "+" : ""}
                {value.toFixed(2)}%
            </span>
        </span>
    );

    if (label) {
        return (
            <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">{label}:</span>
                {badge}
            </div>
        );
    }

    return badge;
}
