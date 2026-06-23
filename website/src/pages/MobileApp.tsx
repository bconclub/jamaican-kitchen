import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Smartphone, Apple } from "lucide-react";

const MobileApp = () => (
  <PageLayout title="Download Our App" subtitle="Order faster, earn rewards, and track your pickup from your phone.">
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Smartphone className="h-10 w-10 text-primary" />
      </div>
      <p className="text-muted-foreground mb-8">
        The Jamaican Kitchen app puts the whole menu in your pocket, reorder favorites in a tap, save
        your pickup location, and skip the line.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" variant="outline" className="gap-2" disabled>
          <Apple className="h-5 w-5" /> App Store (Coming Soon)
        </Button>
        <Button size="lg" variant="outline" className="gap-2" disabled>
          <Smartphone className="h-5 w-5" /> Google Play (Coming Soon)
        </Button>
      </div>
    </div>
  </PageLayout>
);

export default MobileApp;
