
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Política de Privacidade | IndicAgro",
    description: "Como tratamos seus dados pessoais no IndicAgro.",
};

export default function PrivacidadePage() {
    return (
        <div className="container mx-auto py-10 px-4 md:px-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <p className="text-lg text-muted-foreground">
                    Sua privacidade é fundamental para nós. Esta política descreve como o IndicAgro coleta, usa e protege suas informações, em total conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                </p>

                <section>
                    <h2 className="text-xl font-semibold mb-4">1. Dados que Coletamos</h2>
                    <p>Coletamos apenas os dados essenciais para o funcionamento do serviço:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong>Cadastro:</strong> Nome, e-mail e foto (caso utilize login social).</li>
                        <li><strong>Preferências:</strong> Commodities favoritas, alertas configurados e cidades de interesse (para previsão do tempo).</li>
                        <li><strong>Uso:</strong> Logs de acesso para segurança e auditoria (IP, navegador, data/hora).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">2. Finalidade do Tratamento</h2>
                    <p>Utilizamos seus dados para:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Autenticar seu acesso à plataforma.</li>
                        <li>Enviar alertas de preço e relatórios por e-mail (que você optou por receber).</li>
                        <li>Personalizar sua experiência (ex: mostrar previsão do tempo da sua cidade).</li>
                        <li>Melhorar nossos produtos através de análises de uso anônimas.</li>
                    </ul>
                    <p className="mt-2">Não vendemos seus dados pessoais para terceiros em nenhuma hipótese.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">3. Armazenamento e Segurança</h2>
                    <p>
                        Seus dados são armazenados em servidores seguros (nuvem) com criptografia. Senhas são armazenadas utilizando hash irreversível. Adotamos medidas técnicas adequadas para proteger contra acesso não autorizado.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">4. Cookies</h2>
                    <p>
                        Utilizamos cookies essenciais para manter sua sessão ativa e cookies analíticos para entender como o site é utilizado (ex: Google Analytics). Você pode gerenciar suas preferências de cookies nas configurações do seu navegador.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">5. Seus Direitos (LGPD)</h2>
                    <p>Você tem total controle sobre seus dados. A qualquer momento, você pode:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Acessar e retificar seus dados (via página de Perfil).</li>
                        <li>Solicitar a exportação dos seus dados pessoais.</li>
                        <li>Solicitar a <strong>exclusão definitiva</strong> da sua conta.</li>
                        <li>Revogar consentimento para recebimento de e-mails.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">6. Contato</h2>
                    <p>
                        Para exercer seus direitos ou tirar dúvidas sobre privacidade, entre em contato através do e-mail: <strong>privacidade@indicagro.com.br</strong> ou pelo nosso suporte na plataforma.
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                        Última atualização: 28 de Janeiro de 2026.
                    </p>
                </section>
            </div>
        </div>
    );
}
