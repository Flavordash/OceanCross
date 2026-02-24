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
import { Separator } from "@/components/ui/separator";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onReturned: () => void;
}

interface DispatchData {
  id: string;
  hobbsOut: number;
  tachOut: number;
  departTime: string;
}

export function ReturnModal({ open, onOpenChange, eventId, onReturned }: Props) {
  const [dispatch, setDispatch] = useState<DispatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [hobbsIn, setHobbsIn] = useState("");
  const [tachIn, setTachIn] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && eventId) {
      setLoading(true);
      setError(null);
      fetch(`/api/dispatch?eventId=${eventId}`)
        .then(async (r) => {
          if (!r.ok) throw new Error("Failed to load dispatch data");
          const d = await r.json();
          setDispatch(d);
          setHobbsIn("");
          setTachIn("");
          setNotes("");
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [open, eventId]);

  const hobbsFlown = hobbsIn && dispatch
    ? (parseFloat(hobbsIn) - dispatch.hobbsOut).toFixed(1)
    : "—";
  const tachFlown = tachIn && dispatch
    ? (parseFloat(tachIn) - dispatch.tachOut).toFixed(1)
    : "—";

  async function handleReturn() {
    if (!dispatch) return;
    setError(null);

    if (!hobbsIn || !tachIn) {
      setError("Hobbs In and Tach In are required");
      return;
    }

    if (parseFloat(hobbsIn) < dispatch.hobbsOut) {
      setError("Hobbs In cannot be less than Hobbs Out");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/dispatch", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dispatchId: dispatch.id,
        hobbsIn: parseFloat(hobbsIn),
        tachIn: parseFloat(tachIn),
        notes: notes || null,
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to record return");
      setSaving(false);
      return;
    }

    setSaving(false);
    onOpenChange(false);
    onReturned();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Return</DialogTitle>
          <DialogDescription>
            Enter post-flight readings
          </DialogDescription>
        </DialogHeader>

        {loading && <p className="text-sm text-muted-foreground py-4">Loading dispatch data...</p>}
        {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{error}</p>}

        {dispatch && !loading && (
          <div className="space-y-4">
            {/* Departure Info */}
            <div className="rounded border p-3 bg-slate-50 text-sm space-y-1">
              <p className="text-muted-foreground">
                Departed: {new Date(dispatch.departTime).toLocaleString()}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Hobbs Out: </span>
                  <span className="font-medium">{dispatch.hobbsOut.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tach Out: </span>
                  <span className="font-medium">{dispatch.tachOut.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Return Readings */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="hobbsIn">Hobbs In</Label>
                <Input
                  id="hobbsIn"
                  type="number"
                  step="0.1"
                  value={hobbsIn}
                  onChange={(e) => setHobbsIn(e.target.value)}
                  placeholder={dispatch.hobbsOut.toFixed(1)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tachIn">Tach In</Label>
                <Input
                  id="tachIn"
                  type="number"
                  step="0.1"
                  value={tachIn}
                  onChange={(e) => setTachIn(e.target.value)}
                  placeholder={dispatch.tachOut.toFixed(1)}
                />
              </div>
            </div>

            {/* Calculated */}
            <div className="rounded border p-3 bg-blue-50 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Hobbs Flown: </span>
                  <span className="font-bold text-blue-700">{hobbsFlown}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tach Time: </span>
                  <span className="font-bold text-blue-700">{tachFlown}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="returnNotes">Notes</Label>
              <Input
                id="returnNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Squawks, fuel added, etc..."
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleReturn}
            disabled={saving || loading || !dispatch}
            className="bg-[#1A6FB5] hover:bg-[#155d99]"
          >
            {saving ? "Recording..." : "Record Return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
