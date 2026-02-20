import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Star, ShieldCheck, Zap, Smartphone, Globe } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { HeroSection } from "@/components/home/HeroSection";

// Dados para prova social
const EXAMPLE_STORES = [
  {
    name: "Burguer King do Bairro",
    type: "Hamburgueria",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60",
    review: "A plataforma mudou meu negócio. O painel é incrível!"
  },
  {
    name: "Pizzaria Napolitana",
    type: "Pizzaria",
    rating: 5.0,
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=60",
    review: "Consigo controlar todo o estoque pelo celular."
  },
  {
    name: "Açaí Tropical",
    type: "Sobremesas",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=500&auto=format&fit=crop&q=60",
    review: "Melhor investimento que já fiz para minha loja."
  }
];

export default function Index() {
  return (
    <div className="min-h-screen bg-slate-50/50 font-sans selection:bg-primary/20">
      
      {/* HEADER Transparente */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-white/70 backdrop-blur-md transition-all">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-gradient-to-tr from-primary to-blue-600 p-[2px]">
               <div className="h-full w-full rounded-[10px] bg-white flex items-center justify-center">
                  <span className="font-bold text-primary text-xl">V</span>
               </div>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">VianaEccomerce</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors hidden sm:block">
              Fazer Login
            </Link>
            <Link to="/register">
              <Button className="rounded-full shadow-lg shadow-primary/20">Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <HeroSection />

      {/* --- MUDANÇA AQUI: Adicionado id="demonstracao" --- */}
      <section id="demonstracao" className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-slate-900">
              Tudo o que você precisa para <span className="text-primary">vender online</span>
            </h2>
            <p className="text-slate-600 text-lg">
              Tecnologia de ponta simplificada para o seu negócio de alimentação.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Globe, title: "Site Próprio", desc: "Sua marca, suas regras. Um domínio personalizado para seus clientes." },
              { icon: Smartphone, title: "App Like", desc: "Experiência de aplicativo nativo sem precisar baixar nada." },
              { icon: Zap, title: "Gestão em Tempo Real", desc: "Receba pedidos instantaneamente no balcão ou na cozinha." }
            ].map((feature, i) => (
              <GlassCard key={i} className="p-8 text-center hover:bg-white/80" intensity="light">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: Prova Social */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Quem usa, recomenda</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {EXAMPLE_STORES.map((store, i) => (
              <GlassCard key={i} className="group border-slate-100 bg-slate-50/50" hoverEffect={true}>
                <div className="h-48 w-full overflow-hidden">
                  <img src={store.image} alt={store.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{store.name}</h3>
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{store.type}</span>
                    </div>
                    <div className="flex items-center bg-yellow-400/20 px-2 py-1 rounded-lg text-yellow-700 font-bold text-sm">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      {store.rating}
                    </div>
                  </div>
                  <p className="text-slate-600 italic text-sm">"{store.review}"</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: Preço (CTA Final) */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* Efeitos de fundo */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Comece hoje e transforme seu delivery
              </h2>
              <ul className="space-y-4 mb-8">
                {[
                  "Cardápio Digital Ilimitado",
                  "Sem taxas por pedido",
                  "Link Personalizado",
                  "Suporte via WhatsApp"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-green-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <GlassCard intensity="heavy" className="bg-white/5 border-white/10 p-8 text-center relative">
              <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                OFERTA ESPECIAL
              </div>
              <h3 className="text-xl text-slate-300 font-medium mb-2">Plano Profissional</h3>
              <div className="flex items-baseline justify-center gap-1 mb-6">
                <span className="text-5xl font-extrabold text-white">R$ 79,90</span>
                <span className="text-slate-400">/mês</span>
              </div>
              <Link to="/register">
                <Button size="lg" className="w-full h-12 text-lg bg-primary hover:bg-primary/90 shadow-neon border-0">
                  Criar Minha Loja
                </Button>
              </Link>
              <p className="mt-4 text-xs text-slate-400 flex items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4" /> 15 dias de garantia incondicional
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* FOOTER Simples */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-white/5">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} VianaEccomerce. Tecnologia para Deliverys.
          </p>
        </div>
      </footer>
    </div>
  );
}