import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { ReactNode } from "react";

interface DataStateErrorProps {
    title?: string;
    description: string;
    action?: ReactNode;
    className?: string;
}

export function DataStateError({
    title = "Ocorreu um erro",
    description,
    action,
    className = "",
}: DataStateErrorProps) {
    return (
        <Alert variant="destructive" className={className}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-4 items-start">
                <p>{description}</p>
                {action && <div>{action}</div>}
            </AlertDescription>
        </Alert>
    );
}
