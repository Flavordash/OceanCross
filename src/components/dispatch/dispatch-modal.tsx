"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const PREFLIGHT_ITEMS = [
  { key: "proficiencyCheck", label: "Annual Proficiency Check verified" },
  { key: "rentalAgreement", label: "Rental Agreement on file" },
  { key: "weightBalance", label: "W&B reviewed" },
  { key: "notams", label: "NOTAMs checked" },
  { key: "weatherBriefing", label: "Weather briefing obtained" },
  { key: "paxBriefing", label: "PAX briefing completed" },
];

const MAINT_BADGE: Record<string, { label: string; className: string }> = {
  pass: { label: "Pass", className: "bg-green-100 text-green-700" },
  review: { label: "Review", className: "bg-orange-100 text-orange-700" },
  fail: { label: "Fail", className: "bg-red-100 text-red-700" },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onDispatched: () => void;
}

interface PreflightData {
  event: {
    id: string;
    title: string;
    type: string;
    startTime: string;
    endTime: string;
    aircraftId: string | null;
    studentId: string | null;
    instructorId: string | null;
  };
  aircraft: {
    id: string;
    registration: string;
    model: string;
    hobbsHours: number;
    tachHours: number;
    status: string;
  } | null;
  pilot: { id: string; fullName: string; role: string } | null;
  instructor: { id: string; fullName: string } | null;
  maintenanceStatus: "pass" | "review" | "fail";
  existingDispatch: unknown;
}

export function DispatchModal({ open, onOpenChange, eventId, onDispatched }: Props) {
  const [data, setData] = useState<PreflightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);

  const [hobbsOut, setHobbsOut] = useState("");
  const [tachOut, setTachOut] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && eventId) {
      setLoading(true);
      setError(null);
      fetch(`/api/dispatch?eventId=${eventId}&preflight=true`)
        .then(async (r) => {
          if (!r.ok) throw new Error("Failed to load preflight data");
          const d = await r.json();
          setData(d);
          setHobbsOut(d.aircraft?.hobbsHours?.toFixed(1) ?? "0");
          setTachOut(d.aircraft?.tachHours?.toFixed(1) ?? "0");
          setChecks({});
          setNotes("");
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [open, eventId]);

  function toggleCheck(key: string) {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleDispatch() {
    if (!data?.event || !data.aircraft) return;
    setError(null);
    setDispatching(true);

    const pilotId = data.pilot?.id ?? data.instructor?.id;
    if (!pilotId) {
      setError("No pilot assigned to this event");
      setDispatching(false);
      return;
    }

    const res = await fetch("/api/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: data.event.id,
        aircraftId: data.aircraft.id,
        pilotId,
        instructorId: data.instructor?.id ?? null,
        hobbsOut: parseFloat(hobbsOut),
        tachOut: parseFloat(tachOut),
        maintenanceStatus: data.maintenanceStatus,
        preflightChecks: checks,
        departTime: new Date().toISOString(),
        notes: notes || null,
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Dispatch failed");
      setDispatching(false);
      return;
    }

    setDispatching(false);
    onOpenChange(false);
    onDispatched();
  }

  const maint = data?.maintenanceStatus ? MAINT_BADGE[data.maintenanceStatus] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Dispatch</DialogTitle>
          <DialogDescription>
            Pre-flight check before dispatch
          </DialogDescription>
        </DialogHeader>

        {loading && <p className="text-sm text-muted-foreground py-4">Loading preflight data...</p>}
        {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{error}</p>}

        {data && !loading && (
          <div className="space-y-4">
            {/* Aircraft Info */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Aircraft: {data.aircraft?.registration ?? "None"} {data.aircraft?.model ?? ""}
                </h3>
                <span className="text-xs text-muted-foreground">
                  Depart: {new Date(data.event.startTime).toLocaleString([], { month: "2-digit", day: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="hobbsOut">Hobbs Out</Label>
                  <Input
                    id="hobbsOut"
                    type="number"
                    step="0.1"
                    value={hobbsOut}
                    onChange={(e) => setHobbsOut(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tachOut">Tach Out</Label>
                  <Input
                    id="tachOut"
                    type="number"
                    step="0.1"
                    value={tachOut}
                    onChange={(e) => setTachOut(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Maintenance Status */}
            <div className="flex items-center justify-between rounded border p-3">
              <span className="text-sm">Maintenance</span>
              {maint && (
                <Badge variant="outline" className={maint.className}>
                  {maint.label}
                </Badge>
              )}
            </div>

            {/* Pilot Info */}
            <div className="rounded border p-3 space-y-1">
              {data.pilot && (
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{data.pilot.fullName}</span>
                  <span className="text-muted-foreground capitalize">{data.pilot.role}</span>
                </div>
              )}
              {data.instructor && (
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{data.instructor.fullName}</span>
                  <span className="text-muted-foreground">Instructor</span>
                </div>
              )}
            </div>

            {/* Pre-flight Checklist */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Pre-flight Checklist</h3>
              {PREFLIGHT_ITEMS.map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                  <Checkbox
                    id={item.key}
                    checked={checks[item.key] ?? false}
                    onCheckedChange={() => toggleCheck(item.key)}
                  />
                  <label
                    htmlFor={item.key}
                    className="text-sm cursor-pointer"
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="dispatchNotes">Notes</Label>
              <Input
                id="dispatchNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional dispatch notes..."
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDispatch}
            disabled={dispatching || loading || !data?.aircraft}
            className="bg-[#1A6FB5] hover:bg-[#155d99]"
          >
            {dispatching ? "Dispatching..." : "Dispatch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
