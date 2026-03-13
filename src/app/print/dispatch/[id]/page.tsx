import { getUser } from "@/lib/auth";
import { getDispatchDetail } from "@/lib/db/dispatch";
import { redirect } from "next/navigation";
import { PrintTrigger } from "../../print-trigger";

const PREFLIGHT_LABELS: Record<string, string> = {
  proficiencyCheck: "Annual Proficiency Check verified",
  rentalAgreement: "Rental Agreement on file",
  weightBalance: "W&B reviewed",
  notams: "NOTAMs checked",
  weatherBriefing: "Weather briefing obtained",
  paxBriefing: "PAX briefing completed",
};

const COMPANY = {
  name: "Crossairocean",
  address: "39317 Airpark Rd",
  cityStateZip: "Zephyrhills, FL 33542",
  phone: "+1 (352) 737-0800",
};

export default async function PrintDispatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const d = await getDispatchDetail(id);
  if (!d) return <p>Dispatch record not found.</p>;

  const departDate = new Date(d.departTime);
  const returnDate = d.returnTime ? new Date(d.returnTime) : null;
  const printedDate = new Date();

  const checks = (d.preflightChecks ?? {}) as Record<string, boolean>;
  const maintLabel = d.maintenanceStatus === "pass" ? "PASS ✓" : d.maintenanceStatus === "review" ? "REVIEW ⚠" : "FAIL ✗";
  const maintColor = d.maintenanceStatus === "pass" ? "#15803d" : d.maintenanceStatus === "review" ? "#c2410c" : "#dc2626";

  const statusLabel = d.status === "returned" ? "Returned" : d.status === "dispatched" ? "Dispatched" : "Cancelled";

  return (
    <div>
      <PrintTrigger />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ fontWeight: "bold", fontSize: 15 }}>{COMPANY.name}</p>
          <p style={{ color: "#555", fontSize: 12 }}>{COMPANY.address}</p>
          <p style={{ color: "#555", fontSize: 12 }}>{COMPANY.cityStateZip}</p>
          <p style={{ color: "#555", fontSize: 12 }}>{COMPANY.phone}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontWeight: "bold", fontSize: 17 }}>Dispatch Record</p>
          <p style={{ color: "#555", fontSize: 12, marginTop: 4 }}>
            Printed {printedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{" "}
            {printedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      {/* Aircraft + Flight Info */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: "bold", marginBottom: 6 }}>Flight Information</h2>
        <table>
          <tbody>
            <tr>
              <td style={{ color: "#555", width: 160 }}>Aircraft</td>
              <td style={{ fontWeight: "bold" }}>{d.aircraftRegistration ?? "—"} {d.aircraftModel ? `— ${d.aircraftModel}` : ""}</td>
              <td style={{ color: "#555", width: 160 }}>Status</td>
              <td style={{ fontWeight: "bold" }}>{statusLabel}</td>
            </tr>
            <tr>
              <td style={{ color: "#555" }}>Pilot</td>
              <td>{d.pilotName ?? "—"}</td>
              <td style={{ color: "#555" }}>Instructor</td>
              <td>{d.instructorName ?? "—"}</td>
            </tr>
            <tr>
              <td style={{ color: "#555" }}>Depart</td>
              <td>
                {departDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{" "}
                {departDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </td>
              <td style={{ color: "#555" }}>Return</td>
              <td>
                {returnDate
                  ? `${returnDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ${returnDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "In progress"}
              </td>
            </tr>
            <tr>
              <td style={{ color: "#555" }}>Maintenance</td>
              <td style={{ fontWeight: "bold", color: maintColor }}>{maintLabel}</td>
              <td />
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Hobbs / Tach */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: "bold", marginBottom: 6 }}>Hobbs / Tach</h2>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Out</th>
              <th>In</th>
              <th>Flown</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ color: "#555", fontWeight: "bold" }}>Hobbs</td>
              <td>{d.hobbsOut.toFixed(2)}</td>
              <td>{d.hobbsIn?.toFixed(2) ?? "—"}</td>
              <td style={{ fontWeight: "bold" }}>{d.hobbsFlown?.toFixed(1) ?? "—"} hrs</td>
            </tr>
            <tr>
              <td style={{ color: "#555", fontWeight: "bold" }}>Tach</td>
              <td>{d.tachOut.toFixed(2)}</td>
              <td>{d.tachIn?.toFixed(2) ?? "—"}</td>
              <td style={{ fontWeight: "bold" }}>{d.tachFlown?.toFixed(1) ?? "—"} hrs</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pre-flight Checklist */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: "bold", marginBottom: 8 }}>Pre-flight Checklist</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {Object.entries(PREFLIGHT_LABELS).map(([key, label]) => {
            const checked = checks[key] === true;
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <div style={{
                  width: 14, height: 14, border: `1px solid ${checked ? "#16a34a" : "#999"}`,
                  borderRadius: 2, background: checked ? "#dcfce7" : "#fff",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: "#16a34a", flexShrink: 0,
                }}>
                  {checked ? "✓" : ""}
                </div>
                <span style={{ color: checked ? "#1a1a1a" : "#888" }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      {d.notes && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: "bold", marginBottom: 6 }}>Notes</h2>
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 4, padding: 10, fontSize: 13 }}>
            {d.notes}
          </div>
        </div>
      )}

      {/* Signature */}
      <div style={{ marginTop: 24, borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
        <div style={{ display: "flex", gap: 48 }}>
          <div>
            <p style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>Pilot Signature</p>
            <div style={{ borderBottom: "1px solid #555", width: 200, height: 28 }} />
            <p style={{ fontSize: 11, color: "#888", marginTop: 2 }}>X ___________________</p>
          </div>
          <div>
            <p style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>Dispatcher / Instructor</p>
            <div style={{ borderBottom: "1px solid #555", width: 200, height: 28 }} />
            <p style={{ fontSize: 11, color: "#888", marginTop: 2 }}>X ___________________</p>
          </div>
        </div>
      </div>
    </div>
  );
}
