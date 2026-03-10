import { NextRequest, NextResponse } from "next/server";

interface FAARecord {
  registration: string;
  serial_number: string;
  manufacturer: string;
  model: string;
  year: string;
  status: string;
  certificate_issue_date: string;
  expiration_date: string;
  type_aircraft: string;
  type_engine: string;
  type_registration: string;
  mode_s_hex: string;
  // Owner
  owner_name: string;
  owner_street: string;
  owner_city: string;
  owner_state: string;
  owner_zip: string;
  owner_country: string;
  // Airworthiness
  engine_manufacturer: string;
  engine_model: string;
  classification: string;
  category: string;
}

export async function GET(req: NextRequest) {
  const nNumber = req.nextUrl.searchParams.get("n");

  if (!nNumber) {
    return NextResponse.json(
      { error: "N-number query parameter 'n' is required" },
      { status: 400 }
    );
  }

  // Clean the N-number: remove leading N if present, uppercase
  const cleaned = nNumber.toUpperCase().replace(/^N/, "");

  try {
    const res = await fetch(
      `https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt=N${cleaned}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Aircraft not found in FAA registry" },
        { status: 404 }
      );
    }

    const html = await res.text();
    const record = parseRegistryHtml(html, cleaned);

    if (!record) {
      return NextResponse.json({
        registration: `N${cleaned}`,
        message:
          "FAA lookup succeeded but detailed parsing is limited. Enter details manually or upload document.",
      });
    }

    return NextResponse.json(record);
  } catch {
    return NextResponse.json(
      { error: "FAA registry is unavailable" },
      { status: 503 }
    );
  }
}

/**
 * Extract value from FAA HTML using the data-label attribute on <td> elements.
 * The FAA registry uses: <td data-label="Field Name">VALUE</td>
 */
function getByDataLabel(html: string, label: string): string {
  const regex = new RegExp(
    `data-label="${label}"[^>]*>\\s*([^<]+)`,
    "i"
  );
  const m = regex.exec(html);
  return m ? m[1].trim() : "";
}

function parseRegistryHtml(
  html: string,
  nNumber: string
): FAARecord | null {
  const manufacturer = getByDataLabel(html, "Manufacturer Name");
  const model = getByDataLabel(html, "Model");

  if (!manufacturer && !model) return null;

  return {
    registration: `N${nNumber}`,
    serial_number: getByDataLabel(html, "Serial Number"),
    manufacturer,
    model,
    year: getByDataLabel(html, "Mfr Year"),
    status: getByDataLabel(html, "Status"),
    certificate_issue_date: getByDataLabel(html, "Certificate Issue Date"),
    expiration_date: getByDataLabel(html, "Expiration Date"),
    type_aircraft: getByDataLabel(html, "Aircraft Type"),
    type_engine: getByDataLabel(html, "Engine Type"),
    type_registration: getByDataLabel(html, "Type Registration"),
    mode_s_hex: getByDataLabel(html, "Mode S Code \\(Base 16 / Hex\\)"),
    // Owner
    owner_name: getByDataLabel(html, "Name"),
    owner_street: getByDataLabel(html, "Street"),
    owner_city: getByDataLabel(html, "City"),
    owner_state: getByDataLabel(html, "State"),
    owner_zip: getByDataLabel(html, "Zip Code"),
    owner_country: getByDataLabel(html, "Country"),
    // Airworthiness
    engine_manufacturer: getByDataLabel(html, "Engine Manufacturer"),
    engine_model: getByDataLabel(html, "Engine Model"),
    classification: getByDataLabel(html, "Classification"),
    category: getByDataLabel(html, "Category"),
  };
}
