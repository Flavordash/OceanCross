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
import { ArrowLeft, Plane, Clock, Gauge } from "lucide-react";
import { RemindersTable } from "@/components/aircraft/reminders-table";

interface Aircraft {
  id: string;
  registration: string;
  type: string;
  model: string;
  status: string;
  totalHours: number;
  hobbsHours: number;
  tachHours: number;
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

export default function AircraftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const aircraftId = params.id as string;

  const [ac, setAc] = useState<Aircraft | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
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
    const [acRes, schedRes, maintRes, remRes] = await Promise.all([
      fetch(`/api/aircraft?id=${aircraftId}`),
      fetch(`/api/aircraft?id=${aircraftId}&detail=schedule`),
      fetch(`/api/aircraft?id=${aircraftId}&detail=maintenance`),
      fetch(`/api/aircraft/reminders?aircraftId=${aircraftId}`),
    ]);

    if (acRes.ok) setAc(await acRes.json());
    if (schedRes.ok) setSchedule(await schedRes.json());
    if (maintRes.ok) setMaintenance(await maintRes.json());
    if (remRes.ok) setReminders(await remRes.json());
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
          <p className="text-sm text-muted-foreground">{ac.type} — {ac.model}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
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
      </div>

      {/* Tabs */}
      <Tabs defaultValue="reminders" className="w-full">
        <TabsList>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

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
