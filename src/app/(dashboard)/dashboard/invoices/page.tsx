"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Search, DollarSign, CheckCircle2 } from "lucide-react";

interface InvoiceRow {
  id: string;
  invoiceNumber: number;
  status: string;
  total: number;
  issuedAt: string;
  paidAt: string | null;
  clientName: string | null;
  clientId: string;
}

const STATUS_BADGE: Record<string, string> = {
  draft:  "bg-slate-100 text-slate-600",
  sent:   "bg-blue-100 text-blue-700",
  paid:   "bg-green-100 text-green-700",
  void:   "bg-red-100 text-red-500",
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/invoices")
      .then((r) => r.ok ? r.json() : [])
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, []);

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    return (
      !q ||
      inv.clientName?.toLowerCase().includes(q) ||
      String(inv.invoiceNumber).includes(q)
    );
  });

  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const outstanding = invoices.filter((i) => i.status === "sent").reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1B2D]">Invoices</h1>
        <p className="text-sm text-muted-foreground">Client billing records</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Invoices</p>
            <p className="text-2xl font-bold">{invoices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Revenue Collected</p>
              <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-start gap-2">
            <DollarSign className="h-4 w-4 text-orange-500 mt-1 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-bold">${outstanding.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search client, invoice #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {search ? "No results" : "No invoices yet — generate one from Dispatch History"}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-4 rounded border p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />

                  <div className="w-28 shrink-0">
                    <p className="text-sm font-semibold">#{inv.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(inv.issuedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{inv.clientName ?? "—"}</p>
                    {inv.paidAt && (
                      <p className="text-xs text-muted-foreground">
                        Paid {new Date(inv.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">${inv.total.toFixed(2)}</p>
                  </div>

                  <Badge variant="outline" className={`text-xs shrink-0 ${STATUS_BADGE[inv.status] ?? ""}`}>
                    {inv.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
