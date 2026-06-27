import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eventTypes } from "@/data/cateringData";
import { Calendar, Users, MapPin, Phone, Mail, Send, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitCateringRequest } from "@/lib/api";
import { useCateringCart } from "@/contexts/CateringCartContext";

interface SubmittedSummary {
  name: string;
  eventType: string;
  eventDate: string;
  guestCount: string;
  location: string;
}

export const EventBookingForm = () => {
  const { toast } = useToast();
  const { items: selectedItems, totalPrice: selectionTotal, clearCart: clearCateringCart } = useCateringCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedSummary | null>(null);
  const [service, setService] = useState<"pickup" | "delivery">("pickup");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    eventType: "",
    eventDate: "",
    guestCount: "",
    location: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, eventType: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Fold the catering selection into the request so the quote captures it.
      const itemsLine = selectedItems.length
        ? `Requested items: ${selectedItems.map((i) => `${i.quantity}x ${i.name}`).join(", ")} (est. $${selectionTotal.toFixed(2)})`
        : "";
      const serviceLine =
        service === "delivery"
          ? `Service: Delivery${formData.location ? ` to ${formData.location}` : " (address to confirm)"}`
          : "Service: Pickup";
      const fullMessage = [serviceLine, itemsLine, formData.message].filter(Boolean).join("\n\n");

      await submitCateringRequest({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        event_type: formData.eventType,
        event_date: formData.eventDate || undefined,
        guest_count: formData.guestCount ? Number(formData.guestCount) : undefined,
        location: formData.location,
        message: fullMessage,
      });
      clearCateringCart();

      setSubmitted({
        name: formData.name,
        eventType: formData.eventType,
        eventDate: formData.eventDate,
        guestCount: formData.guestCount,
        location: formData.location,
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        eventType: "",
        eventDate: "",
        guestCount: "",
        location: "",
        message: "",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Something went wrong",
        description: "We couldn't submit your request. Please try again or call us.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-2 border-primary/30 shadow-lg">
        <CardContent className="p-6 md:p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
            <CheckCircle2 className="h-9 w-9 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-1">
            Catering request received{submitted.name ? `, ${submitted.name.split(" ")[0]}` : ""}!
          </h3>
          <p className="text-muted-foreground mb-6">
            Thanks for telling us about your event. Here's what we've got.
          </p>

          {/* Event summary */}
          <div className="mx-auto max-w-md rounded-xl border border-border bg-muted/40 p-4 text-left space-y-2 text-sm">
            {submitted.eventType && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-secondary" />
                <span className="text-muted-foreground">Event:</span>
                <span className="font-medium">{submitted.eventType}</span>
              </div>
            )}
            {submitted.eventDate && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-secondary" />
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{submitted.eventDate}</span>
              </div>
            )}
            {submitted.guestCount && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-secondary" />
                <span className="text-muted-foreground">Guests:</span>
                <span className="font-medium">{submitted.guestCount}</span>
              </div>
            )}
            {submitted.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-secondary" />
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">{submitted.location}</span>
              </div>
            )}
          </div>

          {/* Next steps */}
          <div className="mx-auto max-w-md rounded-xl border-2 border-primary/30 bg-primary/5 p-4 mt-5 text-left">
            <p className="font-semibold mb-2">What happens next</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="font-bold text-primary">1.</span> Our catering team reviews your event details.</li>
              <li className="flex gap-2"><span className="font-bold text-primary">2.</span> We'll contact you within <span className="font-semibold text-foreground">24 hours</span> with a custom quote.</li>
              <li className="flex gap-2"><span className="font-bold text-primary">3.</span> We finalize the menu and lock in your date.</li>
            </ul>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" /> Need it sooner? Call us at (860) 555-JERK.
            </p>
          </div>

          <Button
            variant="outline"
            className="mt-6"
            onClick={() => setSubmitted(null)}
          >
            Submit another request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-lg">
      <CardHeader className="bg-secondary text-secondary-foreground rounded-t-lg">
        <CardTitle className="text-xl flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Request a Catering Quote
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type *</Label>
              <Select
                value={formData.eventType}
                onValueChange={handleSelectChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="eventDate"
                  name="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestCount">Estimated Guests *</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="guestCount"
                  name="guestCount"
                  type="number"
                  min="10"
                  value={formData.guestCount}
                  onChange={handleChange}
                  placeholder="Number of guests"
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service">Pickup or Delivery *</Label>
              <Select value={service} onValueChange={(v) => setService(v as "pickup" | "delivery")}>
                <SelectTrigger id="service">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="delivery">Delivery to my event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{service === "delivery" ? "Delivery Address *" : "Event Location"}</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder={service === "delivery" ? "Street, city, ZIP" : "Event address or venue name"}
                  className="pl-10"
                  required={service === "delivery"}
                />
              </div>
            </div>
          </div>

          {selectedItems.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-sm font-semibold mb-2">Your catering selection ({selectedItems.reduce((n, i) => n + i.quantity, 0)} items)</p>
              <div className="space-y-1">
                {selectedItems.map((i) => (
                  <div key={i.id} className="flex justify-between text-sm">
                    <span>{i.quantity} × {i.name}</span>
                    <span className="text-muted-foreground">${(i.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-border mt-2 pt-2">
                <span>Estimated total</span>
                <span className="text-secondary">${selectionTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">We'll confirm final pricing in your quote.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Additional Details</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us about your event, menu preferences, dietary restrictions, etc."
              rows={4}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Catering Request
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            We'll respond within 24 hours to discuss your event details and
            provide a custom quote.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
