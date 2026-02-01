import { PlayCircle } from 'lucide-react';
import Image from 'next/image';

export function VideoSection() {
    const videos = [
        { id: 1, title: 'Análise de Fechamento de Mercado: Soja e Milho', thumbnail: '/placeholder-news.jpg' },
        { id: 2, title: 'Perspectivas para a Safra 2025/26', thumbnail: '/placeholder-news.jpg' },
        { id: 3, title: 'Entrevista Exclusiva: Ministra da Agricultura', thumbnail: '/placeholder-news.jpg' },
        { id: 4, title: 'Tecnologia no Campo: Drones', thumbnail: '/placeholder-news.jpg' },
    ];

    return (
        <section className="bg-zinc-900 -mx-6 px-6 py-12 text-white">
            <div className="container mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-green-600 p-2 rounded-lg">
                        <PlayCircle className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-green-500">
                        TV AGRO <span className="text-white">PLAY</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {videos.map((video) => (
                        <div key={video.id} className="group cursor-pointer">
                            <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-zinc-800 border border-zinc-700">
                                <Image
                                    src={video.thumbnail}
                                    alt={video.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <PlayCircle className="h-12 w-12 text-white/80 group-hover:text-green-500 group-hover:scale-110 transition-all" />
                                </div>
                            </div>
                            <h3 className="font-medium text-sm leading-snug text-zinc-300 group-hover:text-white line-clamp-2">
                                {video.title}
                            </h3>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
