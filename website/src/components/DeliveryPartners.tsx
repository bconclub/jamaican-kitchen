import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const partners = [
  {
    name: "Uber Eats",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Uber_Eats_2020_logo.svg",
    url: "https://www.ubereats.com",
    bgColor: "bg-black",
    wordmarkColor: "",
  },
  {
    name: "DoorDash",
    logo: "",
    url: "https://www.doordash.com",
    bgColor: "bg-white",
    wordmarkColor: "#FF3008",
  },
];

export const DeliveryPartners = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Order Delivery
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Can't make it to us? We'll come to you! Order through your favorite delivery app.
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
          {partners.map((partner) => (
            <a
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div
                className={`${partner.bgColor} rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center min-w-[150px] sm:min-w-[180px] md:min-w-[220px] h-24 md:h-28 border border-border`}
              >
                {partner.logo ? (
                  <img src={partner.logo} alt={partner.name} className="h-10 md:h-12 object-contain" />
                ) : (
                  <span className="text-2xl md:text-3xl font-extrabold" style={{ color: partner.wordmarkColor }}>
                    {partner.name}
                  </span>
                )}
              </div>
              <p className="text-center mt-3 text-sm text-muted-foreground group-hover:text-primary transition-colors flex items-center justify-center gap-1">
                Order on {partner.name}
                <ExternalLink className="h-3 w-3" />
              </p>
            </a>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-sm text-muted-foreground mb-4">
            Or order directly from us for the best deals!
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
            <a href="/order">Order Direct</a>
          </Button>
        </div>
      </div>
    </section>
  );
};
