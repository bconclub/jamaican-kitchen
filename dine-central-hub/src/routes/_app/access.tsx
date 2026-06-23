import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { STAFF, LOCATIONS, PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } from "@/lib/mock-data";
import type { PermissionKey, StaffMember } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Crown, ShieldCheck, UserCog, Code2, Search, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/access")({
  component: AccessPage,
});

type Role = StaffMember["role"];

const ROLE_META: Record<Role, { label: string; icon: typeof Crown; tone: string }> = {
  owner: { label: "Owner", icon: Crown, tone: "bg-amber-100 text-amber-900 border-amber-200" },
  manager: { label: "Manager", icon: ShieldCheck, tone: "bg-emerald-100 text-emerald-900 border-emerald-200" },
  staff: { label: "Staff", icon: UserCog, tone: "bg-slate-100 text-slate-900 border-slate-200" },
  developer: { label: "Developer", icon: Code2, tone: "bg-sky-100 text-sky-900 border-sky-200" },
};

function withPerms(s: StaffMember): StaffMember {
  if (s.permissions) return s;
  const defaults = ROLE_DEFAULT_PERMISSIONS[s.role];
  return { ...s, permissions: Object.fromEntries(defaults.map((k) => [k, true])) };
}

function AccessPage() {
  const owner = STAFF.find((s) => s.role === "owner")!;
  const [staff, setStaff] = useState<StaffMember[]>(STAFF.map(withPerms));
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [editing, setEditing] = useState<StaffMember | null>(null);

  const locName = (id: string) =>
    LOCATIONS.find((l) => l.id === id)?.name.replace("Jamaican Kitchen, ", "") ?? id;

  const filtered = useMemo(
    () =>
      staff.filter(
        (s) =>
          (roleFilter === "all" || s.role === roleFilter) &&
          (s.name.toLowerCase().includes(query.toLowerCase()) ||
            s.email.toLowerCase().includes(query.toLowerCase())),
      ),
    [staff, query, roleFilter],
  );

  const counts = useMemo(() => {
    const c = { total: staff.length, owner: 0, manager: 0, staff: 0, developer: 0 };
    staff.forEach((s) => c[s.role]++);
    return c;
  }, [staff]);

  const updateMember = (id: string, patch: Partial<StaffMember>) =>
    setStaff((p) => p.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const togglePerm = (id: string, key: PermissionKey) =>
    setStaff((p) =>
      p.map((m) =>
        m.id === id
          ? { ...m, permissions: { ...m.permissions, [key]: !m.permissions?.[key] } }
          : m,
      ),
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Access Control"
        description="Owner-managed roles and granular permissions for every user."
      />

      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <Avatar className="h-12 w-12 ring-2 ring-primary">
            <AvatarFallback style={{ backgroundColor: owner.avatarColor, color: "white" }}>
              {owner.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{owner.name}</span>
              <Badge className="gap-1 bg-amber-500 text-white"><Crown className="h-3 w-3" /> Owner</Badge>
            </div>
            <div className="text-sm text-muted-foreground">{owner.email} · Full control over all locations & users</div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Stat label="Seats" value={`${counts.total}/10`} />
            <Stat label="Managers" value={counts.manager} />
            <Stat label="Staff" value={counts.staff} />
            <Stat label="Developers" value={counts.developer} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or email" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as never)}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="owner">Owners</SelectItem>
            <SelectItem value="manager">Managers</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="developer">Developers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((s) => {
          const meta = ROLE_META[s.role];
          const Icon = meta.icon;
          const grantedCount = Object.values(s.permissions ?? {}).filter(Boolean).length;
          const isOwner = s.role === "owner";
          return (
            <Card key={s.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback style={{ backgroundColor: s.avatarColor, color: "white" }}>
                      {s.name.split(" ").map((p) => p[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{s.name}</span>
                      <Badge variant="outline" className={`gap-1 ${meta.tone}`}>
                        <Icon className="h-3 w-3" /> {meta.label}
                      </Badge>
                      {!s.active && <Badge variant="secondary">Suspended</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{s.email}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {s.locationIds === "all" ? "All locations" : (s.locationIds as string[]).map(locName).join(", ")}
                    </div>
                  </div>
                  <Switch checked={s.active} disabled={isOwner} onCheckedChange={(v) => updateMember(s.id, { active: v })} />
                </div>
                <Separator className="my-3" />
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{grantedCount}</span> of {PERMISSIONS.length} permissions granted
                  </div>
                  <Button size="sm" variant={isOwner ? "ghost" : "outline"} disabled={isOwner} onClick={() => setEditing(s)}>
                    <Lock className="h-3.5 w-3.5 mr-1" />
                    {isOwner ? "Owner, full access" : "Edit access"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>Manage access, {editing.name}</DialogTitle>
                <DialogDescription>Configure role, locations, and granular permissions.</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="permissions">
                <TabsList>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                  <TabsTrigger value="role">Role & locations</TabsTrigger>
                </TabsList>
                <TabsContent value="permissions" className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                  {(["Operations", "Management", "Administration", "Developer"] as const).map((group) => (
                    <div key={group}>
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{group}</div>
                      <div className="space-y-1">
                        {PERMISSIONS.filter((p) => p.group === group).map((p) => {
                          const current = staff.find((m) => m.id === editing.id)!;
                          const checked = !!current.permissions?.[p.key];
                          return (
                            <label key={p.key} className="flex items-start gap-3 rounded-md p-2 hover:bg-muted cursor-pointer">
                              <Checkbox checked={checked} onCheckedChange={() => togglePerm(editing.id, p.key)} className="mt-0.5" />
                              <div className="flex-1">
                                <div className="text-sm font-medium">{p.label}</div>
                                <div className="text-xs text-muted-foreground">{p.description}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="role" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={editing.role}
                      onValueChange={(v) => {
                        const role = v as Role;
                        const perms = Object.fromEntries(ROLE_DEFAULT_PERMISSIONS[role].map((k) => [k, true]));
                        updateMember(editing.id, { role, permissions: perms });
                        setEditing({ ...editing, role, permissions: perms });
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="developer">Developer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Location access</Label>
                    <label className="flex items-center gap-2 rounded-md p-2 hover:bg-muted cursor-pointer">
                      <Checkbox
                        checked={editing.locationIds === "all"}
                        onCheckedChange={(v) => {
                          const next = v ? "all" : [];
                          updateMember(editing.id, { locationIds: next as never });
                          setEditing({ ...editing, locationIds: next as never });
                        }}
                      />
                      <span className="text-sm font-medium">All locations</span>
                    </label>
                    {editing.locationIds !== "all" &&
                      LOCATIONS.map((loc) => {
                        const ids = editing.locationIds as string[];
                        const checked = ids.includes(loc.id);
                        return (
                          <label key={loc.id} className="flex items-center gap-2 rounded-md p-2 hover:bg-muted cursor-pointer">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => {
                                const next = checked ? ids.filter((i) => i !== loc.id) : [...ids, loc.id];
                                updateMember(editing.id, { locationIds: next });
                                setEditing({ ...editing, locationIds: next });
                              }}
                            />
                            <span className="text-sm">{loc.name.replace("Jamaican Kitchen, ", "")}</span>
                          </label>
                        );
                      })}
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>Close</Button>
                <Button onClick={() => { toast.success("Access updated"); setEditing(null); }}>Save changes</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
