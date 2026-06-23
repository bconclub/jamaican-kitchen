import { PageLayout } from "@/components/PageLayout";

const milestones = [
  { year: "2018", text: "Our first kitchen opens in Vernon, CT, a single counter serving jerk chicken and patties to a growing line of regulars." },
  { year: "2020", text: "Demand for authentic catering takes off. We expand into South Windsor and Windsor Locks." },
  { year: "2022", text: "Three more locations open across Connecticut as word of our oxtail and curry goat spreads." },
  { year: "Today", text: "Six kitchens, one mission: serve the real taste of Jamaica to every neighborhood we call home." },
];

const OurStory = () => (
  <PageLayout title="Our Story" subtitle="From one counter in Vernon to six kitchens across Connecticut.">
    <div className="max-w-2xl mx-auto">
      <div className="space-y-8">
        {milestones.map((m) => (
          <div key={m.year} className="flex gap-5">
            <div className="shrink-0 w-20 text-right">
              <span className="text-xl font-bold text-primary">{m.year}</span>
            </div>
            <div className="border-l-2 border-primary/30 pl-5 pb-2">
              <p className="text-muted-foreground leading-relaxed">{m.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </PageLayout>
);

export default OurStory;
