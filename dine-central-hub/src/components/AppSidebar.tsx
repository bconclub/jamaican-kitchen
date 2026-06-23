import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingBag,
  Truck,
  UtensilsCrossed,
  Package,
  BarChart3,
  MapPin,
  Users,
  UserCog,
  Plug,
  Settings,
  PartyPopper,
  ShieldCheck,
  CreditCard,
  FileText,
  Workflow,
  Inbox,
} from "lucide-react";
import iconMark from "@/assets/jamaican-kitchen-icon.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const operate = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Live Orders", url: "/orders", icon: ShoppingBag },
  { title: "Catering", url: "/catering", icon: PartyPopper },
  { title: "Messages", url: "/messages", icon: Inbox },
  { title: "Delivery", url: "/delivery", icon: Truck },
];
const manage = [
  { title: "Menu", url: "/menu", icon: UtensilsCrossed },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Payments", url: "/payments", icon: CreditCard },
];
const chain = [
  { title: "Locations", url: "/locations", icon: MapPin },
  { title: "Staff", url: "/staff", icon: UserCog },
  { title: "Access Control", url: "/access", icon: ShieldCheck },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Reports", url: "/reports", icon: FileText },
];
const setup = [
  { title: "System Flow", url: "/system", icon: Workflow },
  { title: "Integrations", url: "/integrations", icon: Plug },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (u: string) => path === u || path.startsWith(u + "/");

  const renderGroup = (label: string, items: typeof operate) => (
    <SidebarGroup key={label}>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <Link to={item.url} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <img
            src={iconMark}
            alt="Jamaican Kitchen"
            className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-sidebar-border"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Jamaican Kitchen</span>
            <span className="text-xs text-muted-foreground">Connecticut · Chain Ops</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Operate", operate)}
        {renderGroup("Manage", manage)}
        {renderGroup("Chain", chain)}
        {renderGroup("Setup", setup)}
      </SidebarContent>
    </Sidebar>
  );
}