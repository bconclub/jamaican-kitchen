import { Link } from "react-router-dom";
import { ChefHat, MapPin, Phone, Utensils, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
const quickLinks = [{
  label: "Order Catering",
  href: "/catering",
  icon: ChefHat
}, {
  label: "View Menu",
  href: "/order",
  icon: BookOpen
}, {
  label: "Locations",
  href: "/locations",
  icon: MapPin
}, {
  label: "Contact Us",
  href: "/contact",
  icon: Phone
}];
export const HeroSection = () => {
  return <section className="relative min-h-[90vh] flex items-center pt-24">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80')`
    }}>
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/40" />
      </div>

      {/* Quick Links Panel, desktop only (floats beside the hero) */}
      <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 right-8 xl:right-12 z-20 animate-scale-in">
        <div className="bg-card/95 backdrop-blur-md rounded-2xl p-4 md:p-5 shadow-2xl w-[320px]">
          <h3 className="text-lg font-bold mb-3 text-foreground">Quick Links</h3>
          <div className="space-y-2">
            {quickLinks.map(link => <Link key={link.href} to={link.href} className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-primary/20 hover:border-primary border-2 border-transparent transition-all group">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary transition-colors">
                  <link.icon className="h-5 w-5 text-secondary-foreground group-hover:text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                  {link.label}
                </span>
              </Link>)}
          </div>
        </div>
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

            {/* Quick links, inline on mobile/tablet (the floating panel is desktop-only) */}
            <div className="mt-8 grid grid-cols-2 gap-3 lg:hidden">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center gap-2 rounded-xl bg-card/95 backdrop-blur-md p-3 transition-all hover:bg-primary/20"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <link.icon className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>;
};