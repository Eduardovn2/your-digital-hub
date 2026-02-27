import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Política de Privacidade</h1>
          <p className="text-muted-foreground">Última atualização: 27 de Fevereiro de 2026</p>
        </div>

        <div className="space-y-6 text-foreground/90 leading-7">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Introdução</h2>
            <p>
              A <strong>Viana Ecommerce</strong> valoriza a sua privacidade. Esta política descreve como recolhemos e protegemos os seus dados ao utilizar a nossa plataforma SaaS.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Dados Recolhidos</h2>
            <p>
              Recolhemos informações básicas de autenticação (via Google e Supabase), como nome e e-mail, além de dados necessários para a gestão de pedidos e pagamentos processados pelo Mercado Pago.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Uso de Informações</h2>
            <p>
              Os dados são utilizados estritamente para o funcionamento da loja, processamento de vendas e comunicações relacionadas ao serviço. Não vendemos dados a terceiros.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Segurança</h2>
            <p>
              Utilizamos encriptação SSL em todo o site e os protocolos de segurança avançados do Supabase para garantir que as suas informações estão protegidas.
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

export default PrivacyPolicy;