import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";

export function HeroSection() {
  
  // Função para rolar até a demonstração
// Função para rolar até a demonstração com AJUSTE FINO
const scrollToDemo = () => {
    const element = document.getElementById('demonstracao');
    if (element) {
      const yCoordinate = element.getBoundingClientRect().top + window.scrollY;
      
      // Verifica a largura da tela
      // Se for menor que 768px, consideramos Mobile.
      const isMobile = window.innerWidth < 768;

      // LÓGICA CONDICIONAL:
      // Se for Mobile  -> usa 1050 (o valor que ficou bom pra você)
      // Se for Desktop -> usa -100 (para parar logo acima do título, ajustando o cabeçalho)
      
      const yOffset = isMobile ? 1050 : 450; 
      
      window.scrollTo({ top: yCoordinate + yOffset, behavior: 'smooth' }); 
    }
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-transparent">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in-up">
          
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
            Delivery Próprio <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
              Sem Taxas
            </span>
          </h1>
          
          <p className="text-lg lg:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A plataforma completa para você vender mais. Cardápio digital, gestão de pedidos e pagamentos em um só lugar. Pare de pagar comissões abusivas e venha para a Viana.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center pt-4">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-14 text-lg px-10 rounded-full shadow-neon hover:shadow-lg transition-all">
                Criar Loja Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            
            {/* --- MUDANÇA AQUI: Botão com onClick --- */}
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto h-14 text-lg px-8 rounded-full border-2 hover:bg-slate-50"
              onClick={scrollToDemo}
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Ver Demonstração
            </Button>
            {/* -------------------------------------- */}
            
          </div>
        </div>
      </div>
    </section>
  );
}