import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
export const HeroSection = () => {
  return <section className="relative min-h-[90vh] flex items-center pt-24">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80')`
    }}>
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/40" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          {/* Left Content */}
          <div className="text-background animate-slide-up">
            <span className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold mb-6">Bring Island Spirit to Your Food</span>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold mb-6 leading-[1.05]">
              Welcome to
              <span className="block text-primary">Jamaican Kitchen</span>
            </h1>
            <p className="text-lg md:text-xl text-background/90 mb-8 max-w-xl">
              Discover the heart of Jamaica right here in Connecticut! We serve island classics like jerk chicken, curry goat, and oxtail, made fresh daily with locally sourced ingredients.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/order">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 shadow-xl">
                  Order Now
                </Button>
              </Link>
              <Link to="/catering">
                <Button size="lg" variant="outline" className="bg-transparent border-2 border-background text-background hover:bg-background/10 text-lg px-8">
                  Book Catering
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>;
};