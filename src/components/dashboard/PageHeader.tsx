import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    children?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, children }: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    {Icon && <Icon className="h-8 w-8 text-primary" />}
                    {title}
                </h1>
                <p className="text-muted-foreground">
                    {description}
                </p>
            </div>
            {children && (
                <div className="w-full md:w-auto mt-2 md:mt-0">
                    {children}
                </div>
            )}
        </div>
    );
}
