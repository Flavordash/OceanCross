"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle2, AlertCircle, XCircle, PlaneTakeoff, Search, FileText, PlaneLanding } from "lucide-react";

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
  notes: string | null;
  aircraftId: string;
  aircraftRegistration: string | null;
  aircraftModel: string | null;
  pilotName: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  returned:   "bg-green-100 text-green-700",
  dispatched: "bg-blue-100 text-blue-700",
  cancelled:  "bg-slate-100 text-slate-500",
};

export default function DispatchHistoryPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<DispatchLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState<string | null>(null);

  // Return dialog state
  const [returnTarget, setReturnTarget] = useState<DispatchLog | null>(null);
  const [hobbsIn, setHobbsIn] = useState("");
  const [tachIn, setTachIn] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [returning, setReturning] = useState(false);
  const [returnError, setReturnError] = useState("");

  useEffect(() => {
    fetch("/api/dispatch")
      .then((r) => r.ok ? r.json() : [])
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      !q ||
      l.aircraftRegistration?.toLowerCase().includes(q) ||
      l.aircraftModel?.toLowerCase().includes(q) ||
      l.pilotName?.toLowerCase().includes(q)
    );
  });

  const totalHobbs = filtered.reduce((s, l) => s + (l.hobbsFlown ?? 0), 0);
  const totalFlights = filtered.filter((l) => l.status === "returned").length;

  async function generateInvoice(dispatchId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setGenerating(dispatchId);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dispatchLogId: dispatchId }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/dashboard/invoices/${data.id}`);
    }
    setGenerating(null);
  }

  function openReturnDialog(log: DispatchLog, e: React.MouseEvent) {
    e.stopPropagation();
    setReturnTarget(log);
    setHobbsIn(log.hobbsOut.toFixed(2));
    setTachIn(log.tachOut.toFixed(2));
    setReturnNotes(log.notes ?? "");
    setReturnError("");
  }

  async function submitReturn() {
    if (!returnTarget) return;
    const hIn = parseFloat(hobbsIn);
    const tIn = parseFloat(tachIn);
    if (isNaN(hIn) || isNaN(tIn)) {
      setReturnError("Hobbs In and Tach In must be valid numbers.");
      return;
    }
    if (hIn < returnTarget.hobbsOut) {
      setReturnError(`Hobbs In (${hIn}) cannot be less than Hobbs Out (${returnTarget.hobbsOut}).`);
      return;
    }
    if (tIn < returnTarget.tachOut) {
      setReturnError(`Tach In (${tIn}) cannot be less than Tach Out (${returnTarget.tachOut}).`);
      return;
    }

    setReturning(true);
    setReturnError("");
    const res = await fetch("/api/dispatch", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dispatchId: returnTarget.id,
        hobbsIn: hIn,
        tachIn: tIn,
        notes: returnNotes || null,
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      setLogs((prev) =>
        prev.map((l) =>
          l.id === updated.id
            ? {
                ...l,
                status: "returned",
                hobbsIn: updated.hobbsIn,
                tachIn: updated.tachIn,
                hobbsFlown: updated.hobbsFlown,
                tachFlown: updated.tachFlown,
                returnTime: updated.returnTime,
                notes: updated.notes,
              }
            : l
        )
      );
      setReturnTarget(null);
    } else {
      const data = await res.json();
      setReturnError(data.error ?? "Failed to record return.");
    }
    setReturning(false);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F1B2D]">Dispatch History</h1>
        <p className="text-sm text-muted-foreground">All aircraft flight records</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Dispatches</p>
            <p className="text-2xl font-bold">{logs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Completed Flights</p>
            <p className="text-2xl font-bold">{totalFlights}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Hobbs Flown</p>
            <p className="text-2xl font-bold">
              {totalHobbs.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground"> hrs</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search aircraft, pilot..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {search ? "No results found" : "No dispatch records yet"}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((log) => {
                const maint = log.maintenanceStatus;
                const MaintIcon = maint === "pass" ? CheckCircle2 : maint === "review" ? AlertCircle : XCircle;
                const maintColor = maint === "pass" ? "text-green-600" : maint === "review" ? "text-orange-500" : "text-red-600";

                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 rounded border p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/dispatch/${log.id}`)}
                  >
                    <PlaneTakeoff className="h-4 w-4 text-muted-foreground shrink-0" />

                    {/* Aircraft */}
                    <div className="w-28 shrink-0">
                      <p className="text-sm font-semibold">{log.aircraftRegistration ?? "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{log.aircraftModel ?? ""}</p>
                    </div>

                    {/* Date / Time */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {new Date(log.departTime).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                        {" · "}
                        {new Date(log.departTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        {log.returnTime && (
                          <span className="text-muted-foreground">
                            {" → "}
                            {new Date(log.returnTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{log.pilotName ?? "Unknown pilot"}</p>
                    </div>

                    {/* Hobbs */}
                    <div className="text-right shrink-0 w-24">
                      {log.hobbsFlown != null ? (
                        <>
                          <p className="text-sm font-semibold">{log.hobbsFlown.toFixed(1)} hrs</p>
                          <p className="text-xs text-muted-foreground">
                            {log.hobbsOut} → {log.hobbsIn?.toFixed(1) ?? "—"}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">In progress</p>
                      )}
                    </div>

                    {/* Status + Maint */}
                    <div className="flex items-center gap-2 shrink-0">
                      <MaintIcon className={`h-4 w-4 ${maintColor}`} />
                      <Badge variant="outline" className={`text-xs ${STATUS_BADGE[log.status] ?? ""}`}>
                        {log.status}
                      </Badge>
                    </div>

                    {/* Return button — only for in-progress flights */}
                    {log.status === "dispatched" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 h-7 px-2 text-xs gap-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={(e) => openReturnDialog(log, e)}
                      >
                        <PlaneLanding className="h-3.5 w-3.5" />
                        Return
                      </Button>
                    )}

                    {/* Invoice button — only for returned flights */}
                    {log.status === "returned" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 h-7 px-2 text-xs gap-1"
                        disabled={generating === log.id}
                        onClick={(e) => generateInvoice(log.id, e)}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {generating === log.id ? "..." : "Invoice"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Return Dialog */}
      <Dialog open={!!returnTarget} onOpenChange={(open) => { if (!open) setReturnTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Return</DialogTitle>
          </DialogHeader>
          {returnTarget && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                {returnTarget.aircraftRegistration} · {returnTarget.pilotName ?? "Unknown pilot"}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Hobbs In</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={hobbsIn}
                    onChange={(e) => setHobbsIn(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Out: {returnTarget.hobbsOut.toFixed(2)}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tach In</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={tachIn}
                    onChange={(e) => setTachIn(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Out: {returnTarget.tachOut.toFixed(2)}</p>
                </div>
              </div>

              {hobbsIn && tachIn && !isNaN(parseFloat(hobbsIn)) && !isNaN(parseFloat(tachIn)) && (
                <p className="text-xs text-muted-foreground bg-slate-50 rounded px-3 py-2">
                  Hobbs flown: <span className="font-semibold text-foreground">{Math.max(0, parseFloat(hobbsIn) - returnTarget.hobbsOut).toFixed(1)} hrs</span>
                  {" · "}
                  Tach flown: <span className="font-semibold text-foreground">{Math.max(0, parseFloat(tachIn) - returnTarget.tachOut).toFixed(1)} hrs</span>
                </p>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Notes (optional)</Label>
                <Input
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Any notes about the return..."
                  className="h-8 text-sm"
                />
              </div>

              {returnError && (
                <p className="text-xs text-red-600">{returnError}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReturnTarget(null)} disabled={returning}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={submitReturn}
              disabled={returning}
              className="bg-[#1A6FB5] hover:bg-[#155d99]"
            >
              {returning ? "Saving..." : "Confirm Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
