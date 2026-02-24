"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  hobbsHours: number;
  tachHours: number;
}

interface AircraftForm {
  registration: string;
  type: string;
  model: string;
  status: string;
  totalHours: number;
  hobbsHours: number;
  tachHours: number;
}

const EMPTY_FORM: AircraftForm = {
  registration: "",
  type: "",
  model: "",
  status: "available",
  totalHours: 0,
  hobbsHours: 0,
  tachHours: 0,
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
  const router = useRouter();
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AircraftForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  function openEdit(e: React.MouseEvent, ac: Aircraft) {
    e.stopPropagation();
    setEditId(ac.id);
    setForm({
      registration: ac.registration,
      type: ac.type,
      model: ac.model,
      status: ac.status,
      totalHours: ac.totalHours,
      hobbsHours: ac.hobbsHours ?? 0,
      tachHours: ac.tachHours ?? 0,
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

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await fetch(`/api/aircraft?id=${id}`, { method: "DELETE" });
    fetchAircraft();
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
                <TableHead className="text-right">Hobbs</TableHead>
                <TableHead className="text-right">Tach</TableHead>
                {isAdmin && <TableHead className="w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {aircraftList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="text-center text-muted-foreground py-8">
                    No aircraft registered
                  </TableCell>
                </TableRow>
              ) : (
                aircraftList.map((ac) => (
                  <TableRow
                    key={ac.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/dashboard/aircraft/${ac.id}`)}
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
                    <TableCell className="text-right">{(ac.hobbsHours ?? 0).toFixed(1)}</TableCell>
                    <TableCell className="text-right">{(ac.tachHours ?? 0).toFixed(1)}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => openEdit(e, ac)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => handleDelete(e, ac.id)}>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="hobbs">Hobbs Hours</Label>
                <Input id="hobbs" type="number" step="0.1" value={form.hobbsHours} onChange={(e) => setForm({ ...form, hobbsHours: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tach">Tach Hours</Label>
                <Input id="tach" type="number" step="0.1" value={form.tachHours} onChange={(e) => setForm({ ...form, tachHours: parseFloat(e.target.value) || 0 })} />
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
    </div>
  );
}
