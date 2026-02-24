"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const REMINDER_TYPES = [
  { value: "oil_change", label: "Oil Change" },
  { value: "elt", label: "ELT" },
  { value: "100_hour", label: "100 Hour Inspection" },
  { value: "annual", label: "Annual Inspection" },
  { value: "transponder", label: "Transponder" },
  { value: "pitot_static", label: "Pitot/Static" },
  { value: "registration", label: "Aircraft Registration" },
  { value: "custom", label: "Custom" },
];

interface ReminderFormData {
  id?: string;
  name: string;
  type: string;
  dueHours: string;
  warningHours: string;
  dueDate: string;
  warningDays: string;
  notes: string;
}

const EMPTY_FORM: ReminderFormData = {
  name: "",
  type: "custom",
  dueHours: "",
  warningHours: "10",
  dueDate: "",
  warningDays: "30",
  notes: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aircraftId: string;
  editData?: ReminderFormData | null;
  onSaved: () => void;
}

export function ReminderFormDialog({
  open,
  onOpenChange,
  aircraftId,
  editData,
  onSaved,
}: Props) {
  const [form, setForm] = useState<ReminderFormData>(editData ?? EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = !!editData?.id;

  function handleOpen(isOpen: boolean) {
    if (isOpen && !isEdit) {
      setForm(EMPTY_FORM);
      setError(null);
    }
    if (isOpen && editData) {
      setForm(editData);
      setError(null);
    }
    onOpenChange(isOpen);
  }

  async function handleSave() {
    setError(null);
    if (!form.name) {
      setError("Name is required");
      return;
    }
    if (!form.dueHours && !form.dueDate) {
      setError("Either due hours or due date is required");
      return;
    }

    setSaving(true);
    const method = isEdit ? "PUT" : "POST";
    const body = {
      ...(isEdit ? { id: editData!.id } : { aircraftId }),
      name: form.name,
      type: form.type,
      dueHours: form.dueHours ? parseFloat(form.dueHours) : null,
      warningHours: form.warningHours ? parseFloat(form.warningHours) : 10,
      dueDate: form.dueDate || null,
      warningDays: form.warningDays ? parseInt(form.warningDays) : 30,
      notes: form.notes || null,
    };

    const res = await fetch("/api/aircraft/reminders", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save");
      setSaving(false);
      return;
    }

    setSaving(false);
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Reminder" : "Add Reminder"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update maintenance reminder" : "Add a new maintenance reminder"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{error}</p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="50 Hour Oil Change"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rtype">Type</Label>
            <select
              id="rtype"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {REMINDER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dueHours">Due at Hours</Label>
              <Input
                id="dueHours"
                type="number"
                step="0.1"
                value={form.dueHours}
                onChange={(e) => setForm({ ...form, dueHours: e.target.value })}
                placeholder="3250.0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="warningHours">Warning (hrs before)</Label>
              <Input
                id="warningHours"
                type="number"
                step="0.1"
                value={form.warningHours}
                onChange={(e) => setForm({ ...form, warningHours: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="warningDays">Warning (days before)</Label>
              <Input
                id="warningDays"
                type="number"
                value={form.warningDays}
                onChange={(e) => setForm({ ...form, warningDays: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1A6FB5] hover:bg-[#155d99]"
          >
            {saving ? "Saving..." : isEdit ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
