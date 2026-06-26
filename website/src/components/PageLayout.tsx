import { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export const PageLayout = ({ title, subtitle, children }: PageLayoutProps) => (
  <div className="flex min-h-screen flex-col bg-background">
    <Header />
    <main className="flex-1 pt-20 md:pt-24 pb-16">
      <div className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
          {subtitle && <p className="text-secondary-foreground/80 text-lg max-w-2xl">{subtitle}</p>}
        </div>
      </div>
      <div className="container mx-auto px-4 py-10">{children}</div>
    </main>
    <Footer />
  </div>
);
