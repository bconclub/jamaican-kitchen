import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, formatMoney } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Download,
  FileSpreadsheet,
  FileText,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Truck,
  CreditCard,
  Calendar,
  TrendingUp,
  Receipt,
  UtensilsCrossed,
  ClipboardList,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ORDERS, LOCATIONS, CHANNEL_META, revenueByDay } from "@/lib/mock-data";
import { useCurrentLocation } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

type ReportFormat = "csv" | "xlsx" | "pdf";

type ReportDef = {
  id: string;
  category: "sales" | "operations" | "finance" | "menu" | "people" | "compliance";
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  formats: ReportFormat[];
  badge?: string;
};

const REPORTS: ReportDef[] = [
  // Sales
  { id: "sales_summary", category: "sales", name: "Sales Summary", description: "Gross sales, net sales, refunds, discounts, taxes & tips by day.", icon: DollarSign, formats: ["csv", "xlsx", "pdf"], badge: "Daily" },
  { id: "channel_breakdown", category: "sales", name: "Channel Breakdown", description: "Revenue & orders split by Web, App, POS, Uber Eats, DoorDash, Grubhub.", icon: TrendingUp, formats: ["csv", "xlsx", "pdf"] },
  { id: "location_performance", category: "sales", name: "Location Performance", description: "Per-location revenue, orders, AOV, and YoY comparison.", icon: ShoppingBag, formats: ["csv", "xlsx", "pdf"] },
  { id: "hourly_heatmap", category: "sales", name: "Hourly Sales Heatmap", description: "Order volume & revenue by hour and day of week.", icon: Calendar, formats: ["csv", "xlsx"] },

  // Operations
  { id: "order_log", category: "operations", name: "Order Log", description: "Every order with status, prep time, items, and customer details.", icon: ClipboardList, formats: ["csv", "xlsx", "pdf"] },
  { id: "delivery_performance", category: "operations", name: "Delivery Performance", description: "Avg delivery time, on-time rate, courier ratings by platform.", icon: Truck, formats: ["csv", "xlsx", "pdf"] },
  { id: "refunds_voids", category: "operations", name: "Refunds & Voids", description: "Refunded, voided, and cancelled orders with reason codes.", icon: Receipt, formats: ["csv", "xlsx", "pdf"] },

  // Finance
  { id: "payouts_recon", category: "finance", name: "Payouts & Reconciliation", description: "Marketplace payouts, commissions, and bank deposits.", icon: CreditCard, formats: ["csv", "xlsx", "pdf"], badge: "Required" },
  { id: "tax_report", category: "finance", name: "Sales Tax Report", description: "Taxable sales, tax collected by jurisdiction & period.", icon: FileText, formats: ["csv", "xlsx", "pdf"], badge: "Required" },
  { id: "tips_report", category: "finance", name: "Tips Report", description: "Tips collected by channel, server, and pay period.", icon: DollarSign, formats: ["csv", "xlsx"] },
  { id: "cash_drawer", category: "finance", name: "Cash Drawer", description: "Cash in/out, drops, over/short by shift and location.", icon: Receipt, formats: ["csv", "xlsx", "pdf"] },
  { id: "pnl", category: "finance", name: "P&L Statement", description: "Revenue, COGS, labor, fees and net margin by location.", icon: FileSpreadsheet, formats: ["xlsx", "pdf"] },

  // Menu & Inventory
  { id: "item_sales", category: "menu", name: "Item Sales Mix", description: "Top items, revenue, qty sold, attach rate, and margin.", icon: UtensilsCrossed, formats: ["csv", "xlsx", "pdf"] },
  { id: "modifier_sales", category: "menu", name: "Modifier Sales", description: "Modifier attach rates and revenue contribution.", icon: UtensilsCrossed, formats: ["csv", "xlsx"] },
  { id: "inventory_levels", category: "menu", name: "Inventory Levels", description: "Current stock, low-stock items, and 86'd items.", icon: Package, formats: ["csv", "xlsx", "pdf"] },
  { id: "waste_report", category: "menu", name: "Waste & Spoilage", description: "Inventory waste with reason codes and cost impact.", icon: Package, formats: ["csv", "xlsx"] },

  // People
  { id: "labor_report", category: "people", name: "Labor Report", description: "Hours worked, labor cost, and labor % of sales.", icon: Users, formats: ["csv", "xlsx", "pdf"] },
  { id: "customer_ltv", category: "people", name: "Customer LTV", description: "Customer lifetime value, frequency, and last order date.", icon: Users, formats: ["csv", "xlsx"] },

  // Compliance
  { id: "audit_log", category: "compliance", name: "Audit Log", description: "Staff actions: 86'ing, refunds, comps, and price overrides.", icon: ClipboardList, formats: ["csv", "pdf"] },
  { id: "1099k", category: "compliance", name: "1099-K Summary", description: "Annual marketplace gross volume per platform.", icon: FileText, formats: ["pdf"], badge: "Annual" },
];

