"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import { EventClickArg, DatesSetArg, EventInput } from "@fullcalendar/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, CalendarDays, LayoutList } from "lucide-react";
import { ResourceTimeline } from "@/components/schedule/resource-timeline";
import { DispatchModal } from "@/components/dispatch/dispatch-modal";
import { ReturnModal } from "@/components/dispatch/return-modal";

// ── Types ──────────────────────────────────────────────

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

interface LookupData {
  instructors: { id: string; fullName: string }[];
  students: { id: string; fullName: string }[];
  aircraft: { id: string; registration: string; model: string }[];
}

interface EventForm {
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  aircraftId: string;
  instructorId: string;
  studentId: string;
}

const EVENT_COLORS: Record<string, string> = {
  flight_training: "#3B82F6",
  maintenance: "#F97316",
  exam: "#EF4444",
  ground_school: "#22C55E",
};

const EVENT_LABELS: Record<string, string> = {
  flight_training: "Flight Training",
  maintenance: "Maintenance",
  exam: "Exam",
  ground_school: "Ground School",
};

const EMPTY_FORM: EventForm = {
  title: "",
  type: "flight_training",
  startTime: "",
  endTime: "",
  aircraftId: "",
  instructorId: "",
  studentId: "",
};

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

// ── Component ──────────────────────────────────────────

