"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Printer,
  Download,
  Plane,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  GraduationCap,
  FileText,
} from "lucide-react";

const PREFLIGHT_LABELS: Record<string, string> = {
  proficiencyCheck: "Annual Proficiency Check verified",
  rentalAgreement: "Rental Agreement on file",
  weightBalance: "W&B reviewed",
  notams: "NOTAMs checked",
  weatherBriefing: "Weather briefing obtained",
  paxBriefing: "PAX briefing completed",
};

const STATUS_BADGE: Record<string, string> = {
  returned:   "bg-green-100 text-green-700",
  dispatched: "bg-blue-100 text-blue-700",
  cancelled:  "bg-slate-100 text-slate-500",
};

const MAINT_BADGE: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pass:   { label: "Pass",   color: "text-green-600",  icon: CheckCircle2 },
  review: { label: "Review", color: "text-orange-500", icon: AlertCircle },
  fail:   { label: "Fail",   color: "text-red-600",    icon: XCircle },
};

interface DispatchDetail {
  id: string;
  status: string;
  hobbsOut: number;
  tachOut: number;
  hobbsIn: number | null;
  tachIn: number | null;
  hobbsFlown: number | null;
  tachFlown: number | null;
  maintenanceStatus: string;
  preflightChecks: Record<string, boolean> | null;
  departTime: string;
  returnTime: string | null;
  notes: string | null;
  aircraftId: string;
  aircraftRegistration: string | null;
  aircraftModel: string | null;
  pilotName: string | null;
  instructorName: string | null;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

export default function DispatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [d, setD] = useState<DispatchDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dispatch/detail?id=${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setD)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground animate-pulse">Loading...</p>
    </div>
  );

  if (!d) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Dispatch record not found.</p>
    </div>
  );

  const departDate = new Date(d.departTime);
  const returnDate = d.returnTime ? new Date(d.returnTime) : null;
  const checks = d.preflightChecks ?? {};
  const maint = MAINT_BADGE[d.maintenanceStatus] ?? MAINT_BADGE.review;
  const MaintIcon = maint.icon;

  const fmt = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " · " +
    date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#0F1B2D]">
            {d.aircraftRegistration ?? "Dispatch Record"}
          </h1>
          <p className="text-sm text-muted-foreground">{d.aircraftModel ?? ""}</p>
        </div>
        <Badge variant="outline" className={`text-xs ${STATUS_BADGE[d.status] ?? ""}`}>
          {d.status}
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open(`/print/dispatch/${id}`, "_blank")}
          className="gap-1.5"
        >
          <Printer className="h-4 w-4" /> Print
        </Button>
        <Button
          size="sm"
          onClick={() => {
            const win = window.open(`/print/dispatch/${id}`, "_blank");
            if (win) {
              win.onload = () => {
                // Use the browser's save-as-PDF through print dialog
                win.document.title = `Dispatch-${d.aircraftRegistration ?? id}`;
              };
            }
          }}
          className="gap-1.5 bg-[#1A6FB5] hover:bg-[#155d99]"
        >
          <Download className="h-4 w-4" /> Save PDF
        </Button>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Hobbs Flown</p>
            <p className="text-2xl font-bold">
              {d.hobbsFlown != null ? d.hobbsFlown.toFixed(1) : "—"}
              <span className="text-sm font-normal text-muted-foreground"> hrs</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tach Flown</p>
            <p className="text-2xl font-bold">
              {d.tachFlown != null ? d.tachFlown.toFixed(1) : "—"}
              <span className="text-sm font-normal text-muted-foreground"> hrs</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Depart</p>
            <p className="text-sm font-bold">
              {departDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
            <p className="text-xs text-muted-foreground">
              {departDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Maintenance</p>
            <div className="flex items-center gap-1.5 mt-1">
              <MaintIcon className={`h-4 w-4 ${maint.color}`} />
              <span className={`text-sm font-bold ${maint.color}`}>{maint.label}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flight details */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Aircraft & Crew */}
        <Card>
          <CardContent className="p-4 space-y-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Aircraft & Crew</p>
            <Row
              label="Aircraft"
              value={
                <span className="flex items-center gap-1.5">
                  <Plane className="h-3.5 w-3.5 text-muted-foreground" />
                  {d.aircraftRegistration ?? "—"} {d.aircraftModel ? `· ${d.aircraftModel}` : ""}
                </span>
              }
            />
            <Row
              label="Pilot"
              value={
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  {d.pilotName ?? "Unknown"}
                </span>
              }
            />
            {d.instructorName && (
              <Row
                label="Instructor"
                value={
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                    {d.instructorName}
                  </span>
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Times */}
        <Card>
          <CardContent className="p-4 space-y-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Times</p>
            <Row label="Depart" value={fmt(departDate)} />
            <Row label="Return" value={returnDate ? fmt(returnDate) : "In progress"} />
            {d.hobbsFlown != null && (
              <Row
                label="Block time"
                value={
                  returnDate
                    ? `${Math.round((returnDate.getTime() - departDate.getTime()) / 60000)} min`
                    : "—"
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Hobbs / Tach */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Hobbs / Tach</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left py-1 font-medium"></th>
                  <th className="text-right py-1 font-medium w-20">Out</th>
                  <th className="text-right py-1 font-medium w-20">In</th>
                  <th className="text-right py-1 font-medium w-20">Flown</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Hobbs
                  </td>
                  <td className="py-2 text-right">{d.hobbsOut.toFixed(2)}</td>
                  <td className="py-2 text-right">{d.hobbsIn?.toFixed(2) ?? "—"}</td>
                  <td className="py-2 text-right font-semibold">
                    {d.hobbsFlown != null ? `${d.hobbsFlown.toFixed(1)} hrs` : "—"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Tach
                  </td>
                  <td className="py-2 text-right">{d.tachOut.toFixed(2)}</td>
                  <td className="py-2 text-right">{d.tachIn?.toFixed(2) ?? "—"}</td>
                  <td className="py-2 text-right font-semibold">
                    {d.tachFlown != null ? `${d.tachFlown.toFixed(1)} hrs` : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Pre-flight Checklist */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pre-flight Checklist</p>
            <div className="space-y-2">
              {Object.entries(PREFLIGHT_LABELS).map(([key, label]) => {
                const checked = checks[key] === true;
                return (
                  <div key={key} className="flex items-center gap-2.5">
                    {checked
                      ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      : <XCircle className="h-4 w-4 text-slate-300 shrink-0" />
                    }
                    <span className={`text-sm ${checked ? "" : "text-muted-foreground"}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {d.notes && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
            <p className="text-sm whitespace-pre-line">{d.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Invoice link */}
      {d.status === "returned" && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={async () => {
              const res = await fetch("/api/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dispatchLogId: id }),
              });
              if (res.ok) {
                const data = await res.json();
                router.push(`/dashboard/invoices/${data.id}`);
              }
            }}
          >
            <FileText className="h-4 w-4" /> Generate Invoice
          </Button>
        </div>
      )}
    </div>
  );
}
