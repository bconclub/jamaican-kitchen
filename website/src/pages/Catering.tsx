import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CateringMenuCard } from "@/components/CateringMenuCard";
import { EventBookingForm } from "@/components/EventBookingForm";
import { SpiceLevelBadge } from "@/components/SpiceLevelBadge";
import { cateringCategories } from "@/data/cateringData";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { UtensilsCrossed, Users, Clock } from "lucide-react";

const Catering = () => {
  const [activeCategory, setActiveCategory] = useState(cateringCategories[0].id);

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    document.getElementById(`catering-${categoryId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 md:pt-24">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <UtensilsCrossed className="h-8 w-8" />
                  <h1 className="text-3xl md:text-4xl font-bold">Catering Menu</h1>
                </div>
                <p className="text-secondary-foreground/80 text-lg mb-4">
                  Bring authentic Jamaican flavors to your next event. For our catering options, 
                  a small portion will comfortably feed around 8 to 12 people. Our large portions 
                  will comfortably feed between 18 to 22 people.
                </p>
              </div>

              {/* Quick Info Cards */}
              <div className="grid grid-cols-2 gap-4 lg:w-auto">
                <div className="bg-secondary-foreground/10 rounded-lg p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-bold text-lg">8-22</div>
                  <div className="text-sm text-secondary-foreground/70">People per Tray</div>
                </div>
                <div className="bg-secondary-foreground/10 rounded-lg p-4 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-bold text-lg">48hrs</div>
                  <div className="text-sm text-secondary-foreground/70">Advance Notice</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spice Guide */}
        <div className="bg-muted/50 py-4 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
              <span className="text-sm font-medium text-muted-foreground">Spice Guide:</span>
              <div className="flex gap-3">
                <SpiceLevelBadge level="mild" />
                <SpiceLevelBadge level="medium" />
                <SpiceLevelBadge level="hot" />
              </div>
            </div>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="sticky top-16 md:top-20 z-30 bg-background border-b border-border shadow-sm">
          <div className="container mx-auto px-4">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 py-3">
                {cateringCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => scrollToCategory(category.id)}
                    className={
                      activeCategory === category.id
                        ? "bg-primary text-primary-foreground"
                        : "border-border hover:border-primary hover:text-primary"
                    }
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Menu Items */}
            <div className="space-y-12">
              {cateringCategories.map((category) => (
                <section key={category.id} id={`catering-${category.id}`} className="scroll-mt-32 md:scroll-mt-36">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-1">{category.name}</h2>
                    <p className="text-muted-foreground">{category.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.items.map((item) => (
                      <CateringMenuCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>

        {/* Catering Request Form */}
        <div className="bg-background py-12 border-t border-border">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Book Your Event</h2>
              <p className="text-muted-foreground">
                Tell us about your event and we'll send a custom quote within 24 hours.
              </p>
            </div>
            <EventBookingForm />
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="bg-muted py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Why Choose Our Catering?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-background rounded-lg p-6 text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UtensilsCrossed className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Authentic Recipes</h3>
                <p className="text-muted-foreground text-sm">
                  Traditional Jamaican recipes passed down through generations, made with love.
                </p>
              </div>
              <div className="bg-background rounded-lg p-6 text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Flexible Portions</h3>
                <p className="text-muted-foreground text-sm">
                  Choose from small or large trays to perfectly fit your guest count.
                </p>
              </div>
              <div className="bg-background rounded-lg p-6 text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Fresh & On Time</h3>
                <p className="text-muted-foreground text-sm">
                  Every order is prepared fresh and delivered on time for your event.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Catering;
