import { Skeleton } from "./skeleton";

export function SkeletonCard() {
    return (
        <div className="flex flex-col space-y-3 p-4 border rounded-xl">
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
    );
}

interface SkeletonTableProps {
    rows?: number;
}

export function SkeletonTable({ rows = 5 }: SkeletonTableProps) {
    return (
        <div className="w-full space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-3">
                {Array.from({ length: rows }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        </div>
    );
}
