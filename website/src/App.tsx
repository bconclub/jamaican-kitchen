import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { CateringCartProvider } from "@/contexts/CateringCartContext";
import { AuthProvider } from "@/lib/auth";
import { Chatbot } from "@/components/Chatbot";
import { CartSidebar } from "@/components/CartSidebar";
import { CateringCartSidebar } from "@/components/CateringCartSidebar";
import Index from "./pages/Index";
import Order from "./pages/Order";
import OrderConfirmation from "./pages/OrderConfirmation";
import Catering from "./pages/Catering";
import Locations from "./pages/Locations";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import About from "./pages/About";
import OurStory from "./pages/OurStory";
import Rewards from "./pages/Rewards";
import MobileApp from "./pages/MobileApp";
import Status from "./pages/Status";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <CartProvider>
    <CateringCartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/order" element={<Order />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/catering" element={<Catering />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/our-story" element={<OurStory />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/account" element={<Rewards />} />
            <Route path="/app" element={<MobileApp />} />
            <Route path="/status" element={<Status />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CartSidebar />
          <CateringCartSidebar />
          <Chatbot />
        </BrowserRouter>
      </TooltipProvider>
    </CateringCartProvider>
    </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
