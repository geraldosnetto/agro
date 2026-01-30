
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Termos de Uso | IndicAgro",
    description: "Termos e condições de uso da plataforma IndicAgro.",
};

export default function TermosPage() {
    return (
        <div className="container mx-auto py-10 px-4 md:px-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Termos de Uso</h1>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <section>
                    <h2 className="text-xl font-semibold mb-4">1. Aceitação dos Termos</h2>
                    <p>
                        Ao acessar e utilizar a plataforma IndicAgro, você concorda integralmente com estes Termos de Uso e com nossa Política de Privacidade. Caso não concorde com qualquer disposição, você não deve utilizar nossos serviços.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">2. Natureza dos Serviços</h2>
                    <p>
                        O IndicAgro é uma plataforma de SaaS (Software as a Service) focada em inteligência de mercado agrícola. Fornecemos ferramentas de visualização, organização e análise de dados públicos e privados.
                    </p>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 border-l-4 border-yellow-500 my-4 text-sm">
                        <strong>AVISO LEGAL IMPORTANTE (DISCLAIMER):</strong>
                        <br className="mb-2" />
                        As informações disponibilizadas nesta plataforma têm caráter estritamente <strong>informativo e educacional</strong>. O IndicAgro não é uma casa de análise, consultoria financeira ou instituição credenciada pela CVM (Comissão de Valores Mobiliários).
                        <br /><br />
                        Nenhuma informação contida neste site constitui recomendação de compra, venda ou manutenção de ativos financeiros. Decisões de investimento são de inteira e exclusiva responsabilidade do usuário. O mercado de commodities envolve riscos significativos.
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">3. Dados e Fontes</h2>
                    <p>
                        Utilizamos dados de fontes públicas reconhecidas (como CEPEA/Esalq, Banco Central do Brasil, entre outros) e fontes parceiras.
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Os dados brutos pertencem às suas respectivas fontes, devidamente citadas.</li>
                        <li>O IndicAgro não garante a precisão, integridade ou atualização em tempo real de 100% dos dados, estando sujeito a instabilidades das fontes originais.</li>
                        <li>O serviço oferecido é a <strong>agenação, curadoria e análise</strong> destes dados, e não a venda do dado bruto em si.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">4. Propriedade Intelectual</h2>
                    <p>
                        Todo o design, código-fonte, algoritmos de IA, logotipos e análises proprietárias geradas pelo IndicAgro são protegidos por direitos autorais. É expressamente proibido:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Realizar engenharia reversa da plataforma.</li>
                        <li>Utilizar bots, scrapers ou crawlers para extração massiva de dados ("data mining").</li>
                        <li>Compartilhar sua conta de acesso com terceiros (o login é pessoal e intransferível).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">5. Limitação de Responsabilidade</h2>
                    <p>
                        Em nenhuma hipótese o IndicAgro, seus sócios ou colaboradores serão responsáveis por danos indiretos, lucros cessantes, perda de dados ou prejuízos financeiros decorrentes do uso ou da impossibilidade de uso da plataforma. O serviço é fornecido "no estado em que se encontra" ("as is").
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">6. Planos e Pagamentos</h2>
                    <p>
                        Certos recursos podem ser restritos a assinantes. Reservamo-nos o direito de alterar preços e planos a qualquer momento, mediante aviso prévio para renovações. Cancelamentos podem ser solicitados a qualquer momento através do painel do usuário, sem multa, respeitando o período de vigência já pago.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">7. Alterações nos Termos</h2>
                    <p>
                        Podemos atualizar estes termos periodicamente. O uso contínuo da plataforma após as alterações constitui aceitação dos novos termos.
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                        Última atualização: 28 de Janeiro de 2026.
                    </p>
                </section>
            </div>
        </div>
    );
}
