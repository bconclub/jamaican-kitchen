import { Link } from "react-router-dom";
import { Star, Flame, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

type SpiceLevel = "mild" | "medium" | "hot";

interface Dish {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  spiceLevel: SpiceLevel;
  rating: number;
}

const bestSellers: Dish[] = [
  {
    id: "oxtail",
    name: "Oxtail",
    description: "Tender, slow-cooked oxtail in rich brown gravy with butter beans",
    price: "$18.99",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
    spiceLevel: "mild",
    rating: 4.9,
  },
  {
    id: "curry-goat",
    name: "Curry Goat",
    description: "Traditional Jamaican curry goat, seasoned and slow-cooked to perfection",
    price: "$17.99",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
    spiceLevel: "medium",
    rating: 4.8,
  },
  {
    id: "jerk-chicken",
    name: "Jerk Chicken",
    description: "Authentic jerk chicken marinated in our signature blend of Jamaican spices",
    price: "$14.99",
    image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&q=80",
    spiceLevel: "hot",
    rating: 4.9,
  },
  {
    id: "pepper-steak",
    name: "Pepper Steak",
    description: "Tender steak strips with bell peppers in savory brown sauce",
    price: "$16.99",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
    spiceLevel: "mild",
    rating: 4.7,
  },
  {
    id: "escovitch-fish",
    name: "Escovitch Fish",
    description: "Crispy fried fish topped with pickled vegetables and scotch bonnet peppers",
    price: "$15.99",
    image: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&q=80",
    spiceLevel: "hot",
    rating: 4.8,
  },
];

const SpiceLevelIndicator = ({ level }: { level: SpiceLevel }) => {
  const config = {
    mild: { label: "Mild", color: "bg-spice-mild", flames: 1 },
    medium: { label: "Medium", color: "bg-spice-medium", flames: 2 },
    hot: { label: "Spicy", color: "bg-spice-hot", flames: 3 },
  };

  const { label, color, flames } = config[level];

  return (
    <div className="flex items-center gap-1.5">
      <div className={`px-2 py-0.5 rounded-full ${color} text-white text-xs font-medium flex items-center gap-1`}>
        {Array.from({ length: flames }).map((_, i) => (
          <Flame key={i} className="h-3 w-3" fill="currentColor" />
        ))}
        <span className="ml-0.5">{label}</span>
      </div>
    </div>
  );
};

export const BestSellers = () => {
  const { items, addItem, updateQuantity } = useCart();
  const qtyOf = (id: string) => items.find((i) => i.id === id)?.quantity ?? 0;

  const handleAdd = (dish: Dish) => {
    addItem({
      id: dish.id,
      name: dish.name,
      price: parseFloat(dish.price.replace(/[^0-9.]/g, "")) || 0,
      spiceLevel: dish.spiceLevel,
      image: dish.image,
    });
    toast.success(`${dish.name} added to your order!`);
  };

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 animate-fade-in">
          <span className="inline-block px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-semibold mb-4">
            Customer Favorites
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Best Sellers</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our most loved dishes, made with authentic Jamaican recipes and the freshest ingredients
          </p>
        </div>

        {/* Dishes Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {bestSellers.map((dish, index) => (
            <Card 
              key={dish.id} 
              className="group overflow-hidden border-2 border-transparent hover:border-primary transition-all duration-300 hover:shadow-xl animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative overflow-hidden">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <SpiceLevelIndicator level={dish.spiceLevel} />
                </div>
                <div className="absolute top-3 right-3 bg-foreground/80 text-background px-2 py-1 rounded-full text-sm flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  <span className="font-semibold">{dish.rating}</span>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-1">{dish.name}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {dish.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-secondary">{dish.price}</span>
                  {qtyOf(dish.id) === 0 ? (
                    <Button
                      size="sm"
                      onClick={() => handleAdd(dish)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1 rounded-md bg-secondary text-secondary-foreground">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-secondary-foreground hover:bg-secondary-foreground/10"
                        onClick={() => updateQuantity(dish.id, qtyOf(dish.id) - 1)}
                        aria-label="Remove one"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center font-bold tabular-nums">{qtyOf(dish.id)}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-secondary-foreground hover:bg-secondary-foreground/10"
                        onClick={() => updateQuantity(dish.id, qtyOf(dish.id) + 1)}
                        aria-label="Add one"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View Full Menu */}
        <div className="text-center mt-12">
          <Link to="/order">
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground font-semibold px-8"
            >
              View Full Menu
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
