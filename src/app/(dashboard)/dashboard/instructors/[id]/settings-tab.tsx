"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Pencil, Trash2, X } from "lucide-react";

// ── Types ──────────────────────────────────────────────

interface Settings {
  cfiNumber: string;
  cfiExpiration: string;
  isAuthorized: boolean;
  notes: string;
}

interface Specialty {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  specialtyId: string;
  specialtyName: string;
  hourlyRate: number;
}

// ── Component ──────────────────────────────────────────

export default function SettingsTab({ instructorId }: { instructorId: string }) {
  // CFI Settings
  const [settings, setSettings] = useState<Settings>({
    cfiNumber: "",
    cfiExpiration: "",
    isAuthorized: true,
    notes: "",
  });
  const [editingCfi, setEditingCfi] = useState(false);
  const [cfiForm, setCfiForm] = useState<Settings>(settings);
  const [savingCfi, setSavingCfi] = useState(false);

  // Specialties catalog
  const [allSpecialties, setAllSpecialties] = useState<Specialty[]>([]);
  const [newSpecialtyName, setNewSpecialtyName] = useState("");
  const [addingSpecialty, setAddingSpecialty] = useState(false);

  // Assignments (per instructor)
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ specialtyId: "", hourlyRate: "" });
  const [assigningSpecialty, setAssigningSpecialty] = useState(false);

  // Inline rate editing
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editingRateValue, setEditingRateValue] = useState("");

  useEffect(() => {
    loadAll();
  }, [instructorId]);

  async function loadAll() {
    const [settingsRes, specialtiesRes, assignmentsRes] = await Promise.all([
      fetch(`/api/instructors/settings?profileId=${instructorId}`),
      fetch("/api/instructors/specialties"),
      fetch(`/api/instructors/assignments?profileId=${instructorId}`),
    ]);

    if (settingsRes.ok) {
      const data = await settingsRes.json();
      if (data) {
        const s: Settings = {
          cfiNumber: data.cfiNumber ?? "",
          cfiExpiration: data.cfiExpiration ? data.cfiExpiration.split("T")[0] : "",
          isAuthorized: data.isAuthorized ?? true,
          notes: data.notes ?? "",
        };
        setSettings(s);
        setCfiForm(s);
      }
    }

    if (specialtiesRes.ok) setAllSpecialties(await specialtiesRes.json());
    if (assignmentsRes.ok) setAssignments(await assignmentsRes.json());
  }

  // ── CFI Settings ─────────────────────────────────────

  async function handleSaveCfi() {
    setSavingCfi(true);
    await fetch("/api/instructors/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: instructorId, ...cfiForm }),
    });
    setSettings(cfiForm);
    setEditingCfi(false);
    setSavingCfi(false);
  }

  // ── Specialty Catalog (Admin) ─────────────────────────

  async function handleAddGlobalSpecialty() {
    if (!newSpecialtyName.trim()) return;
    setAddingSpecialty(true);

    const res = await fetch("/api/instructors/specialties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSpecialtyName.trim() }),
    });

    if (res.ok) {
      const specialty = await res.json();
      setAllSpecialties((prev) => [...prev, specialty]);
      setNewSpecialtyName("");
    }
    setAddingSpecialty(false);
  }

  async function handleDeleteGlobalSpecialty(id: string) {
    await fetch(`/api/instructors/specialties?id=${id}`, { method: "DELETE" });
    setAllSpecialties((prev) => prev.filter((s) => s.id !== id));
    setAssignments((prev) => prev.filter((a) => a.specialtyId !== id));
  }

  // ── Assignments (per instructor) ──────────────────────

  async function handleAssignSpecialty() {
    if (!assignForm.specialtyId) return;
    setAssigningSpecialty(true);

    const res = await fetch("/api/instructors/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instructorId,
        specialtyId: assignForm.specialtyId,
        hourlyRate: parseFloat(assignForm.hourlyRate) || 0,
      }),
    });

    if (res.ok) {
      setAssignDialogOpen(false);
      setAssignForm({ specialtyId: "", hourlyRate: "" });
      // Reload assignments to get specialtyName
      const aRes = await fetch(`/api/instructors/assignments?profileId=${instructorId}`);
      if (aRes.ok) setAssignments(await aRes.json());
    }
    setAssigningSpecialty(false);
  }

  async function handleUpdateRate(id: string) {
    await fetch("/api/instructors/assignments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, hourlyRate: parseFloat(editingRateValue) || 0 }),
    });
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, hourlyRate: parseFloat(editingRateValue) || 0 } : a
      )
    );
    setEditingRateId(null);
  }

  async function handleRemoveAssignment(id: string) {
    await fetch(`/api/instructors/assignments?id=${id}`, { method: "DELETE" });
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }

  // Available specialties (not yet assigned)
  const assignedIds = new Set(assignments.map((a) => a.specialtyId));
  const availableSpecialties = allSpecialties.filter((s) => !assignedIds.has(s.id));

  return (
    <div className="space-y-6">
      {/* ── Section A: CFI Information ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">CFI Information</CardTitle>
            {!editingCfi ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCfiForm(settings);
                  setEditingCfi(true);
                }}
              >
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingCfi(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveCfi}
                  disabled={savingCfi}
                  className="bg-[#1A6FB5] hover:bg-[#155d99]"
                >
                  {savingCfi ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">CFI Number</Label>
              {editingCfi ? (
                <Input
                  value={cfiForm.cfiNumber}
                  onChange={(e) => setCfiForm({ ...cfiForm, cfiNumber: e.target.value })}
                  placeholder="e.g. 1234567"
                />
              ) : (
                <p className="text-sm font-medium">{settings.cfiNumber || "—"}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">CFI Expiration</Label>
              {editingCfi ? (
                <Input
                  type="date"
                  value={cfiForm.cfiExpiration}
                  onChange={(e) => setCfiForm({ ...cfiForm, cfiExpiration: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium">
                  {settings.cfiExpiration || "—"}
                  {settings.cfiExpiration && new Date(settings.cfiExpiration) < new Date() && (
                    <Badge variant="outline" className="ml-2 bg-red-100 text-red-700">Expired</Badge>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Authorization Status</Label>
            {editingCfi ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cfiForm.isAuthorized}
                  onChange={(e) => setCfiForm({ ...cfiForm, isAuthorized: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">Authorized to instruct</span>
              </label>
            ) : (
              <div>
                {settings.isAuthorized ? (
                  <Badge variant="outline" className="bg-green-100 text-green-700">Authorized</Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100 text-red-700">Not Authorized</Badge>
                )}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notes</Label>
            {editingCfi ? (
              <textarea
                value={cfiForm.notes}
                onChange={(e) => setCfiForm({ ...cfiForm, notes: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Additional notes..."
              />
            ) : (
              <p className="text-sm">{settings.notes || "—"}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Section B: Teaching Specialties & Rates ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Teaching Specialties & Rates</CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setAssignForm({ specialtyId: "", hourlyRate: "" });
                setAssignDialogOpen(true);
              }}
              disabled={availableSpecialties.length === 0}
              className="bg-[#1A6FB5] hover:bg-[#155d99]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Specialty
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Specialty</TableHead>
                <TableHead className="text-right">Hourly Rate</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                    No specialties assigned
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.specialtyName}</TableCell>
                    <TableCell className="text-right">
                      {editingRateId === a.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-sm">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={editingRateValue}
                            onChange={(e) => setEditingRateValue(e.target.value)}
                            className="w-24 h-8 text-right"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateRate(a.id);
                              if (e.key === "Escape") setEditingRateId(null);
                            }}
                            autoFocus
                          />
                          <span className="text-sm text-muted-foreground">/hr</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleUpdateRate(a.id)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setEditingRateId(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm">${a.hourlyRate.toFixed(2)}/hr</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingRateId !== a.id && (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingRateId(a.id);
                              setEditingRateValue(String(a.hourlyRate));
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleRemoveAssignment(a.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Section C: Manage Specialty Categories (Global) ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Manage Specialty Categories</CardTitle>
          <p className="text-xs text-muted-foreground">
            Global catalog of specialties available for all instructors
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {allSpecialties.map((s) => (
              <div
                key={s.id}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
              >
                {s.name}
                <button
                  type="button"
                  onClick={() => handleDeleteGlobalSpecialty(s.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {allSpecialties.length === 0 && (
              <p className="text-sm text-muted-foreground">No specialties created yet</p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newSpecialtyName}
              onChange={(e) => setNewSpecialtyName(e.target.value)}
              placeholder="New specialty name"
              className="max-w-xs"
              onKeyDown={(e) => e.key === "Enter" && handleAddGlobalSpecialty()}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddGlobalSpecialty}
              disabled={addingSpecialty || !newSpecialtyName.trim()}
            >
              {addingSpecialty ? "Adding..." : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Assign Specialty Dialog ── */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Specialty</DialogTitle>
            <DialogDescription>Assign a teaching specialty with hourly rate</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Specialty</Label>
              <select
                value={assignForm.specialtyId}
                onChange={(e) => setAssignForm({ ...assignForm, specialtyId: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select specialty...</option>
                {availableSpecialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Hourly Rate ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={assignForm.hourlyRate}
                onChange={(e) => setAssignForm({ ...assignForm, hourlyRate: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignSpecialty}
              disabled={assigningSpecialty || !assignForm.specialtyId}
              className="bg-[#1A6FB5] hover:bg-[#155d99]"
            >
              {assigningSpecialty ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
