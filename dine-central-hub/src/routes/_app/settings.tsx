import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

const STORAGE_KEY = "dine-central-settings";

type Settings = {
  brandName: string;
  supportEmail: string;
  supportPhone: string;
  salesTax: string;
  defaultTip: string;
  serviceFee: string;
  newOrderSound: boolean;
  emailSummary: boolean;
  lowStockSms: boolean;
  uberEatsId: string;
  doorDashId: string;
  grubhubKey: string;
};

const DEFAULTS: Settings = {
  brandName: "Jamaican Kitchen",
  supportEmail: "hello@jamaicankitchenct.com",
  supportPhone: "+1 860 555 0100",
  salesTax: "6.35",
  defaultTip: "15",
  serviceFee: "0",
  newOrderSound: true,
  emailSummary: true,
  lowStockSms: false,
  uberEatsId: "",
  doorDashId: "",
  grubhubKey: "",
};

function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  // Load saved settings on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) });
    } catch {
      /* ignore */
    }
  }, []);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast.success("Settings saved");
    } catch {
      toast.error("Could not save settings");
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Brand, taxes, and notification preferences." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Brand</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Restaurant name" value={settings.brandName} onChange={(e) => set("brandName", e.target.value)} />
            <Field label="Support email" value={settings.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} />
            <Field label="Support phone" value={settings.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Taxes & fees</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Sales tax %" value={settings.salesTax} onChange={(e) => set("salesTax", e.target.value)} />
            <Field label="Default tip %" value={settings.defaultTip} onChange={(e) => set("defaultTip", e.target.value)} />
            <Field label="Service fee %" value={settings.serviceFee} onChange={(e) => set("serviceFee", e.target.value)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Toggle label="New order sound" checked={settings.newOrderSound} onChange={(v) => set("newOrderSound", v)} />
            <Toggle label="Email daily summary" checked={settings.emailSummary} onChange={(v) => set("emailSummary", v)} />
            <Toggle label="Low-stock SMS to managers" checked={settings.lowStockSms} onChange={(v) => set("lowStockSms", v)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>API Keys</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Uber Eats client ID" placeholder="Not configured" value={settings.uberEatsId} onChange={(e) => set("uberEatsId", e.target.value)} />
            <Field label="DoorDash developer ID" placeholder="Not configured" value={settings.doorDashId} onChange={(e) => set("doorDashId", e.target.value)} />
            <Field label="Grubhub partner key" placeholder="Not configured" value={settings.grubhubKey} onChange={(e) => set("grubhubKey", e.target.value)} />
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={save}>Save changes</Button>
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
