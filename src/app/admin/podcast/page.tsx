"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mic, FileText, UploadCloud, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function AdminPodcastPage() {
    const [dossier, setDossier] = useState<string>("");
    const [loadingDossier, setLoadingDossier] = useState(false);
    const [copied, setCopied] = useState(false);

    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [uploading, setUploading] = useState(false);

    const generateDossier = async () => {
        setLoadingDossier(true);
        try {
            const res = await fetch("/api/admin/podcast/dossier");
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setDossier(data.dossie);
            toast.success("Dossiê gerado com sucesso!");
        } catch (error) {
            toast.error("Erro ao gerar dossiê.");
        } finally {
            setLoadingDossier(false);
        }
    };

    const copyDossier = () => {
        navigator.clipboard.writeText(dossier);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Copiado para a área de transferência!");
    };

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!file || !title) return;

        if (file.size > 50 * 1024 * 1024) {
            toast.error("O arquivo deve ser menor que 50MB.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title);
        formData.append("description", description);

        try {
            const res = await fetch("/api/admin/podcast/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Failed to upload");

            toast.success("Podcast publicado com sucesso!");
            setFile(null);
            setTitle("");
            setDescription("");
        } catch (error) {
            toast.error("Erro ao publicar o áudio.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">🎙️ AgroCast Studio</h1>
                <p className="text-muted-foreground mt-2">
                    Gere o dossiê da semana, crie o áudio no Google NotebookLM e publique o MP3 na plataforma.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Passo 1: Gerar Dossiê */}
                <Card className="flex flex-col">
                    <CardHeader className="bg-primary/5 rounded-t-xl border-b pb-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">1</div>
                            <CardTitle>Gerar Dossiê de Conteúdo</CardTitle>
                        </div>
                        <CardDescription className="pt-2">
                            A IA avalia os preços e notícias da semana e monta o texto-base para enviar ao NotebookLM.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 flex-1 flex flex-col gap-4">
                        {dossier ? (
                            <div className="relative flex-1 min-h-[300px]">
                                <textarea
                                    className="w-full p-4 rounded-md border h-full min-h-[300px] font-mono text-sm resize-none bg-muted/30 outline-none"
                                    value={dossier}
                                    readOnly
                                />
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute top-2 right-2"
                                    onClick={copyDossier}
                                >
                                    {copied ? <Check className="h-4 w-4 text-positive" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
                                <FileText className="h-12 w-12 mb-4 opacity-50" />
                                <p className="mb-4">Nenhum dossiê gerado ainda.</p>
                                <Button onClick={generateDossier} disabled={loadingDossier} className="w-full sm:w-auto">
                                    {loadingDossier && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Gerar Dossiê da Semana
                                </Button>
                            </div>
                        )}

                        {dossier && (
                            <div className="text-sm border-l-4 border-amber-500 bg-amber-500/10 p-4 rounded-r text-amber-900 dark:text-amber-200">
                                <strong>Próximo Passo:</strong> Copie o texto acima, acesse o <a href="https://notebooklm.google.com/" target="_blank" rel="noreferrer" className="underline font-semibold">Google NotebookLM</a>, cole como uma Nova Fonte de Texto e clique em "Gerar Visão Geral em Áudio".
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Passo 2: Upload MP3 */}
                <Card>
                    <CardHeader className="bg-primary/5 rounded-t-xl border-b pb-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">2</div>
                            <CardTitle>Publicar MP3</CardTitle>
                        </div>
                        <CardDescription className="pt-2">
                            Faça o upload do áudio `.mp3` gerado pelo NotebookLM para a plataforma de podcast.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título do Episódio</Label>
                                <Input
                                    id="title"
                                    placeholder="Ex: AgroCast #42 - Queda do Boi e Clima nos EUA"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <textarea
                                    id="description"
                                    placeholder="Resumo dos tópicos abordados no podcast..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full min-h-[80px] p-3 text-sm rounded-md border resize-none bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="file">Arquivo de Áudio (.mp3)</Label>
                                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors hover:bg-muted/50 cursor-pointer" onClick={() => document.getElementById('audio-upload')?.click()}>
                                    <Mic className="h-8 w-8 text-muted-foreground mb-2" />
                                    {file ? (
                                        <p className="text-sm font-medium text-primary">Pronto: {file.name}</p>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium">Clique para selecionar o áudio</p>
                                            <p className="text-xs text-muted-foreground mt-1">Apenas arquivos de áudio (máx. 50MB)</p>
                                        </>
                                    )}
                                    <Input
                                        id="audio-upload"
                                        type="file"
                                        accept="audio/mpeg, audio/mp3, audio/wav"
                                        className="hidden"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={uploading || !file || !title}>
                                {uploading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publicando Episódio...</>
                                ) : (
                                    <><UploadCloud className="mr-2 h-4 w-4" /> Publicar na Plataforma</>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
