"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Plane,
  Wrench,
  MessageSquare,
  Plus,
  Clock,
  Bell,
} from "lucide-react";

interface ScheduleEvent {
  id: string;
  title: string;
  type: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface AircraftStats {
  available: number;
  in_maintenance: number;
  grounded: number;
}

interface Notification {
  id: string;
  message: string;
  type: string;
  created_at: string;
  read: boolean;
}

const EVENT_COLORS: Record<string, string> = {
  flight_training: "bg-blue-100 text-blue-700 border-blue-200",
  maintenance: "bg-orange-100 text-orange-700 border-orange-200",
  exam: "bg-purple-100 text-purple-700 border-purple-200",
  ground_school: "bg-green-100 text-green-700 border-green-200",
};

const EVENT_LABELS: Record<string, string> = {
  flight_training: "Flight",
  maintenance: "Maintenance",
  exam: "Exam",
  ground_school: "Ground School",
};

export default function DashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [aircraftStats, setAircraftStats] = useState<AircraftStats>({
    available: 0,
    in_maintenance: 0,
    grounded: 0,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient();

      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const [eventsRes, aircraftRes, notifRes] = await Promise.all([
        supabase
          .from("schedule_events")
          .select("id, title, type, start_time, end_time, status")
          .gte("start_time", startOfDay.toISOString())
          .lte("start_time", endOfDay.toISOString())
          .order("start_time", { ascending: true })
          .limit(5),
        supabase.from("aircraft").select("status"),
        supabase
          .from("notifications")
          .select("id, message, type, created_at, read")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (eventsRes.data) setEvents(eventsRes.data);

      if (aircraftRes.data) {
        const stats = { available: 0, in_maintenance: 0, grounded: 0 };
        aircraftRes.data.forEach((a) => {
          const s = a.status as keyof AircraftStats;
          if (s in stats) stats[s]++;
        });
        setAircraftStats(stats);
      }

      if (notifRes.data) setNotifications(notifRes.data);

      setLoading(false);
    }
    loadDashboard();
  }, []);

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F1B2D]">Dashboard</h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <CalendarDays className="h-5 w-5 text-[#1A6FB5]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{events.length}</p>
              <p className="text-sm text-muted-foreground">Today&apos;s Events</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Plane className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{aircraftStats.available}</p>
              <p className="text-sm text-muted-foreground">Available Aircraft</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <Wrench className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {aircraftStats.in_maintenance}
              </p>
              <p className="text-sm text-muted-foreground">In Maintenance</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <Plane className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{aircraftStats.grounded}</p>
              <p className="text-sm text-muted-foreground">Grounded</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Today&apos;s Schedule
              </CardTitle>
              <CardDescription>Upcoming events for today</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/schedule">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No events scheduled for today
              </p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(event.start_time)} –{" "}
                        {formatTime(event.end_time)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={EVENT_COLORS[event.type] ?? ""}
                    >
                      {EVENT_LABELS[event.type] ?? event.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                onClick={() => router.push("/dashboard/schedule")}
              >
                <Plus className="h-5 w-5 text-[#1A6FB5]" />
                <span className="text-xs">New Booking</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                onClick={() => router.push("/dashboard/chat")}
              >
                <MessageSquare className="h-5 w-5 text-[#1A6FB5]" />
                <span className="text-xs">AI Chat</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                onClick={() => router.push("/dashboard/aircraft")}
              >
                <Plane className="h-5 w-5 text-[#1A6FB5]" />
                <span className="text-xs">Aircraft</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                onClick={() => router.push("/dashboard/clients")}
              >
                <CalendarDays className="h-5 w-5 text-[#1A6FB5]" />
                <span className="text-xs">Clients</span>
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No notifications
                </p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div key={n.id} className="flex items-start gap-2">
                      <div
                        className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                          n.read ? "bg-slate-300" : "bg-[#1A6FB5]"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm leading-snug">{n.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(n.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
