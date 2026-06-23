import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  useLiveCateringRequests,
  useLiveContactMessages,
  updateContactStatus,
} from "@/lib/live-data";
import { CalendarDays, Users, Phone, Mail, CheckCheck, PartyPopper, Inbox } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/messages")({ component: MessagesPage });

function MessagesPage() {
  const { orders: catering } = useLiveCateringRequests();
  const { messages, tableMissing, reload } = useLiveContactMessages();

  const markRead = async (id: string) => {
    await updateContactStatus(id, "read");
    toast.success("Marked as read");
    reload();
  };

  return (
    <div>
      <PageHeader title="Messages" description="Catering requests and contact form submissions from the website." />
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Catering requests" value={catering.length.toString()} icon={PartyPopper} />
        <Stat label="Contact messages" value={tableMissing ? "-" : messages.length.toString()} icon={Inbox} />
        <Stat label="New contact" value={tableMissing ? "-" : messages.filter((m) => m.status === "new").length.toString()} icon={Mail} />
      </div>

      <Tabs defaultValue="catering">
        <TabsList className="mb-4">
          <TabsTrigger value="catering">Catering ({catering.length})</TabsTrigger>
          <TabsTrigger value="contact">Contact{tableMissing ? "" : ` (${messages.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="catering" className="mt-0 space-y-3">
          {catering.length === 0 && (
            <EmptyState text="No catering requests yet. Submissions from the website Catering page appear here." />
          )}
          {catering.map((o) => (
            <Card key={o.id}>
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{o.customerName}</span>
                    <Badge variant="secondary" className="text-[10px]">{o.status}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {format(new Date(o.catering!.eventDate), "MMM d, yyyy")}</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {o.catering!.guests} guests</span>
                    <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {o.catering!.contactPhone}</span>
                  </div>
                  {o.notes && <div className="mt-1 text-sm text-muted-foreground line-clamp-2">{o.notes}</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="contact" className="mt-0 space-y-3">
          {tableMissing ? (
            <EmptyState text="The contact_messages table isn't set up yet, apply it in Supabase and messages will appear here." />
          ) : messages.length === 0 ? (
            <EmptyState text="No contact messages yet. Submissions from the website Contact page appear here." />
          ) : (
            messages.map((m) => (
              <Card key={m.id}>
                <CardContent className="p-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.name}</span>
                      {m.subject && <span className="text-sm text-muted-foreground">· {m.subject}</span>}
                      <Badge variant="secondary" className="text-[10px]">{m.status}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {m.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {m.email}</span>}
                      {m.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {m.phone}</span>}
                      <span>{format(new Date(m.created_at), "MMM d, p")}</span>
                    </div>
                    <div className="mt-2 text-sm">{m.message}</div>
                  </div>
                  {m.status === "new" && (
                    <Button size="sm" variant="outline" onClick={() => markRead(m.id)}>
                      <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark read
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">{text}</div>
  );
}
