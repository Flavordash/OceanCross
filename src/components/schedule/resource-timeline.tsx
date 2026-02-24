"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";

const EVENT_COLORS: Record<string, string> = {
  flight_training: "#3B82F6",
  maintenance: "#F97316",
  exam: "#EF4444",
  ground_school: "#22C55E",
};

interface ScheduleEvent {
  id: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  status: string;
  aircraftId: string | null;
  instructorId: string | null;
  studentId: string | null;
  aircraftReg: string | null;
  instructorName: string | null;
  studentName: string | null;
  dispatchStatus?: string | null;
}

interface AircraftResource {
  id: string;
  registration: string;
  model: string;
}

interface Props {
  date: Date;
  aircraft: AircraftResource[];
  events: ScheduleEvent[];
  onEventClick: (event: ScheduleEvent) => void;
  onDateChange: (date: Date) => void;
  slotMinHour?: number;
  slotMaxHour?: number;
}

export function ResourceTimeline({
  date,
  aircraft,
  events,
  onEventClick,
  onDateChange,
  slotMinHour = 6,
  slotMaxHour = 22,
}: Props) {
  const totalSlots = slotMaxHour - slotMinHour;
  const totalMinutes = totalSlots * 60;

  const dayStart = useMemo(() => {
    const d = new Date(date);
    d.setHours(slotMinHour, 0, 0, 0);
    return d;
  }, [date, slotMinHour]);

  const dayEnd = useMemo(() => {
    const d = new Date(date);
    d.setHours(slotMaxHour, 0, 0, 0);
    return d;
  }, [date, slotMaxHour]);

  const hours = useMemo(() => {
    return Array.from({ length: totalSlots }, (_, i) => slotMinHour + i);
  }, [totalSlots, slotMinHour]);

  const eventsByAircraft = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    aircraft.forEach((ac) => map.set(ac.id, []));
    events.forEach((e) => {
      if (e.aircraftId && map.has(e.aircraftId)) {
        map.get(e.aircraftId)!.push(e);
      }
    });
    return map;
  }, [aircraft, events]);

  function getEventPosition(event: ScheduleEvent) {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const eventStart = Math.max(start.getTime(), dayStart.getTime());
    const eventEnd = Math.min(end.getTime(), dayEnd.getTime());

    if (eventEnd <= dayStart.getTime() || eventStart >= dayEnd.getTime()) {
      return null;
    }

    const leftPercent = ((eventStart - dayStart.getTime()) / (totalMinutes * 60000)) * 100;
    const widthPercent = ((eventEnd - eventStart) / (totalMinutes * 60000)) * 100;

    return {
      left: `${leftPercent}%`,
      width: `${Math.max(widthPercent, 1)}%`,
    };
  }

  function prevDay() {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    onDateChange(d);
  }

  function nextDay() {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    onDateChange(d);
  }

  function goToday() {
    onDateChange(new Date());
  }

  const dateStr = date.toISOString().split("T")[0];

  // Now indicator
  const now = new Date();
  const nowPosition = useMemo(() => {
    if (now < dayStart || now > dayEnd) return null;
    const pct = ((now.getTime() - dayStart.getTime()) / (totalMinutes * 60000)) * 100;
    return `${pct}%`;
  }, [now, dayStart, dayEnd, totalMinutes]);

  return (
    <div className="space-y-3">
      {/* Date Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={prevDay}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={goToday}>
          Today
        </Button>
        <Button variant="outline" size="icon" onClick={nextDay}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Input
          type="date"
          value={dateStr}
          onChange={(e) => onDateChange(new Date(e.target.value + "T12:00:00"))}
          className="w-40 h-9"
        />
        <span className="text-sm font-medium text-muted-foreground ml-2">
          {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </span>
      </div>

      {/* Timeline Grid */}
      <div className="rounded-lg border bg-white overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Hour Headers */}
          <div className="flex border-b">
            <div className="w-40 shrink-0 border-r bg-slate-50 px-3 py-2 text-xs font-semibold text-muted-foreground">
              Aircraft
            </div>
            <div className="flex-1 flex">
              {hours.map((h) => (
                <div
                  key={h}
                  className="flex-1 border-r px-1 py-2 text-center text-xs text-muted-foreground"
                  style={{ minWidth: `${100 / totalSlots}%` }}
                >
                  {h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}
                </div>
              ))}
            </div>
          </div>

          {/* Resource Rows */}
          {aircraft.map((ac) => {
            const acEvents = eventsByAircraft.get(ac.id) ?? [];
            return (
              <div key={ac.id} className="flex border-b last:border-b-0 hover:bg-slate-50/50">
                <div className="w-40 shrink-0 border-r px-3 py-2 flex flex-col justify-center">
                  <span className="text-sm font-medium">{ac.registration}</span>
                  <span className="text-[11px] text-muted-foreground">{ac.model}</span>
                </div>
                <div className="flex-1 relative" style={{ minHeight: "44px" }}>
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {hours.map((h) => (
                      <div key={h} className="flex-1 border-r border-dashed border-slate-100" />
                    ))}
                  </div>

                  {/* Now indicator */}
                  {nowPosition && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
                      style={{ left: nowPosition }}
                    />
                  )}

                  {/* Events */}
                  {acEvents.map((event) => {
                    const pos = getEventPosition(event);
                    if (!pos) return null;
                    const bg = EVENT_COLORS[event.type] ?? "#6B7280";
                    return (
                      <div
                        key={event.id}
                        className="absolute top-1 bottom-1 rounded-sm px-1.5 flex items-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity z-[5]"
                        style={{
                          left: pos.left,
                          width: pos.width,
                          backgroundColor: bg,
                        }}
                        onClick={() => onEventClick(event)}
                        title={`${event.title}\n${new Date(event.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${new Date(event.endTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                      >
                        <span className="text-[11px] font-medium text-white truncate">
                          {event.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {aircraft.length === 0 && (
            <div className="text-center text-muted-foreground py-8 text-sm">
              No aircraft registered
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
