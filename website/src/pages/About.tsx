import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Leaf, Users } from "lucide-react";

const values = [
  { icon: Heart, title: "Made with Love", text: "Family recipes passed down through generations, cooked fresh every day." },
  { icon: Leaf, title: "Authentic Ingredients", text: "Real scotch bonnet, pimento, and island spices, never shortcuts." },
  { icon: Users, title: "Community First", text: "Proudly serving Connecticut neighborhoods across six locations." },
];

const About = () => (
  <PageLayout title="About Us" subtitle="Authentic Jamaican cuisine, brought to Connecticut with pride.">
    <div className="max-w-3xl mx-auto space-y-6 text-muted-foreground leading-relaxed">
      <p>
        Jamaican Kitchen brings the bold, soulful flavors of the Caribbean to Connecticut. From smoky
        jerk chicken to fall-off-the-bone oxtail, every plate is cooked the way it would be back home -
        slow, seasoned, and full of heart.
      </p>
      <p>
        What started as one family's passion for sharing the taste of Jamaica has grown into six
        neighborhood kitchens, each serving the same authentic dishes our community has come to love.
      </p>
    </div>
    <div className="grid md:grid-cols-3 gap-6 mt-10 max-w-4xl mx-auto">
      {values.map((v) => (
        <Card key={v.title} className="text-center">
          <CardContent className="pt-6">
            <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
              <v.icon className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-bold mb-2">{v.title}</h3>
            <p className="text-sm text-muted-foreground">{v.text}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </PageLayout>
);

export default About;
