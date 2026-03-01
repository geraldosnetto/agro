import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface DataStateEmptyProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: ReactNode;
    className?: string;
}

export function DataStateEmpty({
    icon: Icon,
    title,
    description,
    action,
    className = "",
}: DataStateEmptyProps) {
    return (
        <div className={`flex flex-col items-center justify-center py-16 px-4 text-center border rounded-xl bg-card border-dashed ${className}`}>
            <div className="p-4 bg-muted rounded-full mb-4">
                <Icon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
                {description}
            </p>
            {action && <div>{action}</div>}
        </div>
    );
}
