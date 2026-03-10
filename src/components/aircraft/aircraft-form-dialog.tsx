"use client";

import { useCallback, useState } from "react";
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
import { Search, Loader2, Upload, FileText } from "lucide-react";

// ── Types ──

export interface AircraftFormData {
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
  oilCapacityQuarts: string;
  maxEnduranceHours: number | null;
  notes: string;
}

export const EMPTY_AIRCRAFT_FORM: AircraftFormData = {
  registration: "",
  type: "",
  model: "",
  status: "available",
  totalHours: 0,
  hobbsHours: 0,
  tachHours: 0,
  year: null,
  emptyWeight: null,
  maxTakeoffWeight: null,
  usefulLoad: null,
  maxPassengers: null,
  luggageCapacityLbs: null,
  fuelCapacityGallons: null,
  fuelUsableGallons: null,
  fuelWeightLbs: null,
  fuelPerWingGallons: null,
  oilCapacityQuarts: "",
  maxEnduranceHours: null,
  notes: "",
};

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  in_maintenance: "In Maintenance",
  grounded: "Grounded",
};

// ── Helpers ──

function NumField({
  label,
  value,
  onChange,
  placeholder,
  step,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        step={step}
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : parseFloat(v));
        }}
        placeholder={placeholder}
        className="h-8 text-sm"
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-sm"
      />
    </div>
  );
}

// ── Component ──

interface AircraftFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId: string | null;
  form: AircraftFormData;
  setForm: (f: AircraftFormData) => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}

