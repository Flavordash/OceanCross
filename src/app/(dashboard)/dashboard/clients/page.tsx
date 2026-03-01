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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

// ── Types ──────────────────────────────────────────────

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Client {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  totalHours: number;
  tags: Tag[];
  nextBooking: {
    id: string;
    title: string;
    startTime: string;
    type: string;
  } | null;
}

// ── Component ──────────────────────────────────────────

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<Tag[]>([]);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: "", email: "", phone: "" });
  const [createTagIds, setCreateTagIds] = useState<string[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // New tag inline
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6B7280");
  const [creatingTag, setCreatingTag] = useState(false);

  const TAG_COLORS = [
    "#3B82F6", "#F97316", "#22C55E", "#EF4444",
    "#8B5CF6", "#EC4899", "#14B8A6", "#6B7280",
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [clientsRes, tagsRes] = await Promise.all([
      fetch("/api/clients"),
      fetch("/api/clients/tags"),
    ]);
    if (clientsRes.ok) setClients(await clientsRes.json());
    if (tagsRes.ok) setAllTags(await tagsRes.json());
    setLoading(false);
  }

  async function handleCreate() {
    setCreateError(null);
    if (!createForm.fullName || !createForm.email) {
      setCreateError("Name and email are required");
      return;
    }
    setCreating(true);

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...createForm,
        tagIds: createTagIds,
      }),
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
    setCreateTagIds([]);
    loadData();
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return;
    setCreatingTag(true);

    const res = await fetch("/api/clients/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
    });

    if (res.ok) {
      const tag = await res.json();
      setAllTags((prev) => [...prev, tag]);
      setNewTagName("");
    }
    setCreatingTag(false);
  }

  function toggleTag(tagId: string) {
    setCreateTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
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
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Clients</h1>
          <p className="text-sm text-muted-foreground">Client roster and flight records</p>
        </div>
        <Button
          onClick={() => {
            setCreateError(null);
            setCreateOpen(true);
          }}
          className="bg-[#1A6FB5] hover:bg-[#155d99]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Flight Hours</TableHead>
                <TableHead>Next Booking</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No clients registered
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/dashboard/clients/${c.id}`)}
                  >
                    <TableCell className="font-medium">{c.fullName}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.email}</TableCell>
                    <TableCell className="text-right">{c.totalHours}h</TableCell>
                    <TableCell>
                      {c.nextBooking ? (
                        <span className="text-sm">
                          {new Date(c.nextBooking.startTime).toLocaleDateString()} — {c.nextBooking.title}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Create Client Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Client</DialogTitle>
            <DialogDescription>Register a new client</DialogDescription>
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
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="john@example.com"
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

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {allTags.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No tags available. Create one below.</p>
                ) : (
                  allTags.map((tag) => {
                    const isSelected = createTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all border"
                        style={{
                          backgroundColor: isSelected ? tag.color : "transparent",
                          color: isSelected ? "white" : tag.color,
                          borderColor: tag.color,
                        }}
                      >
                        {tag.name}
                        {isSelected && <X className="h-3 w-3" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Create new tag inline */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Create New Tag</Label>
              <div className="flex gap-2">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name"
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                />
                <div className="flex gap-1 items-center">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="w-5 h-5 rounded-full border-2 transition-transform"
                      style={{
                        backgroundColor: c,
                        borderColor: newTagColor === c ? "#0F1B2D" : "transparent",
                        transform: newTagColor === c ? "scale(1.2)" : "scale(1)",
                      }}
                      onClick={() => setNewTagColor(c)}
                    />
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={creatingTag || !newTagName.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-[#1A6FB5] hover:bg-[#155d99]"
            >
              {creating ? "Creating..." : "Add Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
