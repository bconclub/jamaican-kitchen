import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Brand, taxes, and notification preferences." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Brand</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Restaurant name" defaultValue="Jamaican Kitchen" />
            <Field label="Support email" defaultValue="hello@jamaicankitchenct.com" />
            <Field label="Support phone" defaultValue="+1 860 555 0100" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Taxes & fees</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Sales tax %" defaultValue="6.35" />
            <Field label="Default tip %" defaultValue="15" />
            <Field label="Service fee %" defaultValue="0" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Toggle label="New order sound" defaultChecked />
            <Toggle label="Email daily summary" defaultChecked />
            <Toggle label="Low-stock SMS to managers" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>API Keys</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Uber Eats client ID" placeholder="Not configured" />
            <Field label="DoorDash developer ID" placeholder="Not configured" />
            <Field label="Grubhub partner key" placeholder="Not configured" />
            <Button onClick={() => toast.success("Saved")}>Save changes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input {...rest} />
    </div>
  );
}

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm">{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}