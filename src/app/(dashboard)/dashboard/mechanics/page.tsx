"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, X, Plus } from "lucide-react";

interface Mechanic {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  activeJobs: number;
}

export default function MechanicsPage() {
  const router = useRouter();
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add Mechanic dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadMechanics();
  }, []);

  async function loadMechanics() {
    const res = await fetch("/api/mechanics");
    if (res.ok) setMechanics(await res.json());
    setLoading(false);
  }

  async function handleAdd() {
    if (!form.fullName || !form.email) return;
    setSaving(true);
    setFormError("");

    const res = await fetch("/api/mechanics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(data.error ?? "Failed to add mechanic");
      setSaving(false);
      return;
    }

    setSaving(false);
    setDialogOpen(false);
    setForm({ fullName: "", email: "", phone: "" });
    loadMechanics();
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Mechanics</h1>
          <p className="text-sm text-muted-foreground">Maintenance team and work assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email..."
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
            onClick={() => {
              setForm({ fullName: "", email: "", phone: "" });
              setFormError("");
              setDialogOpen(true);
            }}
            className="bg-[#1A6FB5] hover:bg-[#155d99]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Mechanic
          </Button>
        </div>
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
              {(() => {
                const filtered = mechanics.filter((m) => {
                  if (!search) return true;
                  const q = search.toLowerCase();
                  return (
                    m.fullName.toLowerCase().includes(q) ||
                    m.email.toLowerCase().includes(q) ||
                    (m.phone?.toLowerCase().includes(q) ?? false)
                  );
                });
                if (filtered.length === 0) return (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {search ? "No results found" : "No mechanics registered"}
                    </TableCell>
                  </TableRow>
                );
                return filtered.map((m) => (
                  <TableRow
                    key={m.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/dashboard/mechanics/${m.id}`)}
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
                ));
              })()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Mechanic Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Mechanic</DialogTitle>
            <DialogDescription>Add a new mechanic to the maintenance team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAdd}
              disabled={saving || !form.fullName || !form.email}
              className="bg-[#1A6FB5] hover:bg-[#155d99]"
            >
              {saving ? "Adding..." : "Add Mechanic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
