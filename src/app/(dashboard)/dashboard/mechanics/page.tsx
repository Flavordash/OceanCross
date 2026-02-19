"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Mechanic {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  activeJobs: number;
}

interface JobItem {
  id: string;
  description: string;
  status: string;
  bay: string | null;
  estimatedStart: string | null;
  estimatedEnd: string | null;
  aircraftReg: string | null;
  aircraftModel: string | null;
}

const JOB_STATUS_BADGE: Record<string, string> = {
  pending_parts: "bg-yellow-100 text-yellow-700",
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
};

export default function MechanicsPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Mechanic | null>(null);
  const [jobs, setJobs] = useState<JobItem[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/mechanics");
      if (res.ok) setMechanics(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  async function openDetail(mechanic: Mechanic) {
    setSelected(mechanic);
    setDetailOpen(true);
    const res = await fetch(`/api/mechanics?id=${mechanic.id}&detail=jobs`);
    if (res.ok) setJobs(await res.json());
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1B2D]">Mechanics</h1>
        <p className="text-sm text-muted-foreground">Maintenance team and work assignments</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Active Jobs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mechanics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No mechanics registered
                  </TableCell>
                </TableRow>
              ) : (
                mechanics.map((m) => (
                  <TableRow
                    key={m.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openDetail(m)}
                  >
                    <TableCell className="font-medium">{m.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{m.email}</TableCell>
                    <TableCell className="text-muted-foreground">{m.phone ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {m.activeJobs > 0 ? (
                        <Badge variant="outline" className="bg-orange-100 text-orange-700">
                          {m.activeJobs} active
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Idle</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mechanic Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.fullName}</DialogTitle>
                <DialogDescription>
                  {selected.email}{selected.phone ? ` — ${selected.phone}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-4 text-sm">
                <div className="rounded-lg bg-orange-50 px-3 py-2 text-center">
                  <p className="text-lg font-bold text-orange-600">{selected.activeJobs}</p>
                  <p className="text-xs text-muted-foreground">Active Jobs</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Assigned Maintenance Jobs</h3>
                {jobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No jobs assigned</p>
                ) : (
                  <div className="space-y-2">
                    {jobs.map((j) => (
                      <div key={j.id} className="rounded border p-3 text-sm space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{j.description}</p>
                          <Badge variant="outline" className={JOB_STATUS_BADGE[j.status] ?? ""}>
                            {j.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {j.aircraftReg && (
                            <span>{j.aircraftReg} ({j.aircraftModel})</span>
                          )}
                          {j.bay && <span>Bay {j.bay}</span>}
                          {j.estimatedStart && (
                            <span>
                              {new Date(j.estimatedStart).toLocaleDateString()}
                              {j.estimatedEnd ? ` – ${new Date(j.estimatedEnd).toLocaleDateString()}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
