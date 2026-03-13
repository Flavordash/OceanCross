"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, ArrowLeft, CheckCircle2, Send } from "lucide-react";
import Image from "next/image";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  sortOrder: number;
}

interface Invoice {
  id: string;
  invoiceNumber: number;
  status: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  previousBalance: number;
  notes: string | null;
  issuedAt: string;
  paidAt: string | null;
  client: {
    fullName: string;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  items: InvoiceItem[];
  dispatch?: {
    departTime: string;
    aircraftRegistration: string | null;
  };
}

const STATUS_BADGE: Record<string, string> = {
  draft:  "bg-slate-100 text-slate-600",
  sent:   "bg-blue-100 text-blue-700",
  paid:   "bg-green-100 text-green-700",
  void:   "bg-red-100 text-red-500",
};

const COMPANY = {
  name: "Crossairocean",
  address: "39317 Airpark Rd",
  cityStateZip: "Zephyrhills, FL 33542",
  phone: "+1 (352) 737-0800",
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setInvoice)
      .finally(() => setLoading(false));
  }, [id]);

  async function markAs(status: "sent" | "paid" | "void") {
    if (!invoice) return;
    setUpdating(true);
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setInvoice((prev) => prev ? { ...prev, status: updated.status, paidAt: updated.paidAt } : prev);
    }
    setUpdating(false);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground p-6">Loading...</p>;
  }
  if (!invoice) {
    return <p className="text-sm text-destructive p-6">Invoice not found.</p>;
  }

  const issuedDate = new Date(invoice.issuedAt);
  const printedDate = new Date();
  const taxLabel = `Pasco County ${(invoice.taxRate * 100).toFixed(0)}%`;

  return (
    <>
      {/* Action bar — hidden on print */}
      <div className="flex items-center gap-3 mb-4 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1" />
        <Badge variant="outline" className={`text-xs ${STATUS_BADGE[invoice.status] ?? ""}`}>
          {invoice.status}
        </Badge>
        {invoice.status !== "paid" && invoice.status !== "void" && (
          <>
            {invoice.status === "draft" && (
              <Button size="sm" variant="outline" disabled={updating} onClick={() => markAs("sent")}>
                <Send className="h-4 w-4 mr-1" /> Mark Sent
              </Button>
            )}
            <Button size="sm" variant="outline" disabled={updating} onClick={() => markAs("paid")}
              className="border-green-500 text-green-700 hover:bg-green-50">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Paid
            </Button>
          </>
        )}
        <Button
          size="sm"
          onClick={() => window.open(`/print/invoices/${id}`, "_blank")}
          className="bg-[#1A6FB5] hover:bg-[#155d99]"
        >
          <Printer className="h-4 w-4 mr-1" /> Print / Save PDF
        </Button>
      </div>

      {/* ── Invoice Document ── */}
      <div
        id="invoice-document"
        className="bg-white border rounded-lg p-8 max-w-3xl mx-auto print:border-0 print:rounded-none print:p-0 print:max-w-none print:shadow-none"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Image src="/logo.svg" alt="Logo" width={40} height={40} className="rounded" />
            </div>
            <p className="font-bold text-base">{COMPANY.name}</p>
            <p className="text-sm text-slate-600">{COMPANY.address}</p>
            <p className="text-sm text-slate-600">{COMPANY.cityStateZip}</p>
            <p className="text-sm text-slate-600">{COMPANY.phone}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-base">
              {issuedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{" "}
              {issuedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-sm text-slate-500">
              Printed {printedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{" "}
              {printedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-6">
          <p className="font-bold text-base">Bill to: {invoice.client.fullName}</p>
          {invoice.client.address && (
            <p className="text-sm text-slate-600">{invoice.client.address}</p>
          )}
          {(invoice.client.city || invoice.client.state || invoice.client.zip) && (
            <p className="text-sm text-slate-600">
              {[invoice.client.city, invoice.client.state, invoice.client.zip].filter(Boolean).join(", ")}
            </p>
          )}
          {invoice.client.phone && (
            <p className="text-sm text-slate-600">{invoice.client.phone}</p>
          )}
        </div>

        {/* Invoice meta */}
        <div className="mb-4">
          <p className="font-bold text-base">Invoice #: {invoice.invoiceNumber}</p>
          <p className="text-sm text-slate-500">Completed by {COMPANY.name}</p>
        </div>

        {/* Line items table */}
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-semibold">Description</th>
              <th className="text-right py-2 font-semibold w-16">Qty</th>
              <th className="text-right py-2 font-semibold w-20">Rate</th>
              <th className="text-right py-2 font-semibold w-24">Charge</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-2 pr-4 whitespace-pre-line">{item.description}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">${item.rate.toFixed(2)}</td>
                <td className="py-2 text-right">${item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="ml-auto w-64 text-sm space-y-1 mb-6">
          <div className="flex justify-between">
            <span className="font-semibold">Sub Total:</span>
            <span>${invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>+ {taxLabel}</span>
            <span>${invoice.taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-1">
            <span>Total Sale:</span>
            <span>${invoice.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span>Previous balance:</span>
            <span>${invoice.previousBalance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Current balance:</span>
            <span>${(invoice.total + invoice.previousBalance).toFixed(2)}</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-6">
          <p className="text-xs text-orange-700">
            Customer acknowledges receipt of product and agrees to perform the obligations set forth in the card
            issuer agreement. By signing below, customer agrees that the services described above are accurate, and
            were provided in a complete and satisfactory manner.
          </p>
        </div>

        {/* Signature */}
        <div>
          <p className="text-sm font-semibold mb-4">Signature:</p>
          <div className="border-b border-slate-400 w-64" />
          <p className="text-sm mt-1">X</p>
        </div>
      </div>

    </>
  );
}
