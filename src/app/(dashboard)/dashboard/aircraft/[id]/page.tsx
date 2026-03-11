"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Gauge, Weight, Fuel, PlaneTakeoff, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { RemindersTable } from "@/components/aircraft/reminders-table";

interface DispatchLog {
  id: string;
  status: string;
  hobbsOut: number;
  tachOut: number;
  hobbsIn: number | null;
  tachIn: number | null;
  hobbsFlown: number | null;
  tachFlown: number | null;
  maintenanceStatus: string;
  departTime: string;
  returnTime: string | null;
  pilotName: string | null;
}

interface Aircraft {
  id: string;
  registration: string;
  type: string;
  model: string;
  status: string;
  totalHours: number;
  hobbsHours: number;
  tachHours: number;
  year: number | null;
  emptyWeight: number | null;
  maxTakeoffWeight: number | null;
  usefulLoad: number | null;
  maxPassengers: number | null;
  luggageCapacityLbs: number | null;
  fuelCapacityGallons: number | null;
  fuelUsableGallons: number | null;
  fuelWeightLbs: number | null;
  fuelPerWingGallons: number | null;
  oilCapacityQuarts: string | null;
  maxEnduranceHours: number | null;
  notes: string | null;
}

interface ScheduleItem {
  id: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface MaintenanceItem {
  id: string;
  description: string;
  status: string;
  bay: string | null;
  estimatedStart: string | null;
  estimatedEnd: string | null;
  mechanicName: string | null;
}

interface Reminder {
  id: string;
  aircraftId: string;
  name: string;
  type: string;
  dueHours: number | null;
  warningHours: number | null;
  dueDate: string | null;
  warningDays: number | null;
  lastCompletedAt: string | null;
  lastCompletedHours: number | null;
  notes: string | null;
  hoursRemaining: number | null;
  daysRemaining: number | null;
  status: "expired" | "warning" | "ok" | "good";
  percentRemaining: number;
}

const STATUS_BADGE: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  in_maintenance: "bg-orange-100 text-orange-700",
  grounded: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  in_maintenance: "In Maintenance",
  grounded: "Grounded",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  flight_training: "bg-blue-100 text-blue-700",
  maintenance: "bg-orange-100 text-orange-700",
  exam: "bg-red-100 text-red-700",
  ground_school: "bg-green-100 text-green-700",
};

const MAINT_STATUS_COLORS: Record<string, string> = {
  pending_parts: "bg-yellow-100 text-yellow-700",
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
};

function InfoRow({ label, value, unit }: { label: string; value: string | number | null | undefined; unit?: string }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">
        {typeof value === "number" ? value.toLocaleString() : value}
        {unit ? ` ${unit}` : ""}
      </span>
    </div>
  );
}

