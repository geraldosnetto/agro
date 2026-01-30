
import { AgroInsight } from "@/lib/agro-analyzers";
import { AlertTriangle, CheckCircle, XCircle, Droplets, Tractor, Bug, Syringe, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AgroInsightsProps {
    insights: AgroInsight[];
}

export function AgroInsights({ insights }: AgroInsightsProps) {
    if (insights.length === 0) return null;

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'spray': return <Syringe className="h-5 w-5" />;
            case 'fungus': return <Bug className="h-5 w-5" />;
            case 'tractor': return <Tractor className="h-5 w-5" />;
            case 'sun': return <Sun className="h-5 w-5" />;
            default: return <AlertTriangle className="h-5 w-5" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'good': return "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900";
            case 'warning': return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900";
            case 'bad': return "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900";
            default: return "text-slate-600 bg-slate-50 border-slate-200";
        }
    };

    const getStatusIcon = (type: string) => {
        switch (type) {
            case 'good': return <CheckCircle className="h-4 w-4" />;
            case 'bad': return <XCircle className="h-4 w-4" />;
            default: return <AlertTriangle className="h-4 w-4" />;
        }
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            {insights.map((insight) => (
                <div
                    key={insight.id}
                    className={`flex flex-col p-4 rounded-xl border ${getColor(insight.type)}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 font-semibold">
                            {getIcon(insight.icon)}
                            {insight.title}
                        </div>
                        {getStatusIcon(insight.type)}
                    </div>
                    <p className="text-sm opacity-90 leading-relaxed">
                        {insight.description}
                    </p>
                </div>
            ))}
        </div>
    );
}
