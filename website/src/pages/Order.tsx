import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MenuItemCard } from "@/components/MenuItemCard";
import { CartSidebar } from "@/components/CartSidebar";
import { LocationSelector } from "@/components/LocationSelector";
import { SpiceLevelBadge } from "@/components/SpiceLevelBadge";
import { useMenu } from "@/hooks/useMenu";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";
const Order = () => {
  const { data: menuCategories } = useMenu();
  const { pickupLocation: selectedLocation, setPickupLocation: setSelectedLocation } = useCart();
  const [activeCategory, setActiveCategory] = useState(menuCategories[0].id);
  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const headerOffset = 250;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };
  return <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 md:pt-24">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Order Now</h1>
                <p className="text-secondary-foreground/80">
                  Authentic Jamaican cuisine, ready for pickup
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/20" onClick={() => {
                window.print();
                toast.success("Preparing menu for download...");
              }}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Menu
                </Button>
                <Button variant="outline" size="sm" className="bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/20" onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: "Our Menu",
                      text: "Check out our delicious Jamaican menu!",
                      url: window.location.href
                    });
                  } catch (err) {
                    // User cancelled or share failed
                  }
                } else {
                  await navigator.clipboard.writeText(window.location.href);
                  toast.success("Menu link copied to clipboard!");
                }
              }}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Menu
                </Button>
                <CartSidebar />
              </div>
            </div>
          </div>
        </div>

        {/* Spice Guide */}
        <div className="bg-muted/50 py-4 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
              <span className="text-sm font-bold text-foreground">Bold Indicator:</span>
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
                {menuCategories.map(category => <Button key={category.id} variant={activeCategory === category.id ? "default" : "outline"} size="sm" onClick={() => scrollToCategory(category.id)} className={activeCategory === category.id ? "bg-primary text-primary-foreground" : "border-border hover:border-primary hover:text-primary"}>
                    {category.name}
                  </Button>)}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Location Selector - Sidebar on desktop */}
            <div className="lg:col-span-1 order-first lg:order-last">
              <div className="lg:sticky lg:top-36">
                <LocationSelector selectedLocation={selectedLocation} onLocationChange={setSelectedLocation} />
              </div>
            </div>

            {/* Menu Items */}
            <div className="lg:col-span-3 space-y-12">
              {menuCategories.map(category => <section key={category.id} id={`category-${category.id}`}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-1">{category.name}</h2>
                    <p className="text-muted-foreground">{category.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {category.items.map(item => <MenuItemCard key={item.id} item={item} />)}
                  </div>
                </section>)}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>;
};
export default Order;