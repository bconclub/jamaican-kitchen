import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { submitContactMessage } from "@/lib/api";

const Contact = () => {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      toast.error("Please enter your name and a message.");
      return;
    }
    setSubmitting(true);
    try {
      await submitContactMessage(form);
      toast.success("Thanks! We'll get back to you shortly.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      console.error(err);
      toast.error("Couldn't send your message. Please call us instead.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout title="Contact Us" subtitle="Questions, feedback, or a big order? We'd love to hear from you.">
      <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <div className="font-semibold">Call us</div>
                <div className="text-sm text-muted-foreground">(860) 555-1001</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <div className="font-semibold">Email</div>
                <div className="text-sm text-muted-foreground">hello@jamaicankitchenct.com</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <div className="font-semibold">Locations</div>
                <div className="text-sm text-muted-foreground">6 across Connecticut — see the Locations page.</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="c-name">Name *</Label>
                  <Input id="c-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-email">Email</Label>
                  <Input id="c-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="c-phone">Phone</Label>
                  <Input id="c-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(860) 555-0123" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-subject">Subject</Label>
                  <Input id="c-subject" value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="How can we help?" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-message">Message *</Label>
                <Textarea id="c-message" rows={5} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Tell us more…" />
              </div>
              <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
                {submitting ? "Sending…" : <><Send className="mr-2 h-4 w-4" /> Send Message</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Contact;
