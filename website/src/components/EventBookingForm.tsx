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
import { Calendar, Users, MapPin, Phone, Mail, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitCateringRequest } from "@/lib/api";

export const EventBookingForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      await submitCateringRequest({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        event_type: formData.eventType,
        event_date: formData.eventDate || undefined,
        guest_count: formData.guestCount ? Number(formData.guestCount) : undefined,
        location: formData.location,
        message: formData.message,
      });

      toast({
        title: "Request Submitted!",
        description:
          "We'll contact you within 24 hours to discuss your catering needs.",
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

          <div className="space-y-2">
            <Label htmlFor="location">Event Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Event address or venue name"
                className="pl-10"
              />
            </div>
          </div>

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
