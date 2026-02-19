"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Aircraft {
  id: string;
  registration: string;
  type: string;
  model: string;
  status: string;
  totalHours: number;
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

interface AircraftForm {
  registration: string;
  type: string;
  model: string;
  status: string;
  totalHours: number;
}

const EMPTY_FORM: AircraftForm = {
  registration: "",
  type: "",
  model: "",
  status: "available",
  totalHours: 0,
};

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

export default function AircraftPage() {
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(true);

  // Create/Edit
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AircraftForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Detail
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);

  const isAdmin = role === "admin";

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (data) setRole(data.role);
      }
      await fetchAircraft();
      setLoading(false);
    }
    init();
  }, []);

  async function fetchAircraft() {
    const res = await fetch("/api/aircraft");
    if (res.ok) setAircraftList(await res.json());
  }

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(ac: Aircraft) {
    setEditId(ac.id);
    setForm({
      registration: ac.registration,
      type: ac.type,
      model: ac.model,
      status: ac.status,
      totalHours: ac.totalHours,
    });
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSave() {
    setFormError(null);
    if (!form.registration || !form.type || !form.model) {
      setFormError("Registration, type, and model are required");
      return;
    }
    setSaving(true);

    const method = editId ? "PUT" : "POST";
    const body = editId ? { id: editId, ...form } : form;

    const res = await fetch("/api/aircraft", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error ?? "Failed");
      setSaving(false);
      return;
    }

    setSaving(false);
    setFormOpen(false);
    fetchAircraft();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/aircraft?id=${id}`, { method: "DELETE" });
    fetchAircraft();
  }

  async function openDetail(ac: Aircraft) {
    setSelectedAircraft(ac);
    setDetailOpen(true);

    const [schedRes, maintRes] = await Promise.all([
      fetch(`/api/aircraft?id=${ac.id}&detail=schedule`),
      fetch(`/api/aircraft?id=${ac.id}&detail=maintenance`),
    ]);

    if (schedRes.ok) setSchedule(await schedRes.json());
    if (maintRes.ok) setMaintenance(await maintRes.json());
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Aircraft</h1>
          <p className="text-sm text-muted-foreground">Fleet management</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="bg-[#1A6FB5] hover:bg-[#155d99]">
            <Plus className="h-4 w-4 mr-2" />
            Add Aircraft
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Registration</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                {isAdmin && <TableHead className="w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {aircraftList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground py-8">
                    No aircraft registered
                  </TableCell>
                </TableRow>
              ) : (
                aircraftList.map((ac) => (
                  <TableRow
                    key={ac.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openDetail(ac)}
                  >
                    <TableCell className="font-medium">{ac.registration}</TableCell>
                    <TableCell>{ac.type}</TableCell>
                    <TableCell>{ac.model}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_BADGE[ac.status] ?? ""}>
                        {STATUS_LABELS[ac.status] ?? ac.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{ac.totalHours.toLocaleString()}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ac)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(ac.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Aircraft" : "Add Aircraft"}</DialogTitle>
            <DialogDescription>
              {editId ? "Update aircraft details" : "Register a new aircraft"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formError && <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{formError}</p>}
            <div className="space-y-1.5">
              <Label htmlFor="reg">Registration (N Number)</Label>
              <Input id="reg" value={form.registration} onChange={(e) => setForm({ ...form, registration: e.target.value })} placeholder="N12345" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <Input id="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Single Engine" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="model">Model</Label>
                <Input id="model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Cessna 172" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hours">Total Hours</Label>
                <Input id="hours" type="number" value={form.totalHours} onChange={(e) => setForm({ ...form, totalHours: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#1A6FB5] hover:bg-[#155d99]">
              {saving ? "Saving..." : editId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedAircraft && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedAircraft.registration}</DialogTitle>
                <DialogDescription>
                  {selectedAircraft.type} — {selectedAircraft.model}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={STATUS_BADGE[selectedAircraft.status] ?? ""}>
                    {STATUS_LABELS[selectedAircraft.status]}
                  </Badge>
                  <span className="text-muted-foreground">{selectedAircraft.totalHours.toLocaleString()} hours</span>
                </div>
              </div>

              {/* Upcoming Schedule */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Upcoming Schedule</h3>
                {schedule.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming events</p>
                ) : (
                  <div className="space-y-2">
                    {schedule.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded border p-2 text-sm">
                        <div>
                          <p className="font-medium">{s.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">{s.type.replace("_", " ")}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Maintenance History */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Maintenance History</h3>
                {maintenance.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No maintenance records</p>
                ) : (
                  <div className="space-y-2">
                    {maintenance.map((m) => (
                      <div key={m.id} className="rounded border p-2 text-sm">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{m.description}</p>
                          <Badge variant="outline" className="text-xs">{m.status.replace("_", " ")}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {m.mechanicName ?? "Unassigned"}{m.bay ? ` — Bay ${m.bay}` : ""}
                        </p>
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