export default function SchedulePage() {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [lookup, setLookup] = useState<LookupData | null>(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // View mode
  const [view, setView] = useState<"calendar" | "resources">("calendar");
  const [resourceDate, setResourceDate] = useState(new Date());

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Detail/edit dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EventForm>(EMPTY_FORM);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Dispatch/Return modals
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [dispatchEventId, setDispatchEventId] = useState("");

  // ── Data loading ─────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    if (view === "calendar" && !dateRange.start) return;

    let params: URLSearchParams;
    if (view === "resources") {
      const dayStart = new Date(resourceDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(resourceDate);
      dayEnd.setHours(23, 59, 59, 999);
      params = new URLSearchParams({
        start: dayStart.toISOString(),
        end: dayEnd.toISOString(),
      });
    } else {
      params = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end,
      });
    }

    const res = await fetch(`/api/schedule?${params}`);
    if (res.ok) {
      setEvents(await res.json());
    }
  }, [dateRange, view, resourceDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    async function loadLookup() {
      const res = await fetch("/api/schedule?lookup=true");
      if (res.ok) setLookup(await res.json());
    }
    loadLookup();
  }, []);

  // ── FullCalendar adapters ────────────────────────────

  const calendarEvents: EventInput[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.startTime,
    end: e.endTime,
    backgroundColor: EVENT_COLORS[e.type] ?? "#6B7280",
    borderColor: EVENT_COLORS[e.type] ?? "#6B7280",
    extendedProps: e,
  }));

  function handleDatesSet(arg: DatesSetArg) {
    setDateRange({
      start: arg.startStr,
      end: arg.endStr,
    });
  }

  function handleDateClick(arg: DateClickArg) {
    const start = arg.dateStr.includes("T")
      ? arg.dateStr
      : `${arg.dateStr}T09:00`;
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    setForm({
      ...EMPTY_FORM,
      startTime: toLocalDatetime(startDate.toISOString()),
      endTime: toLocalDatetime(endDate.toISOString()),
    });
    setFormError(null);
    setCreateOpen(true);
  }

  function handleEventClick(arg: EventClickArg) {
    const e = arg.event.extendedProps as ScheduleEvent;
    openEventDetail(e);
  }

  function openEventDetail(e: ScheduleEvent) {
    setSelectedEvent(e);
    setEditing(false);
    setEditError(null);
    setDetailOpen(true);
  }

  // ── Dispatch helpers ──────────────────────────────────

  const canDispatch = (e: ScheduleEvent) =>
    (e.type === "flight_training" || e.type === "exam") &&
    e.aircraftId &&
    e.status === "scheduled" &&
    !e.dispatchStatus;

  const canReturn = (e: ScheduleEvent) =>
    e.dispatchStatus === "dispatched";

  function openDispatch() {
    if (!selectedEvent) return;
    setDispatchEventId(selectedEvent.id);
    setDetailOpen(false);
    setDispatchOpen(true);
  }

  function openReturn() {
    if (!selectedEvent) return;
    setDispatchEventId(selectedEvent.id);
    setDetailOpen(false);
    setReturnOpen(true);
  }

  function handleDispatchComplete() {
    fetchEvents();
  }

  // ── Create ───────────────────────────────────────────

  async function handleCreate() {
    setFormError(null);
    if (!form.title || !form.startTime || !form.endTime) {
      setFormError("Title, start time, and end time are required");
      return;
    }
    setSaving(true);

    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        type: form.type,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        aircraftId: form.aircraftId || null,
        instructorId: form.instructorId || null,
        studentId: form.studentId || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setFormError(
        data.conflicts ? data.conflicts.join(". ") : data.error ?? "Failed"
      );
      setSaving(false);
      return;
    }

    setSaving(false);
    setCreateOpen(false);
    setForm(EMPTY_FORM);
    fetchEvents();
  }

  // ── Edit ─────────────────────────────────────────────

  function startEditing() {
    if (!selectedEvent) return;
    setEditForm({
      title: selectedEvent.title,
      type: selectedEvent.type,
      startTime: toLocalDatetime(selectedEvent.startTime),
      endTime: toLocalDatetime(selectedEvent.endTime),
      aircraftId: selectedEvent.aircraftId ?? "",
      instructorId: selectedEvent.instructorId ?? "",
      studentId: selectedEvent.studentId ?? "",
    });
    setEditError(null);
    setEditing(true);
  }

  async function handleUpdate() {
    if (!selectedEvent) return;
    setEditError(null);
    setEditSaving(true);

    const res = await fetch("/api/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedEvent.id,
        title: editForm.title,
        type: editForm.type,
        startTime: new Date(editForm.startTime).toISOString(),
        endTime: new Date(editForm.endTime).toISOString(),
        aircraftId: editForm.aircraftId || null,
        instructorId: editForm.instructorId || null,
        studentId: editForm.studentId || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setEditError(
        data.conflicts ? data.conflicts.join(". ") : data.error ?? "Failed"
      );
      setEditSaving(false);
      return;
    }

    setEditSaving(false);
    setDetailOpen(false);
    fetchEvents();
  }

  // ── Delete ───────────────────────────────────────────

  async function handleDelete() {
    if (!selectedEvent) return;
    const res = await fetch(`/api/schedule?id=${selectedEvent.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDetailOpen(false);
      fetchEvents();
    }
  }

  // ── Select helper ────────────────────────────────────

  function SelectField({
    id,
    label,
    value,
    onChange,
    options,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">None</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // ── Form fields (shared between create & edit) ──────

  function EventFormFields({
    data,
    setData,
    error,
  }: {
    data: EventForm;
    setData: (f: EventForm) => void;
    error: string | null;
  }) {
    return (
      <div className="space-y-4 py-2">
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            placeholder="Flight lesson with..."
          />
        </div>

        <SelectField
          id="type"
          label="Type"
          value={data.type}
          onChange={(v) => setData({ ...data, type: v })}
          options={Object.entries(EVENT_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="start">Start</Label>
            <Input
              id="start"
              type="datetime-local"
              value={data.startTime}
              onChange={(e) => setData({ ...data, startTime: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end">End</Label>
            <Input
              id="end"
              type="datetime-local"
              value={data.endTime}
              onChange={(e) => setData({ ...data, endTime: e.target.value })}
            />
          </div>
        </div>

        {lookup && (
          <>
            <SelectField
              id="aircraft"
              label="Aircraft"
              value={data.aircraftId}
              onChange={(v) => setData({ ...data, aircraftId: v })}
              options={lookup.aircraft.map((a) => ({
                value: a.id,
                label: `${a.registration} — ${a.model}`,
              }))}
            />
            <SelectField
              id="instructor"
              label="Instructor"
              value={data.instructorId}
              onChange={(v) => setData({ ...data, instructorId: v })}
              options={lookup.instructors.map((i) => ({
                value: i.id,
                label: i.fullName,
              }))}
            />
            <SelectField
              id="student"
              label="Student"
              value={data.studentId}
              onChange={(v) => setData({ ...data, studentId: v })}
              options={lookup.students.map((s) => ({
                value: s.id,
                label: s.fullName,
              }))}
            />
          </>
        )}
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Schedule</h1>
          <p className="text-sm text-muted-foreground">
            Manage flights, maintenance, and training
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-lg border overflow-hidden">
            <Button
              variant={view === "calendar" ? "default" : "ghost"}
              size="sm"
              className={view === "calendar" ? "bg-[#1A6FB5] hover:bg-[#155d99] rounded-none" : "rounded-none"}
              onClick={() => setView("calendar")}
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Calendar
            </Button>
            <Button
              variant={view === "resources" ? "default" : "ghost"}
              size="sm"
              className={view === "resources" ? "bg-[#1A6FB5] hover:bg-[#155d99] rounded-none" : "rounded-none"}
              onClick={() => setView("resources")}
            >
              <LayoutList className="h-4 w-4 mr-1" />
              Resources
            </Button>
          </div>

          <Button
            onClick={() => {
              const now = new Date();
              const later = new Date(now.getTime() + 60 * 60 * 1000);
              setForm({
                ...EMPTY_FORM,
                startTime: toLocalDatetime(now.toISOString()),
                endTime: toLocalDatetime(later.toISOString()),
              });
              setFormError(null);
              setCreateOpen(true);
            }}
            className="bg-[#1A6FB5] hover:bg-[#155d99]"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(EVENT_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: EVENT_COLORS[key] }}
            />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar View */}
      {view === "calendar" && (
        <div className="rounded-lg border bg-white p-2 sm:p-4">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={calendarEvents}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            height="auto"
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            nowIndicator
            editable={false}
            selectable={false}
            eventTimeFormat={{
              hour: "numeric",
              minute: "2-digit",
              meridiem: "short",
            }}
          />
        </div>
      )}

      {/* Resource Timeline View */}
      {view === "resources" && lookup && (
        <ResourceTimeline
          date={resourceDate}
          aircraft={lookup.aircraft}
          events={events}
          onEventClick={openEventDetail}
          onDateChange={setResourceDate}
        />
      )}

      {/* ── Create Dialog ─────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Event</DialogTitle>
            <DialogDescription>
              Create a new schedule event. Conflicts will be checked
              automatically.
            </DialogDescription>
          </DialogHeader>
          <EventFormFields data={form} setData={setForm} error={formError} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving}
              className="bg-[#1A6FB5] hover:bg-[#155d99]"
            >
              {saving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail / Edit Dialog ──────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedEvent && !editing ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
                <DialogDescription>Event details</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: EVENT_COLORS[selectedEvent.type],
                      color: EVENT_COLORS[selectedEvent.type],
                    }}
                  >
                    {EVENT_LABELS[selectedEvent.type] ?? selectedEvent.type}
                  </Badge>
                  <Badge variant="secondary">{selectedEvent.status}</Badge>
                  {selectedEvent.dispatchStatus && (
                    <Badge variant="outline" className={
                      selectedEvent.dispatchStatus === "dispatched"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }>
                      {selectedEvent.dispatchStatus}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Start</p>
                    <p>
                      {new Date(selectedEvent.startTime).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">End</p>
                    <p>{new Date(selectedEvent.endTime).toLocaleString()}</p>
                  </div>
                </div>
                {selectedEvent.aircraftReg && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Aircraft</p>
                    <p>{selectedEvent.aircraftReg}</p>
                  </div>
                )}
                {selectedEvent.instructorName && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Instructor</p>
                    <p>{selectedEvent.instructorName}</p>
                  </div>
                )}
                {selectedEvent.studentName && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Student</p>
                    <p>{selectedEvent.studentName}</p>
                  </div>
                )}
              </div>
              <DialogFooter className="flex-row gap-2 sm:justify-between">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
                <div className="flex gap-2">
                  {canDispatch(selectedEvent) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500 text-green-700 hover:bg-green-50"
                      onClick={openDispatch}
                    >
                      Dispatch
                    </Button>
                  )}
                  {canReturn(selectedEvent) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-500 text-blue-700 hover:bg-blue-50"
                      onClick={openReturn}
                    >
                      Return
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    onClick={startEditing}
                    className="bg-[#1A6FB5] hover:bg-[#155d99]"
                  >
                    Edit
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : selectedEvent && editing ? (
            <>
              <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
                <DialogDescription>
                  Modify event details. Conflicts will be re-checked.
                </DialogDescription>
              </DialogHeader>
              <EventFormFields
                data={editForm}
                setData={setEditForm}
                error={editError}
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={editSaving}
                  className="bg-[#1A6FB5] hover:bg-[#155d99]"
                >
                  {editSaving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ── Dispatch Modal ────────────────────────────── */}
      <DispatchModal
        open={dispatchOpen}
        onOpenChange={setDispatchOpen}
        eventId={dispatchEventId}
        onDispatched={handleDispatchComplete}
      />

      {/* ── Return Modal ──────────────────────────────── */}
      <ReturnModal
        open={returnOpen}
        onOpenChange={setReturnOpen}
        eventId={dispatchEventId}
        onReturned={handleDispatchComplete}
      />
    </div>
  );
}
