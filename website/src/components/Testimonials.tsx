import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Testimonial {
  id: string;
  name: string;
  rating: number;
  text: string;
  avatar?: string;
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Brenda M.",
    rating: 5,
    text: "Food is Great!!! The atmosphere & music playing are relaxing while waiting for your order. Denote recognizes my husband and me; he is always a friendly face!",
  },
  {
    id: "2",
    name: "Alex L.",
    rating: 5,
    text: "Well worth the 1hr drive for me. We had the jamaican patties with coco bread and cabbage with rice. Everything was delicious; I only wish they were closer to me.",
  },
  {
    id: "3",
    name: "Rachelle K.",
    rating: 5,
    text: "I had the best meal here. You get what you pay for! Well worth it. All that was left was bones! Definitely coming back again!",
  },
  {
    id: "4",
    name: "Marcus T.",
    rating: 5,
    text: "The oxtail is absolutely incredible - falls right off the bone! Best Jamaican food I've had outside of Jamaica. Staff is super friendly too.",
  },
  {
    id: "5",
    name: "Sophia W.",
    rating: 5,
    text: "Their curry goat is authentic and reminds me of my grandmother's cooking back home. Generous portions and amazing flavor. A hidden gem in Connecticut!",
  },
];

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-primary text-primary" : "fill-muted text-muted"}`}
      />
    ))}
  </div>
);

export const Testimonials = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary/10 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 text-primary/10">
        <Quote className="h-40 w-40" />
      </div>
      <div className="absolute bottom-10 right-10 text-primary/10 rotate-180">
        <Quote className="h-40 w-40" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 animate-fade-in">
          <span className="inline-block px-4 py-2 bg-secondary/20 text-secondary rounded-full text-sm font-semibold mb-4">
            Customer Reviews
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Our Guests Are Saying
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Don't just take our word for it, hear from our satisfied customers about their Jamaican Kitchen experience
          </p>
        </div>

        {/* Testimonials Carousel */}
        <Carousel
          opts={{ align: "start", loop: true }}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent className="-ml-4">
            {testimonials.map((testimonial) => (
              <CarouselItem
                key={testimonial.id}
                className="pl-4 md:basis-1/2 lg:basis-1/3"
              >
                <Card className="h-full bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-lg">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                        <StarRating rating={testimonial.rating} />
                      </div>
                    </div>
                    <p className="text-muted-foreground italic leading-relaxed">
                      "{testimonial.text}"
                    </p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </div>
    </section>
  );
};
