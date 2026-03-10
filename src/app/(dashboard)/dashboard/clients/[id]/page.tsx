"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import PilotTab from "./pilot-tab";

// ── Types ──────────────────────────────────────────────

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface ClientProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
}

interface ClientDetail {
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  driversLicense: string | null;
  passportNumber: string | null;
  passportExpiry: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  notes: string | null;
}

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: "charge" | "payment" | "adjustment";
  quantity: number | null;
  amount: number;
  paymentMethod: string | null;
  notes: string | null;
}

interface BalanceInfo {
  totalCharges: number;
  totalPayments: number;
  totalAdjustments: number;
  balance: number;
}

interface HistoryItem {
  id: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  status: string;
  aircraftReg: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  flight_training: "bg-blue-100 text-blue-700",
  maintenance: "bg-orange-100 text-orange-700",
  exam: "bg-purple-100 text-purple-700",
  ground_school: "bg-green-100 text-green-700",
};

const EMPTY_DETAIL: ClientDetail = {
  address: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  gender: "",
  dateOfBirth: "",
  driversLicense: "",
  passportNumber: "",
  passportExpiry: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  notes: "",
};

// ── Component ──────────────────────────────────────────

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [tab, setTab] = useState<"personal" | "ledger" | "history" | "pilot">("personal");
  const [loading, setLoading] = useState(true);

  // Profile
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [editingTags, setEditingTags] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Personal
  const [details, setDetails] = useState<ClientDetail>(EMPTY_DETAIL);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState<ClientDetail>(EMPTY_DETAIL);
  const [savingPersonal, setSavingPersonal] = useState(false);

  // Stats
  const [totalHours, setTotalHours] = useState(0);

  // Ledger
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [balance, setBalance] = useState<BalanceInfo>({ totalCharges: 0, totalPayments: 0, totalAdjustments: 0, balance: 0 });
  const [ledgerDialogOpen, setLedgerDialogOpen] = useState(false);
  const [ledgerForm, setLedgerForm] = useState({ description: "", type: "charge" as string, amount: "", quantity: "", paymentMethod: "", date: "" });
  const [savingLedger, setSavingLedger] = useState(false);

  // History
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    loadProfile();
  }, [clientId]);

  useEffect(() => {
    if (tab === "personal") loadPersonal();
    if (tab === "ledger") loadLedger();
    if (tab === "history") loadHistory();
  }, [tab, clientId]);

  async function loadProfile() {
    const [clientRes, tagsRes, statsRes] = await Promise.all([
      fetch(`/api/clients?id=${clientId}`),
      fetch("/api/clients/tags"),
      fetch(`/api/clients?id=${clientId}`),
    ]);

    if (tagsRes.ok) setAllTags(await tagsRes.json());

    if (statsRes.ok) {
      const stats = await statsRes.json();
      setTotalHours(stats.totalHours ?? 0);
    }

    // Get profile from the enriched clients list
    const clientsRes = await fetch("/api/clients");
    if (clientsRes.ok) {
      const clients = await clientsRes.json();
      const client = clients.find((c: { id: string }) => c.id === clientId);
      if (client) {
        setProfile({ id: client.id, fullName: client.fullName, email: client.email, phone: client.phone });
        setTags(client.tags ?? []);
        setSelectedTagIds((client.tags ?? []).map((t: Tag) => t.id));
      }
    }

    setLoading(false);
    loadPersonal();
  }

  async function loadPersonal() {
    const res = await fetch(`/api/clients/details?profileId=${clientId}`);
    if (res.ok) {
      const data = await res.json();
      if (data) {
        const d: ClientDetail = {
          address: data.address ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          zip: data.zip ?? "",
          country: data.country ?? "",
          gender: data.gender ?? "",
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
          driversLicense: data.driversLicense ?? "",
          passportNumber: data.passportNumber ?? "",
          passportExpiry: data.passportExpiry ? data.passportExpiry.split("T")[0] : "",
          emergencyContactName: data.emergencyContactName ?? "",
          emergencyContactPhone: data.emergencyContactPhone ?? "",
          notes: data.notes ?? "",
        };
        setDetails(d);
        setPersonalForm(d);
      }
    }
  }

  async function loadLedger() {
    const res = await fetch(`/api/clients/ledger?profileId=${clientId}`);
    if (res.ok) {
      const data = await res.json();
      setLedger(data.entries ?? []);
      setBalance(data.balance ?? { totalCharges: 0, totalPayments: 0, totalAdjustments: 0, balance: 0 });
    }
  }

  async function loadHistory() {
    const res = await fetch(`/api/clients?id=${clientId}&detail=history`);
    if (res.ok) setHistory(await res.json());
  }

  async function handleSavePersonal() {
    setSavingPersonal(true);
    await fetch("/api/clients/details", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: clientId, ...personalForm }),
    });
    setDetails(personalForm);
    setEditingPersonal(false);
    setSavingPersonal(false);
  }

  async function handleSaveTags() {
    await fetch("/api/clients", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: clientId, tagIds: selectedTagIds }),
    });
    setTags(allTags.filter((t) => selectedTagIds.includes(t.id)));
    setEditingTags(false);
  }

  async function handleAddLedgerEntry() {
    if (!ledgerForm.description || !ledgerForm.amount) return;
    setSavingLedger(true);

    await fetch("/api/clients/ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId: clientId,
        ...ledgerForm,
        amount: parseFloat(ledgerForm.amount),
        quantity: ledgerForm.quantity ? parseFloat(ledgerForm.quantity) : null,
      }),
    });

    setSavingLedger(false);
    setLedgerDialogOpen(false);
    setLedgerForm({ description: "", type: "charge", amount: "", quantity: "", paymentMethod: "", date: "" });
    loadLedger();
  }

  async function handleDeleteLedgerEntry(id: string) {
    await fetch(`/api/clients/ledger?id=${id}`, { method: "DELETE" });
    loadLedger();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Client not found</p>
        <Button variant="link" onClick={() => router.push("/dashboard/clients")}>Back to Clients</Button>
      </div>
    );
  }

  const tabs = [
    { id: "personal" as const, label: "Personal" },
    { id: "ledger" as const, label: "Ledger" },
    { id: "pilot" as const, label: "Pilot" },
    { id: "history" as const, label: "Client History" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[#1A6FB5] flex items-center justify-center text-white text-lg font-bold">
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0F1B2D]">{profile.fullName}</h1>
              <p className="text-sm text-muted-foreground">
                {profile.email}{profile.phone ? ` — ${profile.phone}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <div className="rounded-lg bg-blue-50 px-4 py-2 text-center">
            <p className="text-lg font-bold text-[#1A6FB5]">{totalHours}h</p>
            <p className="text-xs text-muted-foreground">Flight Hours</p>
          </div>
          <div className="rounded-lg bg-green-50 px-4 py-2 text-center">
            <p className="text-lg font-bold text-green-700">${balance.balance.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Balance</p>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {tags.length === 0 && <span className="text-xs text-muted-foreground">No tags</span>}
        </div>
        {!editingTags ? (
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setEditingTags(true)}>
            Edit Tags
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {allTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      setSelectedTagIds(
                        isSelected
                          ? selectedTagIds.filter((id) => id !== tag.id)
                          : [...selectedTagIds, tag.id]
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border transition-all"
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
              })}
            </div>
            <Button size="sm" className="text-xs h-7 bg-[#1A6FB5] hover:bg-[#155d99]" onClick={handleSaveTags}>Save</Button>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setEditingTags(false); setSelectedTagIds(tags.map(t => t.id)); }}>Cancel</Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-[#1A6FB5] text-[#1A6FB5]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "personal" && (
        <PersonalTab
          details={editingPersonal ? personalForm : details}
          editing={editingPersonal}
          saving={savingPersonal}
          onChange={setPersonalForm}
          onEdit={() => { setPersonalForm(details); setEditingPersonal(true); }}
          onSave={handleSavePersonal}
          onCancel={() => setEditingPersonal(false)}
        />
      )}

      {tab === "ledger" && (
        <LedgerTab
          entries={ledger}
          balance={balance}
          onAdd={() => setLedgerDialogOpen(true)}
          onDelete={handleDeleteLedgerEntry}
        />
      )}

      {tab === "history" && <HistoryTab history={history} />}

      {tab === "pilot" && <PilotTab clientId={clientId} />}

      {/* Add Ledger Entry Dialog */}
      <Dialog open={ledgerDialogOpen} onOpenChange={setLedgerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Ledger Entry</DialogTitle>
            <DialogDescription>Record a charge, payment, or adjustment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select
                value={ledgerForm.type}
                onChange={(e) => setLedgerForm({ ...ledgerForm, type: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="charge">Charge</option>
                <option value="payment">Payment</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={ledgerForm.description}
                onChange={(e) => setLedgerForm({ ...ledgerForm, description: e.target.value })}
                placeholder="Service Fee, Flight Training, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={ledgerForm.amount}
                  onChange={(e) => setLedgerForm({ ...ledgerForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={ledgerForm.quantity}
                  onChange={(e) => setLedgerForm({ ...ledgerForm, quantity: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={ledgerForm.date}
                  onChange={(e) => setLedgerForm({ ...ledgerForm, date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Input
                  value={ledgerForm.paymentMethod}
                  onChange={(e) => setLedgerForm({ ...ledgerForm, paymentMethod: e.target.value })}
                  placeholder="Card **** 5529"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLedgerDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAddLedgerEntry}
              disabled={savingLedger || !ledgerForm.description || !ledgerForm.amount}
              className="bg-[#1A6FB5] hover:bg-[#155d99]"
            >
              {savingLedger ? "Saving..." : "Add Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Personal Tab ──────────────────────────────────────

function PersonalTab({
  details,
  editing,
  saving,
  onChange,
  onEdit,
  onSave,
  onCancel,
}: {
  details: ClientDetail;
  editing: boolean;
  saving: boolean;
  onChange: (d: ClientDetail) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  function Field({ label, value, field }: { label: string; value: string; field: keyof ClientDetail }) {
    if (editing) {
      return (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          <Input
            value={value}
            type={field === "dateOfBirth" || field === "passportExpiry" ? "date" : "text"}
            onChange={(e) => onChange({ ...details, [field]: e.target.value })}
          />
        </div>
      );
    }
    return (
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "—"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {!editing ? (
          <Button variant="outline" size="sm" onClick={onEdit}>Edit Personal Info</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
            <Button size="sm" onClick={onSave} disabled={saving} className="bg-[#1A6FB5] hover:bg-[#155d99]">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Address */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Street Address" value={details.address ?? ""} field="address" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="City" value={details.city ?? ""} field="city" />
              <Field label="State" value={details.state ?? ""} field="state" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="ZIP" value={details.zip ?? ""} field="zip" />
              <Field label="Country" value={details.country ?? ""} field="country" />
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gender" value={details.gender ?? ""} field="gender" />
              <Field label="Date of Birth" value={details.dateOfBirth ?? ""} field="dateOfBirth" />
            </div>
            <Field label="Driver's License" value={details.driversLicense ?? ""} field="driversLicense" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Passport Number" value={details.passportNumber ?? ""} field="passportNumber" />
              <Field label="Passport Expiry" value={details.passportExpiry ?? ""} field="passportExpiry" />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Name" value={details.emergencyContactName ?? ""} field="emergencyContactName" />
            <Field label="Phone" value={details.emergencyContactPhone ?? ""} field="emergencyContactPhone" />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <textarea
                value={details.notes ?? ""}
                onChange={(e) => onChange({ ...details, notes: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            ) : (
              <p className="text-sm">{details.notes || "—"}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Ledger Tab ────────────────────────────────────────

function LedgerTab({
  entries,
  balance,
  onAdd,
  onDelete,
}: {
  entries: LedgerEntry[];
  balance: BalanceInfo;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const TYPE_STYLE: Record<string, string> = {
    charge: "text-red-600",
    payment: "text-green-600",
    adjustment: "text-orange-600",
  };

  // Running balance calculation (from oldest to newest)
  const sorted = [...entries].reverse();
  let running = 0;
  const withBalance = sorted.map((e) => {
    if (e.type === "charge") running += e.amount;
    else if (e.type === "payment") running -= e.amount;
    else running += e.amount;
    return { ...e, runningBalance: running };
  });
  withBalance.reverse(); // Back to newest first

  return (
    <div className="space-y-4">
      {/* Action buttons + Balance */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button onClick={onAdd} className="bg-[#1A6FB5] hover:bg-[#155d99]">
            <Plus className="h-4 w-4 mr-2" />
            Charge
          </Button>
          <Button variant="outline" onClick={onAdd}>
            $ Payment
          </Button>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Balance</p>
          <p className={`text-xl font-bold ${balance.balance > 0 ? "text-red-600" : "text-green-600"}`}>
            ${balance.balance.toFixed(2)}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Charge</TableHead>
                <TableHead className="text-right">Payment</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {withBalance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No ledger entries
                  </TableCell>
                </TableRow>
              ) : (
                withBalance.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm">
                      {new Date(e.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{e.description}</p>
                        {e.paymentMethod && (
                          <p className="text-xs text-green-600">{e.paymentMethod}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {e.quantity ?? ""}
                    </TableCell>
                    <TableCell className="text-right text-sm text-red-600">
                      {e.type === "charge" ? `$${e.amount.toFixed(2)}` : ""}
                    </TableCell>
                    <TableCell className="text-right text-sm text-green-600">
                      {e.type === "payment" ? `$${e.amount.toFixed(2)}` : ""}
                      {e.type === "adjustment" ? (
                        <span className="text-orange-600">${e.amount.toFixed(2)}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      ${e.runningBalance.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => onDelete(e.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── History Tab ───────────────────────────────────────

function HistoryTab({ history }: { history: HistoryItem[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground">
        {history.length} record{history.length !== 1 ? "s" : ""}
      </h3>
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No history</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Aircraft</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => {
                  const start = new Date(h.startTime);
                  const end = new Date(h.endTime);
                  const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
                  const hours = Math.floor(durationMin / 60);
                  const mins = durationMin % 60;

                  return (
                    <TableRow key={h.id}>
                      <TableCell className="text-sm">
                        {start.toLocaleDateString()}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{h.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={TYPE_COLORS[h.type] ?? ""}>
                          {h.type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{h.aircraftReg ?? "—"}</TableCell>
                      <TableCell className="text-sm">
                        {hours > 0 ? `${hours}h ` : ""}{mins}m
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{h.status}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
