"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  AircraftFormDialog,
  AircraftFormData,
  EMPTY_AIRCRAFT_FORM,
} from "@/components/aircraft/aircraft-form-dialog";

interface Aircraft {
  id: string;
  registration: string;
  type: string;
  model: string;
  status: string;
  totalHours: number;
  hobbsHours: number;
  tachHours: number;
  year: number | null;
  emptyWeight: number | null;
  maxTakeoffWeight: number | null;
  usefulLoad: number | null;
  maxPassengers: number | null;
  luggageCapacityLbs: number | null;
  fuelCapacityGallons: number | null;
  fuelUsableGallons: number | null;
  fuelWeightLbs: number | null;
  fuelPerWingGallons: number | null;
  oilCapacityQuarts: string | null;
  maxEnduranceHours: number | null;
  notes: string | null;
}

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
  const [form, setForm] = useState<AircraftFormData>(EMPTY_AIRCRAFT_FORM);
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
    setForm(EMPTY_AIRCRAFT_FORM);
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
      year: ac.year ?? null,
      emptyWeight: ac.emptyWeight ?? null,
      maxTakeoffWeight: ac.maxTakeoffWeight ?? null,
      usefulLoad: ac.usefulLoad ?? null,
      maxPassengers: ac.maxPassengers ?? null,
      luggageCapacityLbs: ac.luggageCapacityLbs ?? null,
      fuelCapacityGallons: ac.fuelCapacityGallons ?? null,
      fuelUsableGallons: ac.fuelUsableGallons ?? null,
      fuelWeightLbs: ac.fuelWeightLbs ?? null,
      fuelPerWingGallons: ac.fuelPerWingGallons ?? null,
      oilCapacityQuarts: ac.oilCapacityQuarts ?? "",
      maxEnduranceHours: ac.maxEnduranceHours ?? null,
      notes: ac.notes ?? "",
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

    try {
      const method = editId ? "PUT" : "POST";
      const body = editId ? { id: editId, ...form } : form;

      const res = await fetch("/api/aircraft", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error ?? `Save failed (${res.status})`);
        return;
      }

      setFormOpen(false);
      fetchAircraft();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
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

      <AircraftFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editId={editId}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        saving={saving}
        error={formError}
      />
    </div>
  );
}
