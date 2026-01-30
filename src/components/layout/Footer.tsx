import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t bg-muted/30">
            <div className="container px-4 py-8 md:py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                                <svg
                                    className="h-5 w-5 text-primary-foreground"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                    />
                                </svg>
                            </div>
                            <span className="text-lg font-bold">
                                Indic<span className="text-primary">Agro</span>
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            Indicadores agrícolas brasileiros em tempo real.
                        </p>
                    </div>

                    {/* Cotações */}
                    <div>
                        <h4 className="font-semibold mb-3">Cotações</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link href="/graos" className="hover:text-foreground transition-colors">
                                    Grãos
                                </Link>
                            </li>
                            <li>
                                <Link href="/pecuaria" className="hover:text-foreground transition-colors">
                                    Pecuária
                                </Link>
                            </li>
                            <li>
                                <Link href="/sucroenergetico" className="hover:text-foreground transition-colors">
                                    Sucroenergetico
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Fontes */}
                    <div>
                        <h4 className="font-semibold mb-3">Fontes</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <a
                                    href="https://www.cepea.esalq.usp.br"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-foreground transition-colors"
                                >
                                    CEPEA/ESALQ
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://www.conab.gov.br"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-foreground transition-colors"
                                >
                                    CONAB
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://www.bcb.gov.br"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-foreground transition-colors"
                                >
                                    Banco Central
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="space-y-4">
                        <h4 className="font-semibold mb-3">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link href="/sobre" className="hover:text-foreground transition-colors">
                                    Sobre
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacidade" className="hover:text-foreground transition-colors">
                                    Privacidade
                                </Link>
                            </li>
                            <li>
                                <Link href="/termos" className="hover:text-foreground transition-colors">
                                    Termos de Uso
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Disclaimer e Copyright */}
                <div className="mt-12 border-t pt-8">
                    <div className="bg-muted/50 p-6 rounded-lg text-sm text-muted-foreground mb-8 text-justify leading-relaxed border border-border/50">
                        <strong className="text-foreground block mb-2">AVISO LEGAL IMPORTANTE:</strong>
                        Todo o conteúdo disponibilizado no IndicAgro (preços, gráficos, notícias e análises) possui caráter exclusivamente <strong>informativo e educacional</strong>.
                        Não somos uma instituição financeira, corretora ou consultoria de investimentos credenciada pela CVM.
                        As informações não constituem recomendação de compra ou venda de ativos. O mercado agropecuário e financeiro envolve riscos.
                        Rentabilidade passada não é garantia de resultados futuros. Tome suas decisões com base em múltiplas fontes e consulte um profissional especializado.
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                        <p>© {new Date().getFullYear()} IndicAgro. Todos os direitos reservados.</p>
                        <div className="flex items-center gap-4">
                            <span>Feito com ❤️ para o Agro Brasileiro</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
