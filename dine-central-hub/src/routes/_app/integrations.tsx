import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { INTEGRATIONS, CHANNEL_META } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Copy, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/integrations")({
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connect your sales channels. Mock adapters can be flipped to live once API credentials are added."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {integrations.map((i, idx) => {
          const meta = CHANNEL_META[i.channel];
          const isLive = i.status === "live";
          const isMock = i.status === "mock";
          return (
            <Card key={i.channel}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-white text-xs font-bold"
                      style={{ backgroundColor: meta.colorVar }}
                    >
                      {meta.short}
                    </div>
                    <div>
                      <div className="font-semibold">{i.name}</div>
                      <div className="text-xs text-muted-foreground">{i.description}</div>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      isLive
                        ? "bg-success/15 text-success"
                        : isMock
                          ? "bg-warning/15 text-warning"
                          : "bg-muted text-muted-foreground"
                    }
                  >
                    {isLive ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Live</> : isMock ? <><AlertCircle className="h-3 w-3 mr-1" /> Mock</> : "Off"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={i.webhookUrl} className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(i.webhookUrl);
                        toast.success("Copied");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm">Auto-accept</span>
                    <Switch
                      checked={i.autoAccept}
                      onCheckedChange={(v) =>
                        setIntegrations((p) => p.map((x, k) => (k === idx ? { ...x, autoAccept: v } : x)))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm text-muted-foreground">Markup</span>
                    <span className="text-sm font-medium tabular-nums">{i.priceMarkupPct}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last sync: {i.lastSync}</span>
                  <Button variant="ghost" size="sm" onClick={() => toast.success(`Synced ${i.name}`)}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Sync now
                  </Button>
                </div>

                {isMock && (
                  <Button variant="outline" className="w-full" onClick={() => toast.info("Add API credentials in Settings to go live")}>
                    Connect {meta.label}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}