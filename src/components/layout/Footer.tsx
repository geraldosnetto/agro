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
                    <div>
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

                {/* Bottom */}
                <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} IndicAgro. Todos os direitos reservados.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Dados fornecidos sem garantia. Consulte as fontes oficiais.
                    </p>
                </div>
            </div>
        </footer>
    );
}
