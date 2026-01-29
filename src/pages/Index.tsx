import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star, Store, ArrowRight, TrendingUp, ShieldCheck, Smartphone } from "lucide-react";

// Dados fictícios para prova social (Lojas Exemplo)
const EXAMPLE_STORES = [
  {
    name: "Burguer King do Bairro",
    type: "Hamburgueria",
    rating: 4.9,
    sales: "1.2k pedidos/mês",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60",
    review: "A VianaEcommerce mudou meu negócio. O painel é incrível!"
  },
  {
    name: "Pizzaria Napolitana",
    type: "Pizzaria",
    rating: 5.0,
    sales: "850 pedidos/mês",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=60",
    review: "Consigo controlar todo o estoque e vendas pelo celular."
  },
  {
    name: "Açaí Tropical",
    type: "Sobremesas",
    rating: 4.8,
    sales: "2.1k pedidos/mês",
    image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=500&auto=format&fit=crop&q=60",
    review: "Melhor investimento de R$ 79,90 que já fiz."
  }
];

export default function Index() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* --- HEADER / NAVBAR --- */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {/* Sua Logo Aqui */}
            <img src="/logo.png" alt="VianaEcommerce" className="h-10 w-10 rounded-full" />
            <span className="text-xl font-bold tracking-tight text-primary">VianaEcommerce</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth" className="text-sm font-medium hover:text-primary hidden sm:block">
              Fazer Login
            </Link>
            <Link to="/register">
              <Button>Criar Minha Loja</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION (Área Principal) --- */}
      <section className="container mx-auto px-4 py-20 text-center lg:py-32">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-6">
          Tenha seu <span className="text-primary">Delivery Próprio</span> <br />
          sem depender de marketplaces.
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600 mb-8">
          A plataforma completa para lanchonetes, restaurantes e deliverys. 
          Controle pedidos, estoque e fature mais sem pagar taxas abusivas por venda.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/register">
            <Button size="lg" className="w-full sm:w-auto h-12 text-lg px-8">
              Começar Teste Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 text-lg">
            Ver Demonstração
          </Button>
        </div>

        {/* --- STATS COUNTER --- */}
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 border-y border-slate-100 py-8 bg-slate-50/50">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-primary">342+</span>
            <span className="text-sm text-slate-500 font-medium uppercase tracking-wider">Sites Criados</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-primary">R$ 1.5M+</span>
            <span className="text-sm text-slate-500 font-medium uppercase tracking-wider">Vendas Processadas</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-primary">99.9%</span>
            <span className="text-sm text-slate-500 font-medium uppercase tracking-wider">Estabilidade</span>
          </div>
        </div>
      </section>

      {/* --- EXEMPLOS DE LOJAS (Prova Social) --- */}
      <section className="bg-slate-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Quem usa, recomenda</h2>
            <p className="text-slate-600">Veja algumas lojas que estão faturando alto com a VianaEcommerce.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {EXAMPLE_STORES.map((store, i) => (
              <Card key={i} className="border-none shadow-lg overflow-hidden hover:scale-105 transition-transform duration-300">
                <div className="h-48 w-full overflow-hidden">
                  <img src={store.image} alt={store.name} className="h-full w-full object-cover" />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{store.name}</CardTitle>
                      <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded-full mt-1 inline-block">
                        {store.type}
                      </span>
                    </div>
                    <div className="flex items-center bg-yellow-100 px-2 py-1 rounded-lg">
                      <Star className="h-4 w-4 text-yellow-600 fill-yellow-600 mr-1" />
                      <span className="font-bold text-sm text-yellow-700">{store.rating}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 italic">"{store.review}"</p>
                  <div className="mt-4 flex items-center text-sm text-green-600 font-medium">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {store.sales}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --- PREÇO E BENEFÍCIOS --- */}
      <section className="py-20 container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div>
            <h2 className="text-3xl font-bold mb-6">Tudo o que você precisa para vender online</h2>
            <ul className="space-y-4">
              {[
                "Cardápio Digital Ilimitado",
                "Painel Administrativo Completo",
                "Gestão de Pedidos em Tempo Real",
                "Impressão Automática de Pedidos",
                "Link Personalizado (sua-loja.viana.com)",
                "Suporte Prioritário"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <Card className="border-2 border-primary shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              MAIS POPULAR
            </div>
            <CardHeader className="text-center pt-10">
              <CardTitle className="text-xl text-slate-500 font-medium">Plano Profissional</CardTitle>
              <div className="mt-4 flex items-baseline justify-center gap-1">
                <span className="text-5xl font-extrabold tracking-tight">R$ 79,90</span>
                <span className="text-slate-500">/mês</span>
              </div>
              <p className="text-sm text-slate-500 mt-2">Cancele quando quiser.</p>
            </CardHeader>
            <CardContent>
              <Link to="/register">
                <Button size="lg" className="w-full text-lg h-12 shadow-lg hover:shadow-xl transition-all">
                  Criar Minha Loja Agora
                </Button>
              </Link>
            </CardContent>
            <CardFooter className="bg-slate-50 text-center py-4">
              <p className="text-xs text-slate-500 w-full flex items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Garantia de 7 dias ou seu dinheiro de volta
              </p>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <img src="/logo.png" alt="Logo" className="h-8 w-8 rounded-full opacity-80" />
            <span className="text-white font-bold text-lg">VianaEcommerce</span>
          </div>
          <p className="mb-8 max-w-md mx-auto">
            Empoderando pequenos e médios negócios de alimentação com tecnologia de ponta e preço justo.
          </p>
          <div className="border-t border-slate-800 pt-8 text-sm">
            &copy; {new Date().getFullYear()} VianaEcommerce. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}