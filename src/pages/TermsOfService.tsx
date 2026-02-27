import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Termos de Serviço</h1>
          <p className="text-muted-foreground">Última atualização: 27 de Fevereiro de 2026</p>
        </div>

        <div className="space-y-6 text-foreground/90 leading-7">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Aceitação dos Termos</h2>
            <p>
              Ao utilizar a plataforma <strong>Viana Ecommerce</strong>, você concorda em cumprir estes termos. Nosso serviço permite que lojistas criem e gerenciem suas lojas digitais de forma simplificada.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Responsabilidades do Usuário</h2>
            <p>
              O usuário é responsável pela veracidade das informações da sua loja, pela gestão dos seus produtos e pelo atendimento aos seus clientes finais.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Pagamentos e Assinaturas</h2>
            <p>
              O processamento de pagamentos é realizado via Mercado Pago. A manutenção do acesso ao painel administrativo depende da regularidade da assinatura do plano escolhido.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Propriedade Intelectual</h2>
            <p>
              A estrutura, código e design da plataforma são de propriedade exclusiva da Viana Ecommerce. O conteúdo inserido nas lojas (fotos e textos) permanece sendo de propriedade do lojista.
            </p>
          </section>
        </div>

        <div className="pt-8 border-t">
          <Link to="/">
            <Button variant="outline">Voltar para a Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;