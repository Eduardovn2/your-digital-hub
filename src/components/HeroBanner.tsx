import { Clock, Star, Truck } from "lucide-react";

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-food-yellow/10 py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
          {/* Text Content */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Sabor que chega{" "}
              <span className="text-gradient">até você!</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto md:mx-0">
              Os melhores pratos da cidade com entrega rápida e ingredientes selecionados.
            </p>

            {/* Features */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full card-shadow">
                <Truck className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Entrega Grátis</span>
              </div>
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full card-shadow">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">30-45 min</span>
              </div>
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full card-shadow">
                <Star className="h-4 w-4 text-food-yellow fill-food-yellow" />
                <span className="text-sm font-medium">4.9 (2k+ avaliações)</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="w-64 h-64 md:w-80 md:h-80 relative">
              <img
                src="https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=400&fit=crop"
                alt="Delicious burger"
                className="w-full h-full object-cover rounded-full card-shadow-hover"
              />
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-food-yellow rounded-full flex items-center justify-center card-shadow animate-bounce-soft">
                <span className="text-2xl">🔥</span>
              </div>
              <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-food-green rounded-full flex items-center justify-center card-shadow">
                <span className="text-xl">🥬</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