export function AircraftFormDialog({
  open,
  onOpenChange,
  editId,
  form,
  setForm,
  onSave,
  saving,
  error,
}: AircraftFormDialogProps) {
  const [faaLoading, setFaaLoading] = useState(false);
  const [faaError, setFaaError] = useState<string | null>(null);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // FAA Lookup
  async function handleFAALookup() {
    const reg = form.registration.trim();
    if (!reg) return;
    setFaaLoading(true);
    setFaaError(null);

    try {
      const res = await fetch(`/api/faa?n=${encodeURIComponent(reg)}`);
      if (!res.ok) {
        const d = await res.json();
        setFaaError(d.error ?? "Not found");
        return;
      }
      const data = await res.json();
      if (data.message) setFaaError(data.message);

      setForm({
        ...form,
        registration: data.registration ?? form.registration,
        model: data.model
          ? `${data.manufacturer ?? ""} ${data.model}`.trim()
          : form.model,
        type: data.type_aircraft || form.type,
        year:
          data.year && data.year !== "None"
            ? parseInt(data.year) || form.year
            : form.year,
        notes: [
          form.notes,
          data.owner_name ? `Owner: ${data.owner_name}` : "",
          data.engine_manufacturer && data.engine_model
            ? `Engine: ${data.engine_manufacturer} ${data.engine_model}`
            : "",
          data.serial_number ? `S/N: ${data.serial_number}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch {
      setFaaError("FAA lookup failed");
    } finally {
      setFaaLoading(false);
    }
  }

  // File handling
  const handleFile = useCallback((f: File) => {
    setUploadFile(f);
    setExtracted(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  // Extract data from uploaded document
  async function handleExtract() {
    if (!uploadFile) return;
    setUploading(true);
    setExtractError(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("type", "aircraft");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setExtractError(errData.error ?? `Upload failed (${res.status})`);
        return;
      }

      const data = await res.json();
      const ex = data.extracted;

      // Check if anything was actually extracted
      const hasData = Object.values(ex).some(
        (v) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0) && !(typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0)
      );

      if (!hasData) {
        setExtractError("No data could be extracted from this file. Try a different format or enter values manually.");
        return;
      }

      setForm({
        ...form,
        registration: ex.registration ?? form.registration,
        model: ex.model ?? form.model,
        year: ex.year ?? form.year,
        emptyWeight: ex.empty_weight ?? form.emptyWeight,
        maxTakeoffWeight: ex.max_takeoff_weight ?? form.maxTakeoffWeight,
        usefulLoad: ex.useful_load ?? form.usefulLoad,
        maxPassengers: ex.max_passengers ?? form.maxPassengers,
        luggageCapacityLbs: ex.luggage_capacity_lbs ?? form.luggageCapacityLbs,
        fuelCapacityGallons:
          ex.fuel_capacity_gallons ?? form.fuelCapacityGallons,
        fuelUsableGallons: ex.fuel_usable_gallons ?? form.fuelUsableGallons,
        fuelWeightLbs: ex.fuel_weight_lbs ?? form.fuelWeightLbs,
        fuelPerWingGallons: ex.fuel_per_wing_gallons ?? form.fuelPerWingGallons,
        oilCapacityQuarts: ex.oil_capacity_quarts ?? form.oilCapacityQuarts,
        maxEnduranceHours: ex.max_endurance_hours ?? form.maxEnduranceHours,
      });
      setExtracted(true);
    } catch {
      setExtractError("Extraction failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editId ? "Edit Aircraft" : "Add Aircraft"}
          </DialogTitle>
          <DialogDescription>
            {editId
              ? "Update aircraft details"
              : "Register a new aircraft. Use FAA lookup or upload a W&B document to auto-fill."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">
              {error}
            </p>
          )}

          {/* ── Basic Info ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Basic Info
            </p>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Registration (N Number)
                </Label>
                <Input
                  value={form.registration}
                  onChange={(e) =>
                    setForm({ ...form, registration: e.target.value })
                  }
                  placeholder="N12345"
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={handleFAALookup}
                  disabled={faaLoading || !form.registration.trim()}
                >
                  {faaLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Search className="h-3.5 w-3.5" />
                  )}
                  <span className="ml-1.5">FAA</span>
                </Button>
              </div>
            </div>
            {faaError && (
              <p className="text-xs text-amber-600">{faaError}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Type"
                value={form.type}
                onChange={(v) => setForm({ ...form, type: v })}
                placeholder="Single Engine"
              />
              <TextField
                label="Model"
                value={form.model}
                onChange={(v) => setForm({ ...form, model: v })}
                placeholder="Cessna 172S"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumField
                label="Year"
                value={form.year}
                onChange={(v) => setForm({ ...form, year: v })}
                placeholder="2001"
              />
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Flight Hours ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Flight Hours
            </p>
            <div className="grid grid-cols-3 gap-3">
              <NumField
                label="Total Hours"
                value={form.totalHours}
                onChange={(v) =>
                  setForm({ ...form, totalHours: v ?? 0 })
                }
                placeholder="0"
              />
              <NumField
                label="Hobbs"
                value={form.hobbsHours}
                onChange={(v) =>
                  setForm({ ...form, hobbsHours: v ?? 0 })
                }
                step="0.1"
                placeholder="0.0"
              />
              <NumField
                label="Tach"
                value={form.tachHours}
                onChange={(v) =>
                  setForm({ ...form, tachHours: v ?? 0 })
                }
                step="0.1"
                placeholder="0.0"
              />
            </div>
          </div>

          {/* ── Weight & Balance ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Weight & Balance
            </p>
            <div className="grid grid-cols-2 gap-3">
              <NumField
                label="Empty Weight (lbs)"
                value={form.emptyWeight}
                onChange={(v) => setForm({ ...form, emptyWeight: v })}
                placeholder="1665"
              />
              <NumField
                label="Max Takeoff Weight (lbs)"
                value={form.maxTakeoffWeight}
                onChange={(v) =>
                  setForm({ ...form, maxTakeoffWeight: v })
                }
                placeholder="2550"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <NumField
                label="Useful Load (lbs)"
                value={form.usefulLoad}
                onChange={(v) => setForm({ ...form, usefulLoad: v })}
                placeholder="885"
              />
              <NumField
                label="Max Passengers"
                value={form.maxPassengers}
                onChange={(v) =>
                  setForm({ ...form, maxPassengers: v })
                }
                placeholder="3"
              />
              <NumField
                label="Luggage (lbs)"
                value={form.luggageCapacityLbs}
                onChange={(v) =>
                  setForm({ ...form, luggageCapacityLbs: v })
                }
                placeholder="120"
              />
            </div>
          </div>

          {/* ── Fuel ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Fuel
            </p>
            <div className="grid grid-cols-2 gap-3">
              <NumField
                label="Capacity (gal)"
                value={form.fuelCapacityGallons}
                onChange={(v) =>
                  setForm({ ...form, fuelCapacityGallons: v })
                }
                placeholder="56"
              />
              <NumField
                label="Usable (gal)"
                value={form.fuelUsableGallons}
                onChange={(v) =>
                  setForm({ ...form, fuelUsableGallons: v })
                }
                placeholder="53"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumField
                label="Fuel Weight (lbs)"
                value={form.fuelWeightLbs}
                onChange={(v) =>
                  setForm({ ...form, fuelWeightLbs: v })
                }
                placeholder="318"
              />
              <NumField
                label="Per Wing (gal)"
                value={form.fuelPerWingGallons}
                onChange={(v) =>
                  setForm({ ...form, fuelPerWingGallons: v })
                }
                placeholder="28"
              />
            </div>
          </div>

          {/* ── Other ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Other
            </p>
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Oil Capacity"
                value={form.oilCapacityQuarts}
                onChange={(v) =>
                  setForm({ ...form, oilCapacityQuarts: v })
                }
                placeholder="6-8 qts"
              />
              <NumField
                label="Max Endurance (hrs)"
                value={form.maxEnduranceHours}
                onChange={(v) =>
                  setForm({ ...form, maxEnduranceHours: v })
                }
                step="0.1"
                placeholder="4.5"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          {/* ── Document Upload ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                W&B Document
              </p>
              <span className="text-xs text-muted-foreground">(optional)</span>
              {extracted && (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                  Auto-filled
                </Badge>
              )}
            </div>
            {extractError && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-md p-2">{extractError}</p>
            )}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex items-center justify-center rounded-md border border-dashed p-4 transition-colors ${
                dragOver
                  ? "border-[#1A6FB5] bg-blue-50"
                  : uploadFile
                    ? "border-green-400 bg-green-50"
                    : "border-slate-300 hover:border-slate-400"
              }`}
            >
              {uploadFile ? (
                <div className="flex items-center gap-3 text-sm">
                  <FileText className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="truncate max-w-[200px]">
                    {uploadFile.name}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleExtract}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : null}
                    Extract
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setUploadFile(null);
                      setExtracted(false);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  Drop W&B PDF/image or click to browse
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={saving}
            className="bg-[#1A6FB5] hover:bg-[#155d99]"
          >
            {saving ? "Saving..." : editId ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
