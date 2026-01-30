
import { cn } from "@/lib/utils";

interface AdsWidgetProps {
    type?: "sidebar" | "banner";
    className?: string;
}

export function AdsWidget({ type = "sidebar", className }: AdsWidgetProps) {
    return (
        <div
            className={cn(
                "bg-muted/30 border border-dashed border-muted-foreground/20 flex flex-col items-center justify-center p-6 text-center text-muted-foreground",
                type === "sidebar" ? "aspect-square rounded-xl" : "h-[250px] w-full rounded-xl",
                className
            )}
        >
            <span className="text-xs font-semibold uppercase mb-2 block tracking-widest opacity-70">Publicidade</span>
            <div className="font-bold text-lg opacity-50">Espaço para Anúncio</div>
            <div className="text-xs opacity-50">{type === "sidebar" ? "300x250" : "Top Banner"}</div>
        </div>
    );
}
