import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Clock, Navigation } from "lucide-react";

const locations = [
  {
    name: "Vernon",
    address: "123 Hartford Turnpike, Vernon, CT 06066",
    phone: "(860) 555-0101",
    hours: "Mon-Sat: 11am-9pm, Sun: 12pm-8pm",
  },
  {
    name: "South Windsor",
    address: "456 Sullivan Ave, South Windsor, CT 06074",
    phone: "(860) 555-0102",
    hours: "Mon-Sat: 11am-9pm, Sun: 12pm-8pm",
  },
  {
    name: "Windsor Locks",
    address: "789 Main St, Windsor Locks, CT 06096",
    phone: "(860) 555-0103",
    hours: "Mon-Sat: 11am-9pm, Sun: 12pm-8pm",
  },
  {
    name: "Bristol",
    address: "321 Farmington Ave, Bristol, CT 06010",
    phone: "(860) 555-0104",
    hours: "Mon-Sat: 11am-9pm, Sun: 12pm-8pm",
  },
  {
    name: "Rocky Hill",
    address: "654 Silas Deane Hwy, Rocky Hill, CT 06067",
    phone: "(860) 555-0105",
    hours: "Mon-Sat: 11am-9pm, Sun: 12pm-8pm",
  },
  {
    name: "Enfield",
    address: "987 Enfield St, Enfield, CT 06082",
    phone: "(860) 555-0106",
    hours: "Mon-Sat: 11am-9pm, Sun: 12pm-8pm",
  },
];

const Locations = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 md:pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Our Locations
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find authentic Jamaican cuisine at one of our six Connecticut locations. 
              Each restaurant serves the same delicious flavors you love!
            </p>
          </div>

          {/* Locations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => (
              <Card 
                key={location.name} 
                className="overflow-hidden hover:shadow-xl transition-shadow duration-300 border-border"
              >
                <div className="h-2 bg-primary" />
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-primary" />
                    {location.name}
                  </h2>
                  
                  <div className="space-y-3 text-muted-foreground">
                    <p className="flex items-start gap-3">
                      <Navigation className="h-5 w-5 mt-0.5 text-primary/70 flex-shrink-0" />
                      <span>{location.address}</span>
                    </p>
                    
                    <p className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary/70 flex-shrink-0" />
                      <a 
                        href={`tel:${location.phone.replace(/[^0-9]/g, '')}`}
                        className="hover:text-primary transition-colors"
                      >
                        {location.phone}
                      </a>
                    </p>
                    
                    <p className="flex items-start gap-3">
                      <Clock className="h-5 w-5 mt-0.5 text-primary/70 flex-shrink-0" />
                      <span>{location.hours}</span>
                    </p>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Button 
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(location.address)}`, '_blank')}
                    >
                      Get Directions
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      asChild
                    >
                      <a href={`tel:${location.phone.replace(/[^0-9]/g, '')}`}>
                        Call Now
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to Action */}
          <div className="mt-16 text-center bg-muted/50 rounded-2xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Can't Decide Which Location?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              All our locations serve the same authentic Jamaican recipes with love. 
              Pick the one closest to you and taste the islands!
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
              <a href="/order">Order Online Now</a>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Locations;