const CATEGORY_LABELS: Record<string, string> = {
  all: "All reports",
  sales: "Sales",
  operations: "Operations",
  finance: "Finance",
  menu: "Menu & Inventory",
  people: "People",
  compliance: "Compliance",
};

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildCsv(report: ReportDef, ordersScope: typeof ORDERS, range: string): string {
  const days = parseInt(range, 10);
  const rev = revenueByDay(days);
  switch (report.id) {
    case "sales_summary":
      return [
        ["Date", "Gross Sales", "Refunds", "Net Sales", "Tax", "Tips", "Orders"].join(","),
        ...rev.map((d) => [d.day, d.total.toFixed(2), (d.total * 0.02).toFixed(2), (d.total * 0.98).toFixed(2), (d.total * 0.0635).toFixed(2), (d.total * 0.12).toFixed(2), Math.round(d.total / 38)].join(",")),
      ].join("\n");
    case "channel_breakdown":
      return [
        ["Channel", "Orders", "Revenue", "AOV"].join(","),
        ...Object.entries(CHANNEL_META).map(([k, m]) => {
          const o = ordersScope.filter((x) => x.channel === k);
          const rev = o.reduce((s, x) => s + x.total, 0);
          return [m.label, o.length, rev.toFixed(2), o.length ? (rev / o.length).toFixed(2) : "0.00"].join(",");
        }),
      ].join("\n");
    case "location_performance":
      return [
        ["Location", "Orders", "Revenue", "AOV"].join(","),
        ...LOCATIONS.map((l) => {
          const o = ordersScope.filter((x) => x.locationId === l.id);
          const rev = o.reduce((s, x) => s + x.total, 0);
          return [l.name, o.length, rev.toFixed(2), o.length ? (rev / o.length).toFixed(2) : "0.00"].join(",");
        }),
      ].join("\n");
    case "order_log":
      return [
        ["Order #", "Date", "Channel", "Location", "Customer", "Items", "Total", "Status"].join(","),
        ...ordersScope.map((o) => [
          o.id,
          new Date(o.createdAt).toISOString(),
          CHANNEL_META[o.channel].label,
          LOCATIONS.find((l) => l.id === o.locationId)?.name ?? "",
          `"${o.customerName ?? ""}"`,
          o.items.reduce((s, i) => s + i.qty, 0),
          o.total.toFixed(2),
          o.status,
        ].join(",")),
      ].join("\n");
    case "tax_report":
      return [
        ["Period", "Taxable Sales", "Tax Rate", "Tax Collected"].join(","),
        ...rev.map((d) => [d.day, d.total.toFixed(2), "6.35%", (d.total * 0.0635).toFixed(2)].join(",")),
      ].join("\n");
    default: {
      const total = ordersScope.reduce((s, o) => s + o.total, 0);
      return [
        ["Report", "Generated", "Period (days)", "Orders", "Revenue"].join(","),
        [report.name, new Date().toISOString(), days, ordersScope.length, total.toFixed(2)].join(","),
      ].join("\n");
    }
  }
}

function ReportsPage() {
  const loc = useCurrentLocation();
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  const [category, setCategory] = useState<string>("all");

  const ordersScope = useMemo(
    () => ORDERS.filter((o) => loc === "all" || o.locationId === loc),
    [loc],
  );

  const filtered = REPORTS.filter((r) => category === "all" || r.category === category);

  const handleDownload = (report: ReportDef, format: ReportFormat) => {
    const stamp = new Date().toISOString().slice(0, 10);
    const base = `${report.id}_${stamp}_${range}d`;
    if (format === "csv") {
      downloadFile(`${base}.csv`, buildCsv(report, ordersScope, range), "text/csv");
    } else if (format === "xlsx") {
      // Tab-separated as a stand-in for spreadsheet export
      const csv = buildCsv(report, ordersScope, range).replace(/,/g, "\t");
      downloadFile(`${base}.xls`, csv, "application/vnd.ms-excel");
    } else {
      const text = `${report.name}\nGenerated: ${new Date().toLocaleString()}\nRange: last ${range} days\n\n${buildCsv(report, ordersScope, range)}`;
      downloadFile(`${base}.txt`, text, "text/plain");
    }
    toast.success(`${report.name} exported`, { description: `${format.toUpperCase()} · last ${range} days` });
  };

  const totalRevenue = ordersScope.reduce((s, o) => s + o.total, 0);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Download every report you need, sales, finance, operations, compliance."
        actions={
          <div className="flex items-center gap-2">
            <Select value={range} onValueChange={(v) => setRange(v as "7" | "30" | "90")}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Kpi label="Reports available" value={REPORTS.length.toString()} />
        <Kpi label="Period revenue" value={formatMoney(totalRevenue)} />
        <Kpi label="Orders in scope" value={ordersScope.length.toString()} />
      </div>

      <Tabs value={category} onValueChange={setCategory} className="mb-4">
        <TabsList>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <TabsTrigger key={k} value={k}>{v}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mb-6">
        {filtered.map((r) => {
          const Icon = r.icon;
          return (
            <Card key={r.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{r.name}</CardTitle>
                      <CardDescription className="mt-0.5 text-xs uppercase tracking-wide">
                        {CATEGORY_LABELS[r.category]}
                      </CardDescription>
                    </div>
                  </div>
                  {r.badge && <Badge variant="secondary" className="shrink-0">{r.badge}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <p className="text-sm text-muted-foreground">{r.description}</p>
                <div className="flex flex-wrap gap-2">
                  {r.formats.map((f) => (
                    <Button key={f} size="sm" variant="outline" onClick={() => handleDownload(r, f)}>
                      <Download className="h-3.5 w-3.5" />
                      {f.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recently generated</CardTitle>
          <CardDescription>Your last report exports.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead className="text-right">Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { name: "Sales Summary", period: "Last 30 days", fmt: "PDF", when: "Today, 09:14", size: "284 KB" },
                { name: "Payouts & Reconciliation", period: "April 2026", fmt: "XLSX", when: "Yesterday, 17:02", size: "112 KB" },
                { name: "Sales Tax Report", period: "Q1 2026", fmt: "PDF", when: "May 1, 11:30", size: "98 KB" },
                { name: "Item Sales Mix", period: "Last 90 days", fmt: "CSV", when: "Apr 28, 14:20", size: "56 KB" },
              ].map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.period}</TableCell>
                  <TableCell><Badge variant="outline">{r.fmt}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{r.when}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.size}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}