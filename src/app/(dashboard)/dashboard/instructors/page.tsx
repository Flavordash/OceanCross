"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Plus, Search, X } from "lucide-react";

// ── Types ──────────────────────────────────────────────

interface Instructor {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  teachingHours: number;
  isAuthorized: boolean;
  cfiExpiration: string | null;
  specialties: { name: string; hourlyRate: number }[];
  recentFlight: {
    id: string;
    title: string;
    startTime: string;
    type: string;
  } | null;
  rateRange: { min: number; max: number } | null;
}

// ── Component ──────────────────────────────────────────

export default function InstructorsPage() {
  const router = useRouter();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [search, setSearch] = useState("");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: "", email: "", phone: "" });
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const res = await fetch("/api/instructors");
    if (res.ok) setInstructors(await res.json());
    setLoading(false);
  }

  async function handleCreate() {
    setCreateError(null);
    if (!createForm.fullName || !createForm.email) {
      setCreateError("Name and email are required");
      return;
    }
    setCreating(true);

    const res = await fetch("/api/instructors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });

    if (!res.ok) {
      const data = await res.json();
      setCreateError(data.error ?? "Failed");
      setCreating(false);
      return;
    }

    setCreating(false);
    setCreateOpen(false);
    setCreateForm({ fullName: "", email: "", phone: "" });
    loadData();
  }

  function getAuthStatus(inst: Instructor) {
    if (!inst.isAuthorized) return { label: "Inactive", color: "bg-gray-100 text-gray-600" };
    if (!inst.cfiExpiration) return { label: "Active", color: "bg-green-100 text-green-700" };
    const expired = new Date(inst.cfiExpiration) < new Date();
    return expired
      ? { label: "Expired", color: "bg-red-100 text-red-700" }
      : { label: "Active", color: "bg-green-100 text-green-700" };
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
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Instructors</h1>
          <p className="text-sm text-muted-foreground">Flight instructors and teaching records</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, specialty..."
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
            setCreateError(null);
            setCreateOpen(true);
          }}
          className="bg-[#1A6FB5] hover:bg-[#155d99]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Instructor
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialties</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Authorization</TableHead>
                <TableHead>Recent Flight</TableHead>
                <TableHead className="text-right">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                const filtered = instructors.filter((inst) => {
                  if (!search) return true;
                  const q = search.toLowerCase();
                  return (
                    inst.fullName.toLowerCase().includes(q) ||
                    inst.email.toLowerCase().includes(q) ||
                    (inst.phone?.toLowerCase().includes(q) ?? false) ||
                    inst.specialties.some((s) => s.name.toLowerCase().includes(q))
                  );
                });
                if (filtered.length === 0) return (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {search ? "No results found" : "No instructors registered"}
                    </TableCell>
                  </TableRow>
                );
                return filtered.map((inst) => {
                  const auth = getAuthStatus(inst);
                  return (
                    <TableRow
                      key={inst.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/dashboard/instructors/${inst.id}`)}
                    >
                      <TableCell className="font-medium">{inst.fullName}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {inst.specialties.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            inst.specialties.map((s) => (
                              <Badge key={s.name} variant="secondary" className="text-xs">
                                {s.name}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{inst.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={auth.color}>
                          {auth.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {inst.recentFlight ? (
                          <span className="text-sm">
                            {new Date(inst.recentFlight.startTime).toLocaleDateString()} — {inst.recentFlight.title}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {inst.rateRange ? (
                          <span className="text-sm font-medium">
                            ${inst.rateRange.min === inst.rateRange.max
                              ? inst.rateRange.min
                              : `${inst.rateRange.min}–${inst.rateRange.max}`}/hr
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                });
              })()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Create Instructor Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Instructor</DialogTitle>
            <DialogDescription>Register a new flight instructor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {createError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{createError}</p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={createForm.fullName}
                onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="jane@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="(305) 555-0100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-[#1A6FB5] hover:bg-[#155d99]"
            >
              {creating ? "Creating..." : "Add Instructor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
