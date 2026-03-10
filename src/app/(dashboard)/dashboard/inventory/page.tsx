"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Search,
  X,
  Plus,
  Pencil,
  Trash2,
  Upload,
  FileText,
  Loader2,
} from "lucide-react";

interface PartsOrder {
  id: string;
  partName: string;
  supplier: string | null;
  status: string;
  orderDate: string;
  estimatedArrival: string | null;
  actualArrival: string | null;
  jobId: string | null;
  jobDescription: string | null;
  aircraftRegistration: string | null;
}

interface MaintenanceJob {
  id: string;
  description: string;
  status: string;
  aircraftRegistration: string | null;
}

interface OrderForm {
  partName: string;
  supplier: string;
  jobId: string;
  orderDate: string;
  estimatedArrival: string;
}

const EMPTY_FORM: OrderForm = {
  partName: "",
  supplier: "",
  jobId: "",
  orderDate: new Date().toISOString().split("T")[0],
  estimatedArrival: "",
};

const STATUS_BADGE: Record<string, string> = {
  ordered: "bg-yellow-100 text-yellow-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
};

export default function InventoryPage() {
  const [orders, setOrders] = useState<PartsOrder[]>([]);
  const [jobs, setJobs] = useState<MaintenanceJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<OrderForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Invoice upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const res = await fetch("/api/inventory");
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }

  async function loadJobs() {
    const res = await fetch("/api/maintenance");
    if (res.ok) setJobs(await res.json());
  }

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    loadJobs();
    setFormOpen(true);
  }

  function openEdit(e: React.MouseEvent, order: PartsOrder) {
    e.stopPropagation();
    setEditId(order.id);
    setForm({
      partName: order.partName,
      supplier: order.supplier ?? "",
      jobId: order.jobId ?? "",
      orderDate: order.orderDate
        ? new Date(order.orderDate).toISOString().split("T")[0]
        : "",
      estimatedArrival: order.estimatedArrival
        ? new Date(order.estimatedArrival).toISOString().split("T")[0]
        : "",
    });
    setFormError(null);
    loadJobs();
    setFormOpen(true);
  }

  async function handleSave() {
    setFormError(null);
    if (!form.partName.trim()) {
      setFormError("Part name is required");
      return;
    }
    setSaving(true);

    const method = editId ? "PUT" : "POST";
    const body: Record<string, unknown> = {
      partName: form.partName,
      supplier: form.supplier || null,
      jobId: form.jobId || null,
      orderDate: form.orderDate || null,
      estimatedArrival: form.estimatedArrival || null,
    };
    if (editId) body.id = editId;

    const res = await fetch("/api/inventory", {
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
    loadOrders();
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await fetch(`/api/inventory?id=${id}`, { method: "DELETE" });
    loadOrders();
  }

  async function handleStatusChange(id: string, newStatus: string) {
    await fetch("/api/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    loadOrders();
  }

  // Invoice upload
  const handleFile = useCallback((f: File) => {
    setUploadFile(f);
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

  async function handleExtractInvoice() {
    if (!uploadFile) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("type", "parts");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) return;

      const data = await res.json();
      const ex = data.extracted;

      // Pre-fill the add order form with extracted data
      setUploadOpen(false);
      setUploadFile(null);

      setEditId(null);
      setForm({
        partName: ex.part_name ?? ex.partName ?? "",
        supplier: ex.supplier ?? "",
        jobId: "",
        orderDate: ex.order_date
          ? new Date(ex.order_date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        estimatedArrival: ex.estimated_arrival
          ? new Date(ex.estimated_arrival).toISOString().split("T")[0]
          : "",
      });
      setFormError(null);
      loadJobs();
      setFormOpen(true);
    } catch {
      // silently fail
    } finally {
      setUploading(false);
    }
  }

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.partName.toLowerCase().includes(q) ||
      (o.supplier?.toLowerCase().includes(q) ?? false) ||
      (o.aircraftRegistration?.toLowerCase().includes(q) ?? false)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Parts orders and supplies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search parts, supplier..."
              className="pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setUploadFile(null);
              setUploadOpen(true);
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Invoice
          </Button>
          <Button
            onClick={openCreate}
            className="bg-[#1A6FB5] hover:bg-[#155d99]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Order
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part Name</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Est. Arrival</TableHead>
                <TableHead>Aircraft</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    {search ? "No results found" : "No parts orders"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.partName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.supplier ?? "—"}
                    </TableCell>
                    <TableCell>
                      <select
                        value={o.status}
                        onChange={(e) =>
                          handleStatusChange(o.id, e.target.value)
                        }
                        className="text-xs rounded border px-1.5 py-0.5"
                      >
                        <option value="ordered">Ordered</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(o.orderDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.estimatedArrival
                        ? new Date(o.estimatedArrival).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.aircraftRegistration ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => openEdit(e, o)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => handleDelete(e, o.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Order Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit Order" : "Add Parts Order"}
            </DialogTitle>
            <DialogDescription>
              {editId ? "Update order details" : "Create a new parts order"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">
                {formError}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="partName">Part Name</Label>
              <Input
                id="partName"
                value={form.partName}
                onChange={(e) =>
                  setForm({ ...form, partName: e.target.value })
                }
                placeholder="Oil Filter, Spark Plug..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={form.supplier}
                onChange={(e) =>
                  setForm({ ...form, supplier: e.target.value })
                }
                placeholder="Aircraft Spruce, etc."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jobId">
                Maintenance Job{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <select
                id="jobId"
                value={form.jobId}
                onChange={(e) =>
                  setForm({ ...form, jobId: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">None</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.aircraftRegistration
                      ? `${j.aircraftRegistration} — `
                      : ""}
                    {j.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="orderDate">Order Date</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={form.orderDate}
                  onChange={(e) =>
                    setForm({ ...form, orderDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="estArrival">Est. Arrival</Label>
                <Input
                  id="estArrival"
                  type="date"
                  value={form.estimatedArrival}
                  onChange={(e) =>
                    setForm({ ...form, estimatedArrival: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1A6FB5] hover:bg-[#155d99]"
            >
              {saving ? "Saving..." : editId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Invoice Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Invoice</DialogTitle>
            <DialogDescription>
              Upload a parts invoice to auto-extract order details
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex items-center justify-center rounded-md border border-dashed p-8 transition-colors ${
                dragOver
                  ? "border-[#1A6FB5] bg-blue-50"
                  : uploadFile
                    ? "border-green-400 bg-green-50"
                    : "border-slate-300 hover:border-slate-400"
              }`}
            >
              {uploadFile ? (
                <div className="flex flex-col items-center gap-3 text-sm">
                  <FileText className="h-8 w-8 text-green-600" />
                  <span className="truncate max-w-[250px]">
                    {uploadFile.name}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleExtractInvoice}
                      disabled={uploading}
                      className="bg-[#1A6FB5] hover:bg-[#155d99]"
                    >
                      {uploading ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : null}
                      Extract & Fill
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadFile(null)}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-2 text-sm text-muted-foreground">
                  <Upload className="h-6 w-6" />
                  Drop invoice PDF/image or click to browse
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
