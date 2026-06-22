import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { STAFF, LOCATIONS } from "@/lib/mock-data";
import type { StaffMember, TimePunch } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Search, Plus, Phone, MapPin, CalendarDays, DollarSign,
  Clock, LogIn, LogOut, ShieldCheck, Mail, Briefcase, AlertCircle, Pencil,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/staff")({
  component: StaffPage,
});

const ROLE_TONE: Record<StaffMember["role"], string> = {
  owner: "bg-amber-100 text-amber-900 border-amber-200",
  manager: "bg-emerald-100 text-emerald-900 border-emerald-200",
  staff: "bg-slate-100 text-slate-900 border-slate-200",
  developer: "bg-sky-100 text-sky-900 border-sky-200",
};

function fmtTime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}
function durationHours(inIso: string, outIso?: string, breakMin = 0) {
  const end = outIso ? new Date(outIso).getTime() : Date.now();
  const start = new Date(inIso).getTime();
  const ms = end - start - breakMin * 60_000;
  return Math.max(0, ms / 3_600_000);
}
function totalWeekHours(s: StaffMember) {
  const live = s.clockedInAt ? durationHours(s.clockedInAt) : 0;
  const past = (s.shifts ?? []).reduce(
    (acc, sh) => acc + durationHours(sh.clockIn, sh.clockOut, sh.breakMinutes ?? 0),
    0,
  );
  return live + past;
}

