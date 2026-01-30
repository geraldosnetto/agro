
import { Play, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PodcastWidget() {
    return (
        <div className="bg-gradient-to-br from-green-900 to-green-950 rounded-xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-900/50">
                        <Play className="h-5 w-5 fill-white text-white ml-1" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-green-300 uppercase tracking-wider">Podcast</div>
                        <h3 className="font-bold text-lg leading-none">Resumo Agro</h3>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/5 hover:bg-white/15 transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start">
                            <p className="text-sm font-medium line-clamp-2 text-green-50 group-hover:text-white transition-colors">
                                Alta do boi gordo e perspectivas para a safra de soja 24/25
                            </p>
                            <span className="text-[10px] bg-green-500/20 px-1.5 py-0.5 rounded text-green-300 whitespace-nowrap ml-2">5 min</span>
                        </div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/5 hover:bg-white/15 transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start">
                            <p className="text-sm font-medium line-clamp-2 text-green-50 group-hover:text-white transition-colors">
                                Análise do mercado de milho e clima no Centro-Oeste
                            </p>
                            <span className="text-[10px] bg-green-500/20 px-1.5 py-0.5 rounded text-green-300 whitespace-nowrap ml-2">7 min</span>
                        </div>
                    </div>
                </div>

                <Button size="sm" variant="secondary" className="w-full text-green-900 font-bold hover:bg-white">
                    OUVIR TODOS EPISÓDIOS <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
            {/* Decorative elements */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-green-500/20 rounded-full blur-3xl" />
            <div className="absolute top-0 right-0 w-full h-full bg-[url('https://grain-texture.png')] opacity-20 mix-blend-overlay" />
        </div>
    );
}
