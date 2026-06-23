import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Star, Trophy } from "lucide-react";

const perks = [
  { icon: Star, title: "Earn on every order", text: "Collect points each time you order pickup online." },
  { icon: Gift, title: "Free food", text: "Redeem points for patties, sides, drinks, and full meals." },
  { icon: Trophy, title: "Member perks", text: "Early access to specials and birthday treats." },
];

const Rewards = () => (
  <PageLayout title="Rewards / Login" subtitle="Earn points on every order and unlock island rewards.">
    <div className="max-w-3xl mx-auto">
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {perks.map((p) => (
          <Card key={p.title} className="text-center">
            <CardContent className="pt-6">
              <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                <p.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="text-center bg-muted/50 rounded-xl p-8">
        <h3 className="text-xl font-bold mb-2">Rewards are coming soon</h3>
        <p className="text-muted-foreground">
          We're putting the finishing touches on our loyalty program. Order online today, your points
          will be waiting for you when it launches.
        </p>
      </div>
    </div>
  </PageLayout>
);

export default Rewards;