export default function AircraftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const aircraftId = params.id as string;

  const [ac, setAc] = useState<Aircraft | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [flights, setFlights] = useState<DispatchLog[]>([]);
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(true);

  const canEdit = role === "admin" || role === "mechanic";

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (data) setRole(data.role);
      }
      await loadAll();
      setLoading(false);
    }
    init();
  }, [aircraftId]);

  async function loadAll() {
    const [acRes, schedRes, maintRes, remRes, flightRes] = await Promise.all([
      fetch(`/api/aircraft?id=${aircraftId}`),
      fetch(`/api/aircraft?id=${aircraftId}&detail=schedule`),
      fetch(`/api/aircraft?id=${aircraftId}&detail=maintenance`),
      fetch(`/api/aircraft/reminders?aircraftId=${aircraftId}`),
      fetch(`/api/dispatch?aircraftId=${aircraftId}`),
    ]);

    if (acRes.ok) setAc(await acRes.json());
    if (schedRes.ok) setSchedule(await schedRes.json());
    if (maintRes.ok) setMaintenance(await maintRes.json());
    if (remRes.ok) setReminders(await remRes.json());
    if (flightRes.ok) setFlights(await flightRes.json());
  }

  function refreshReminders() {
    fetch(`/api/aircraft/reminders?aircraftId=${aircraftId}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setReminders);
  }

  if (loading || !ac) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const subtitle = [ac.type, ac.model, ac.year ? `(${ac.year})` : ""]
    .filter(Boolean)
    .join(" — ")
    .replace("— (", "(");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/aircraft")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#0F1B2D]">{ac.registration}</h1>
            <Badge variant="outline" className={STATUS_BADGE[ac.status] ?? ""}>
              {STATUS_LABELS[ac.status] ?? ac.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Hours</p>
              <p className="text-lg font-bold">{ac.totalHours.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <Gauge className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hobbs</p>
              <p className="text-lg font-bold">{ac.hobbsHours.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <Gauge className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tach</p>
              <p className="text-lg font-bold">{ac.tachHours.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
        {ac.maxTakeoffWeight && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                <Weight className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">MTOW</p>
                <p className="text-lg font-bold">{ac.maxTakeoffWeight.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">lbs</span></p>
              </div>
            </CardContent>
          </Card>
        )}
        {ac.usefulLoad && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
                <Fuel className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Useful Load</p>
                <p className="text-lg font-bold">{ac.usefulLoad.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">lbs</span></p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="flights">
            Flights {flights.length > 0 && <span className="ml-1 text-xs">({flights.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* General */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">General</CardTitle>
              </CardHeader>
              <CardContent>
                <InfoRow label="Registration" value={ac.registration} />
                <InfoRow label="Type" value={ac.type} />
                <InfoRow label="Model" value={ac.model} />
                <InfoRow label="Year" value={ac.year} />
                <InfoRow label="Status" value={STATUS_LABELS[ac.status] ?? ac.status} />
                <InfoRow label="Max Passengers" value={ac.maxPassengers} />
                {ac.notes && (
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm whitespace-pre-line">{ac.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weight & Balance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Weight & Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <InfoRow label="Empty Weight" value={ac.emptyWeight} unit="lbs" />
                <InfoRow label="Max Takeoff Weight" value={ac.maxTakeoffWeight} unit="lbs" />
                <InfoRow label="Useful Load" value={ac.usefulLoad} unit="lbs" />
                <InfoRow label="Luggage Capacity" value={ac.luggageCapacityLbs} unit="lbs" />
                {!ac.emptyWeight && !ac.maxTakeoffWeight && !ac.usefulLoad && (
                  <p className="text-sm text-muted-foreground">No weight data available</p>
                )}
              </CardContent>
            </Card>

            {/* Fuel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Fuel & Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <InfoRow label="Fuel Capacity" value={ac.fuelCapacityGallons} unit="gal" />
                <InfoRow label="Usable Fuel" value={ac.fuelUsableGallons} unit="gal" />
                <InfoRow label="Fuel Weight" value={ac.fuelWeightLbs} unit="lbs" />
                <InfoRow label="Per Wing" value={ac.fuelPerWingGallons} unit="gal" />
                <InfoRow label="Oil Capacity" value={ac.oilCapacityQuarts} />
                <InfoRow label="Max Endurance" value={ac.maxEnduranceHours} unit="hrs" />
                {!ac.fuelCapacityGallons && !ac.maxEnduranceHours && (
                  <p className="text-sm text-muted-foreground">No fuel data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reminders Tab */}
        <TabsContent value="reminders">
          <Card>
            <CardContent className="pt-6">
              <RemindersTable
                aircraftId={aircraftId}
                reminders={reminders}
                canEdit={canEdit}
                onRefresh={refreshReminders}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flights Tab */}
        <TabsContent value="flights">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dispatch History</CardTitle>
            </CardHeader>
            <CardContent>
              {flights.length === 0 ? (
                <p className="text-sm text-muted-foreground">No dispatch records yet</p>
              ) : (
                <div className="space-y-2">
                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Total Flights</p>
                      <p className="text-xl font-bold">{flights.length}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Hobbs Flown</p>
                      <p className="text-xl font-bold">
                        {flights.reduce((s, f) => s + (f.hobbsFlown ?? 0), 0).toFixed(1)}
                        <span className="text-xs font-normal text-muted-foreground"> hrs</span>
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Tach Flown</p>
                      <p className="text-xl font-bold">
                        {flights.reduce((s, f) => s + (f.tachFlown ?? 0), 0).toFixed(1)}
                        <span className="text-xs font-normal text-muted-foreground"> hrs</span>
                      </p>
                    </div>
                  </div>

                  {/* Log rows */}
                  {flights.map((f) => {
                    const maint = f.maintenanceStatus;
                    const MaintIcon = maint === "pass" ? CheckCircle2 : maint === "review" ? AlertCircle : XCircle;
                    const maintColor = maint === "pass" ? "text-green-600" : maint === "review" ? "text-orange-500" : "text-red-600";
                    const statusBadge = f.status === "returned"
                      ? "bg-green-100 text-green-700"
                      : f.status === "dispatched"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-600";

                    return (
                      <div key={f.id} className="flex items-center justify-between rounded border p-3 gap-3">
                        <div className="flex items-center gap-2 shrink-0">
                          <PlaneTakeoff className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {new Date(f.departTime).toLocaleDateString()} {" "}
                              {new Date(f.departTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                            </p>
                            <Badge variant="outline" className={`text-xs ${statusBadge}`}>
                              {f.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {f.pilotName ?? "Unknown pilot"}
                            {f.hobbsFlown != null && ` — ${f.hobbsFlown.toFixed(1)} hrs (Hobbs)`}
                            {f.returnTime && ` — RTB ${new Date(f.returnTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                          <span>H: {f.hobbsOut} → {f.hobbsIn ?? "—"}</span>
                          <MaintIcon className={`h-4 w-4 ${maintColor}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {schedule.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              ) : (
                <div className="space-y-2">
                  {schedule.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded border p-3">
                      <div>
                        <p className="font-medium text-sm">{s.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(s.startTime).toLocaleDateString()}{" "}
                          {new Date(s.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          {" — "}
                          {new Date(s.endTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                      <Badge variant="outline" className={EVENT_TYPE_COLORS[s.type] ?? ""}>
                        {s.type.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Maintenance History</CardTitle>
            </CardHeader>
            <CardContent>
              {maintenance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No maintenance records</p>
              ) : (
                <div className="space-y-2">
                  {maintenance.map((m) => (
                    <div key={m.id} className="rounded border p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{m.description}</p>
                        <Badge variant="outline" className={MAINT_STATUS_COLORS[m.status] ?? ""}>
                          {m.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {m.mechanicName ?? "Unassigned"}{m.bay ? ` — Bay ${m.bay}` : ""}
                        {m.estimatedStart && (
                          <> — {new Date(m.estimatedStart).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
