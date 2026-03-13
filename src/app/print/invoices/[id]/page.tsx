import { getUser } from "@/lib/auth";
import { getInvoice } from "@/lib/db/invoices";
import { redirect } from "next/navigation";
import { PrintTrigger } from "../../print-trigger";

const COMPANY = {
  name: "Crossairocean",
  address: "39317 Airpark Rd",
  cityStateZip: "Zephyrhills, FL 33542",
  phone: "+1 (352) 737-0800",
};

export default async function PrintInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) return <p>Invoice not found.</p>;

  const issuedDate = new Date(invoice.issuedAt);
  const printedDate = new Date();
  const taxLabel = `Pasco County ${(invoice.taxRate * 100).toFixed(0)}%`;

  return (
    <div>
      <PrintTrigger />

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ fontWeight: "bold", fontSize: 15 }}>{COMPANY.name}</p>
          <p style={{ color: "#555", fontSize: 12 }}>{COMPANY.address}</p>
          <p style={{ color: "#555", fontSize: 12 }}>{COMPANY.cityStateZip}</p>
          <p style={{ color: "#555", fontSize: 12 }}>{COMPANY.phone}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontWeight: "bold", fontSize: 15 }}>
            {issuedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{" "}
            {issuedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p style={{ color: "#555", fontSize: 12 }}>
            Printed {printedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{" "}
            {printedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: "bold", fontSize: 15 }}>Bill to: {invoice.client.fullName}</p>
        {invoice.client.address && <p style={{ color: "#555", fontSize: 12 }}>{invoice.client.address}</p>}
        {(invoice.client.city || invoice.client.state || invoice.client.zip) && (
          <p style={{ color: "#555", fontSize: 12 }}>
            {[invoice.client.city, invoice.client.state, invoice.client.zip].filter(Boolean).join(", ")}
          </p>
        )}
        {invoice.client.phone && <p style={{ color: "#555", fontSize: 12 }}>{invoice.client.phone}</p>}
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: "bold", fontSize: 15 }}>Invoice #: {invoice.invoiceNumber}</p>
        <p style={{ color: "#555", fontSize: 12 }}>Completed by {COMPANY.name}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style={{ textAlign: "right", width: 60 }}>Qty</th>
            <th style={{ textAlign: "right", width: 80 }}>Rate</th>
            <th style={{ textAlign: "right", width: 90 }}>Charge</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.id}>
              <td style={{ whiteSpace: "pre-line" }}>{item.description}</td>
              <td style={{ textAlign: "right" }}>{item.quantity}</td>
              <td style={{ textAlign: "right" }}>${item.rate.toFixed(2)}</td>
              <td style={{ textAlign: "right" }}>${item.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginLeft: "auto", width: 260, fontSize: 13 }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
          <span style={{ fontWeight: "bold" }}>Sub Total:</span>
          <span>${invoice.subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
          <span>+ {taxLabel}</span>
          <span>${invoice.taxAmount.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderTop: "1.5px solid #333", marginTop: 2, fontWeight: "bold" }}>
          <span>Total Sale:</span>
          <span>${invoice.total.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderTop: "1px solid #ccc", marginTop: 2 }}>
          <span>Previous balance:</span>
          <span>${invoice.previousBalance.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontWeight: "bold" }}>
          <span>Current balance:</span>
          <span>${(invoice.total + invoice.previousBalance).toFixed(2)}</span>
        </div>
      </div>

      <div style={{ background: "#fffbeb", border: "1px solid #f5a623", borderRadius: 4, padding: 10, margin: "20px 0", fontSize: 11, color: "#92400e" }}>
        Customer acknowledges receipt of product and agrees to perform the obligations set forth in the card
        issuer agreement. By signing below, customer agrees that the services described above are accurate, and
        were provided in a complete and satisfactory manner.
      </div>

      <div style={{ marginTop: 16 }}>
        <p style={{ fontWeight: "bold" }}>Signature:</p>
        <div style={{ borderBottom: "1px solid #555", width: 240, height: 24, margin: "8px 0 4px" }} />
        <p>X</p>
      </div>
    </div>
  );
}