function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>(STAFF);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | StaffMember["role"]>("all");
  const [locFilter, setLocFilter] = useState<string>("all");
  const [profile, setProfile] = useState<StaffMember | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  // TODO: replace with real auth — owner identity drives edit permissions.
  const currentUserIsOwner = true;

  const locName = (id: string) =>
    LOCATIONS.find((l) => l.id === id)?.name.replace("Jamaican Kitchen — ", "") ?? id;

  const filtered = useMemo(() => {
    return staff.filter((s) => {
      if (roleFilter !== "all" && s.role !== roleFilter) return false;
      if (locFilter !== "all") {
        if (s.locationIds === "all") return true;
        if (!(s.locationIds as string[]).includes(locFilter)) return false;
      }
      const q = query.toLowerCase();
      return !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.position ?? "").toLowerCase().includes(q);
    });
  }, [staff, query, roleFilter, locFilter]);

  const counts = useMemo(() => {
    const onClock = staff.filter((s) => s.clockedInAt).length;
    const totalHours = staff.reduce((a, s) => a + totalWeekHours(s), 0);
    const payrollWeek = staff.reduce((a, s) => a + totalWeekHours(s) * (s.hourlyWage ?? 0), 0);
    return { total: staff.length, onClock, hours: totalHours, payroll: payrollWeek };
  }, [staff]);

  const togglePunch = (id: string) =>
    setStaff((p) =>
      p.map((m) => {
        if (m.id !== id) return m;
        if (m.clockedInAt) {
          const newShift: TimePunch = {
            id: `sh_${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            clockIn: m.clockedInAt,
            clockOut: new Date().toISOString(),
            locationId: m.locationIds === "all" ? "loc_1" : (m.locationIds as string[])[0],
            breakMinutes: 0,
          };
          toast.success(`${m.name} punched out`);
          return { ...m, clockedInAt: null, shifts: [newShift, ...(m.shifts ?? [])] };
        }
        toast.success(`${m.name} punched in`);
        return { ...m, clockedInAt: new Date().toISOString() };
      }),
    );

  const saveEdits = (id: string, patch: Partial<StaffMember>) => {
    setStaff((p) => p.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    if (profile?.id === id) setProfile((cur) => (cur ? { ...cur, ...patch } : cur));
    toast.success("Profile updated");
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Management"
        description="Team directory, shifts, time clock, payroll & contact details."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/access"><ShieldCheck className="h-4 w-4 mr-1" /> Access Control</Link>
            </Button>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> Add team member</Button>
              </DialogTrigger>
              <AddStaffDialog
                onClose={() => setAddOpen(false)}
                onAdd={(m) => {
                  if (staff.length >= 10) {
                    toast.error("Plan limit reached (10 users).");
                    return;
                  }
                  setStaff((p) => [...p, m]);
                  toast.success(`${m.name} added`);
                  setAddOpen(false);
                }}
              />
            </Dialog>
          </div>
        }
      />

      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Briefcase} label="Team size" value={`${counts.total} / 10`} hint="Plan seats" />
        <Kpi icon={Clock} label="On the clock" value={counts.onClock} hint="Right now" tone="success" />
        <Kpi icon={CalendarDays} label="Hours this week" value={counts.hours.toFixed(1)} hint="All locations" />
        <Kpi icon={DollarSign} label="Payroll this week" value={`$${counts.payroll.toFixed(0)}`} hint="Estimated" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, email, or position" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as never)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="developer">Developer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={locFilter} onValueChange={setLocFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {LOCATIONS.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name.replace("Jamaican Kitchen — ", "")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="timeclock">Time Clock</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* DIRECTORY */}
        <TabsContent value="directory">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role / Position</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Hire date</TableHead>
                    <TableHead className="text-right">Wage</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => setProfile(s)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback style={{ backgroundColor: s.avatarColor, color: "white" }}>
                              {s.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{s.name}</div>
                            <div className="text-xs text-muted-foreground">{s.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${ROLE_TONE[s.role]} capitalize mr-2`}>{s.role}</Badge>
                        <span className="text-sm">{s.position ?? "—"}</span>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">{s.phone ?? "—"}</TableCell>
                      <TableCell className="text-sm">
                        {s.locationIds === "all" ? "All locations" : (s.locationIds as string[]).map(locName).join(", ")}
                      </TableCell>
                      <TableCell className="text-sm">{fmtDate(s.hireDate)}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.hourlyWage ? `$${s.hourlyWage}/hr` : "—"}</TableCell>
                      <TableCell className="text-right">
                        {!s.active ? (
                          <Badge variant="secondary">Inactive</Badge>
                        ) : s.clockedInAt ? (
                          <Badge className="bg-success text-success-foreground">On clock</Badge>
                        ) : (
                          <Badge variant="outline">Off</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {currentUserIsOwner && s.role !== "owner" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); setEditing(s); }}
                            className="gap-1"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TIME CLOCK */}
        <TabsContent value="timeclock" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Currently on the clock</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Punched in</TableHead>
                    <TableHead className="text-right">Elapsed</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7"><AvatarFallback style={{ backgroundColor: s.avatarColor, color: "white", fontSize: 11 }}>{s.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                          <span className="text-sm font-medium">{s.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {s.locationIds === "all" ? "—" : locName((s.locationIds as string[])[0])}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">{fmtTime(s.clockedInAt)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {s.clockedInAt ? `${durationHours(s.clockedInAt).toFixed(2)} h` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={s.clockedInAt ? "destructive" : "default"}
                          onClick={() => togglePunch(s.id)}
                          disabled={!s.active}
                          className="gap-1"
                        >
                          {s.clockedInAt ? <><LogOut className="h-3.5 w-3.5" /> Punch out</> : <><LogIn className="h-3.5 w-3.5" /> Punch in</>}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Recent shifts (last 6 days)</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>In</TableHead>
                    <TableHead>Out</TableHead>
                    <TableHead className="text-right">Break</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.flatMap((s) =>
                    (s.shifts ?? []).slice(0, 3).map((sh) => {
                      const h = durationHours(sh.clockIn, sh.clockOut, sh.breakMinutes ?? 0);
                      return (
                        <TableRow key={sh.id}>
                          <TableCell className="text-sm">{s.name}</TableCell>
                          <TableCell className="text-sm">{fmtDate(sh.date)}</TableCell>
                          <TableCell className="text-sm tabular-nums">{fmtTime(sh.clockIn)}</TableCell>
                          <TableCell className="text-sm tabular-nums">{fmtTime(sh.clockOut)}</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">{sh.breakMinutes ?? 0}m</TableCell>
                          <TableCell className="text-right tabular-nums">{h.toFixed(2)}</TableCell>
                          <TableCell className="text-right tabular-nums">${(h * (s.hourlyWage ?? 0)).toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    }),
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SCHEDULE */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader><CardTitle className="text-base">Weekly hours vs. scheduled</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead className="text-right">Scheduled</TableHead>
                    <TableHead className="text-right">Worked</TableHead>
                    <TableHead className="text-right">Δ</TableHead>
                    <TableHead className="text-right">Wage</TableHead>
                    <TableHead className="text-right">Est. pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => {
                    const worked = totalWeekHours(s);
                    const sched = s.weeklyScheduleHours ?? 0;
                    const delta = worked - sched;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm font-medium">{s.name}</TableCell>
                        <TableCell className="text-sm">{s.position ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{sched}h</TableCell>
                        <TableCell className="text-right tabular-nums">{worked.toFixed(1)}h</TableCell>
                        <TableCell className={`text-right tabular-nums ${delta > 2 ? "text-warning" : delta < -4 ? "text-destructive" : "text-muted-foreground"}`}>
                          {delta >= 0 ? "+" : ""}{delta.toFixed(1)}h
                        </TableCell>
                        <TableCell className="text-right tabular-nums">${s.hourlyWage ?? 0}</TableCell>
                        <TableCell className="text-right tabular-nums">${(worked * (s.hourlyWage ?? 0)).toFixed(0)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Profile drawer */}
      <Dialog open={!!profile} onOpenChange={(o) => !o && setProfile(null)}>
        <DialogContent className="max-w-2xl">
          {profile && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback style={{ backgroundColor: profile.avatarColor, color: "white" }}>
                      {profile.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle className="flex items-center gap-2">
                      {profile.name}
                      <Badge variant="outline" className={`${ROLE_TONE[profile.role]} capitalize`}>{profile.role}</Badge>
                    </DialogTitle>
                    <DialogDescription>{profile.position} · Hired {fmtDate(profile.hireDate)}</DialogDescription>
                  </div>
                  <Button
                    size="sm"
                    variant={profile.clockedInAt ? "destructive" : "default"}
                    onClick={() => { togglePunch(profile.id); setProfile({ ...profile, clockedInAt: profile.clockedInAt ? null : new Date().toISOString() }); }}
                    disabled={!profile.active}
                    className="gap-1"
                  >
                    {profile.clockedInAt ? <><LogOut className="h-3.5 w-3.5" /> Punch out</> : <><LogIn className="h-3.5 w-3.5" /> Punch in</>}
                  </Button>
                </div>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <Info icon={Mail} label="Email" value={profile.email} />
                <Info icon={Phone} label="Phone" value={profile.phone} />
                <Info icon={MapPin} label="Address" value={profile.address} />
                <Info icon={DollarSign} label="Wage" value={profile.hourlyWage ? `$${profile.hourlyWage}/hr` : "—"} />
                <Info icon={CalendarDays} label="Scheduled" value={`${profile.weeklyScheduleHours ?? 0}h / wk`} />
                <Info
                  icon={AlertCircle}
                  label="Emergency contact"
                  value={profile.emergencyContact ? `${profile.emergencyContact.name} · ${profile.emergencyContact.phone}` : "—"}
                />
              </div>
              <Separator />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Recent shifts</div>
                <div className="max-h-48 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Date</TableHead><TableHead>In</TableHead><TableHead>Out</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {(profile.shifts ?? []).map((sh) => (
                        <TableRow key={sh.id}>
                          <TableCell className="text-sm">{fmtDate(sh.date)}</TableCell>
                          <TableCell className="text-sm tabular-nums">{fmtTime(sh.clockIn)}</TableCell>
                          <TableCell className="text-sm tabular-nums">{fmtTime(sh.clockOut)}</TableCell>
                          <TableCell className="text-right tabular-nums">{durationHours(sh.clockIn, sh.clockOut, sh.breakMinutes ?? 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      {(profile.shifts ?? []).length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">No shifts recorded</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <DialogFooter>
                {currentUserIsOwner && profile.role !== "owner" && (
                  <Button variant="outline" onClick={() => setEditing(profile)} className="gap-1">
                    <Pencil className="h-3.5 w-3.5" /> Edit role / position
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link to="/access"><ShieldCheck className="h-4 w-4 mr-1" /> Manage access</Link>
                </Button>
                <Button onClick={() => setProfile(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <EditMemberDialog
        member={editing}
        onClose={() => setEditing(null)}
        onSave={saveEdits}
      />
    </div>
  );
}

function Kpi({ icon: Icon, label, value, hint, tone }: {
  icon: typeof Clock; label: string; value: React.ReactNode; hint?: string; tone?: "success";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${tone === "success" ? "text-success" : "text-muted-foreground"}`} />
        </div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md border p-2.5">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate">{value || "—"}</div>
      </div>
    </div>
  );
}

function AddStaffDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (m: StaffMember) => void }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", position: "", role: "staff" as StaffMember["role"],
    locationId: LOCATIONS[0].id, hourlyWage: 17, weeklyScheduleHours: 32, hireDate: new Date().toISOString().slice(0, 10),
  });
  const update = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Add team member</DialogTitle>
        <DialogDescription>Create a staff record. Send an invite email to give app access.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" value={form.name} onChange={(v) => update("name", v)} />
        <Field label="Position" value={form.position} onChange={(v) => update("position", v)} placeholder="Line Cook" />
        <Field label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} />
        <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} placeholder="+1 860 555 0000" />
        <div className="space-y-1.5">
          <Label className="text-xs">Role</Label>
          <Select value={form.role} onValueChange={(v) => update("role", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="developer">Developer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Home location</Label>
          <Select value={form.locationId} onValueChange={(v) => update("locationId", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.name.replace("Jamaican Kitchen — ", "")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Field label="Hourly wage ($)" type="number" value={String(form.hourlyWage)} onChange={(v) => update("hourlyWage", Number(v))} />
        <Field label="Scheduled hours / week" type="number" value={String(form.weeklyScheduleHours)} onChange={(v) => update("weeklyScheduleHours", Number(v))} />
        <Field label="Hire date" type="date" value={form.hireDate} onChange={(v) => update("hireDate", v)} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          disabled={!form.name || !form.email}
          onClick={() =>
            onAdd({
              id: `u_${Date.now()}`,
              name: form.name,
              email: form.email,
              phone: form.phone,
              position: form.position,
              role: form.role,
              locationIds: [form.locationId],
              active: true,
              lastActive: "pending",
              avatarColor: "#1f7a3a",
              hourlyWage: form.hourlyWage,
              weeklyScheduleHours: form.weeklyScheduleHours,
              hireDate: form.hireDate,
              clockedInAt: null,
              shifts: [],
            })
          }
        >
          Add member
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function EditMemberDialog({
  member,
  onClose,
  onSave,
}: {
  member: StaffMember | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<StaffMember>) => void;
}) {
  const [form, setForm] = useState<Partial<StaffMember>>({});
  // Reset when a new member opens
  const memberId = member?.id;
  if (member && form.id !== member.id) {
    setForm({
      id: member.id,
      name: member.name,
      position: member.position ?? "",
      role: member.role,
      phone: member.phone ?? "",
      hourlyWage: member.hourlyWage ?? 0,
      weeklyScheduleHours: member.weeklyScheduleHours ?? 0,
      locationIds: member.locationIds,
      active: member.active,
    } as Partial<StaffMember> & { id: string });
  }
  const update = <K extends keyof StaffMember>(k: K, v: StaffMember[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  if (!member) return null;
  const locs = form.locationIds === "all" ? "all" : (form.locationIds as string[] | undefined) ?? [];

  return (
    <Dialog open={!!member} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {member.name}</DialogTitle>
          <DialogDescription>
            Owner-only. Update role, position, pay, schedule, and locations.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" value={form.name ?? ""} onChange={(v) => update("name", v)} />
          <Field label="Position / title" value={form.position ?? ""} onChange={(v) => update("position", v)} placeholder="Line Cook" />
          <div className="space-y-1.5">
            <Label className="text-xs">Role</Label>
            <Select value={form.role} onValueChange={(v) => update("role", v as StaffMember["role"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="developer">Developer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field label="Phone" value={form.phone ?? ""} onChange={(v) => update("phone", v)} />
          <Field
            label="Hourly wage ($)"
            type="number"
            value={String(form.hourlyWage ?? 0)}
            onChange={(v) => update("hourlyWage", Number(v))}
          />
          <Field
            label="Scheduled hours / week"
            type="number"
            value={String(form.weeklyScheduleHours ?? 0)}
            onChange={(v) => update("weeklyScheduleHours", Number(v))}
          />
        </div>
        <Separator />
        <div className="space-y-2">
          <Label className="text-xs">Location access</Label>
          <label className="flex items-center gap-2 rounded-md p-2 hover:bg-muted cursor-pointer">
            <input
              type="checkbox"
              checked={locs === "all"}
              onChange={(e) => update("locationIds", (e.target.checked ? "all" : []) as never)}
            />
            <span className="text-sm font-medium">All locations</span>
          </label>
          {locs !== "all" &&
            LOCATIONS.map((l) => {
              const ids = locs as string[];
              const checked = ids.includes(l.id);
              return (
                <label key={l.id} className="flex items-center gap-2 rounded-md p-2 hover:bg-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      update(
                        "locationIds",
                        (checked ? ids.filter((i) => i !== l.id) : [...ids, l.id]) as never,
                      )
                    }
                  />
                  <span className="text-sm">{l.name.replace("Jamaican Kitchen — ", "")}</span>
                </label>
              );
            })}
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button
            variant="destructive"
            onClick={() => {
              onSave(memberId!, { active: !member.active });
            }}
          >
            {member.active ? "Suspend account" : "Reactivate account"}
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(memberId!, form)}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
