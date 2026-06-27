import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { BestSellers } from "@/components/BestSellers";
import { Testimonials } from "@/components/Testimonials";
import { DeliveryPartners } from "@/components/DeliveryPartners";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="min-h-screen">
        <HeroSection />
        <BestSellers />
        <DeliveryPartners />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
