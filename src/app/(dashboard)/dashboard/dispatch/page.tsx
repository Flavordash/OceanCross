"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertCircle, XCircle, PlaneTakeoff, Search } from "lucide-react";

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

  useEffect(() => {
    fetch("/api/dispatch")
      .then((r) => r.ok ? r.json() : [])
      .then(setLogs)
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
                    onClick={() => router.push(`/dashboard/aircraft/${log.aircraftId}`)}
                  >
                    {/* Icon */}
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

                    {/* Status + Preflight */}
                    <div className="flex items-center gap-2 shrink-0">
                      <MaintIcon className={`h-4 w-4 ${maintColor}`} />
                      <Badge variant="outline" className={`text-xs ${STATUS_BADGE[log.status] ?? ""}`}>
                        {log.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
