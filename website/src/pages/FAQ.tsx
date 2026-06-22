import { PageLayout } from "@/components/PageLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How do I place an order for pickup?",
    a: "Head to the Order Online page, browse the menu, add items to your cart, choose your pickup location, and check out. You'll get an order number to show at the counter.",
  },
  {
    q: "Do you offer delivery?",
    a: "We partner with major delivery apps for delivery in select areas. For pickup, order directly on our site for the fastest service and best prices.",
  },
  {
    q: "How does catering work?",
    a: "Visit the Catering page, choose your trays and portion sizes, and submit a catering request. A small portion feeds 8–12 people; a large feeds 18–22. We ask for at least 48 hours notice.",
  },
  {
    q: "How spicy is the food?",
    a: "Every dish is marked Mild, Medium, or Hot so you know what to expect. Our jerk dishes pack authentic scotch-bonnet heat — ask staff if you'd like it toned down.",
  },
  {
    q: "Do you have vegetarian options?",
    a: "Yes — veggie patties, rice & peas, festival, fried plantains, steamed cabbage and more. Let us know about allergies and we'll guide you.",
  },
  {
    q: "What are your hours?",
    a: "Most locations are open 11am–9pm daily. Check the Locations page for the exact hours and phone number of your nearest spot.",
  },
];

const FAQ = () => (
  <PageLayout title="Frequently Asked Questions" subtitle="Everything you need to know about ordering, catering, and more.">
    <div className="max-w-3xl mx-auto">
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left text-base font-semibold">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </PageLayout>
);

export default FAQ;
