"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Trash2, Upload, FileText, Loader2 } from "lucide-react";

// ── Types ──────────────────────────────────────────────

interface PilotInfoData {
  trainingStatus: string | null;
  preferredLocation: string | null;
  lastFlightReview: string | null;
  rentersInsuranceExpiry: string | null;
  medicalClass: string | null;
  medicalExpires: string | null;
  ftn: string | null;
  soloDate: string | null;
  certificate: string | null;
  certificateType: string | null;
  issuedBy: string | null;
  dateIssued: string | null;
  certificateNumber: string | null;
  cfiExpiration: string | null;
  craftCategories: string[];
  endorsements: string[];
  classRatings: string[];
  otherRatings: string[];
  tsaEvidenceShown: string | null;
  tsaEndorsementsVerified: boolean;
  tsaNotes: string | null;
}

interface Course {
  id: string;
  courseName: string;
  status: string;
  enrolledDate: string | null;
  completedDate: string | null;
}

interface Checkout {
  id: string;
  aircraftId: string;
  aircraftReg: string | null;
  aircraftModel: string | null;
  checkoutDate: string;
  checkedOutByName: string | null;
}

interface PreferredInstructor {
  id: string;
  instructorId: string;
  instructorName: string | null;
  addedDate: string;
  addedBy: string | null;
}

interface PilotDocument {
  id: string;
  type: string;
  fileUrl: string;
  uploadedAt: string;
  expiresAt: string | null;
}

interface OptionData {
  instructors: { id: string; fullName: string }[];
  aircraft: { id: string; registration: string; model: string }[];
}

// ── Constants ──────────────────────────────────────────

const TRAINING_STATUSES = [
  { value: "enrolled", label: "Enrolled" },
  { value: "not_enrolled", label: "Not Enrolled" },
  { value: "completed", label: "Completed" },
  { value: "withdrawn", label: "Withdrawn" },
];

const COURSE_STATUSES = [
  { value: "enrolled", label: "Enrolled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "dropped", label: "Dropped" },
];

const MEDICAL_CLASSES = [
  { value: "1st_class", label: "1st Class" },
  { value: "2nd_class", label: "2nd Class" },
  { value: "3rd_class", label: "3rd Class" },
  { value: "basicmed", label: "BasicMed" },
];

const CERTIFICATES = [
  { value: "student_pilot", label: "Student Pilot" },
  { value: "sport_pilot", label: "Sport Pilot" },
  { value: "recreational_pilot", label: "Recreational Pilot" },
  { value: "private_pilot", label: "Private Pilot" },
  { value: "commercial_pilot", label: "Commercial Pilot" },
  { value: "atp", label: "ATP" },
];

const CERTIFICATE_TYPES = [
  { value: "remote_pilot", label: "Remote Pilot" },
  { value: "flight_instructor", label: "Flight Instructor" },
  { value: "ground_instructor", label: "Ground Instructor" },
  { value: "flight_engineer", label: "Flight Engineer" },
  { value: "flight_navigator", label: "Flight Navigator" },
];

const TSA_EVIDENCE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "passport", label: "Passport" },
  { value: "birth_certificate", label: "Birth Certificate" },
  { value: "naturalization_certificate", label: "Naturalization Certificate" },
  { value: "permanent_resident_card", label: "Permanent Resident Card" },
];

const DOCUMENT_TYPES = [
  { value: "medical_certificate", label: "Medical Certificate" },
  { value: "renters_insurance", label: "Renter's Insurance" },
  { value: "pilot_certificate", label: "Pilot Certificate" },
  { value: "other", label: "Other" },
];

const CRAFT_CATEGORIES = ["Airplane", "Rotorcraft", "Glider", "Lighter-Than-Air", "Powered-Lift", "Weight-Shift-Control"];
const ENDORSEMENTS_LIST = ["Complex", "High Performance", "Tailwheel", "High Altitude"];
const CLASS_RATINGS_LIST = ["Single Engine Land", "Single Engine Sea", "Multi Engine Land", "Multi Engine Sea"];
const OTHER_RATINGS_LIST = ["Instrument", "CFI", "CFII", "MEI", "ATP"];

const EMPTY_INFO: PilotInfoData = {
  trainingStatus: "not_enrolled",
  preferredLocation: "",
  lastFlightReview: "",
  rentersInsuranceExpiry: "",
  medicalClass: null,
  medicalExpires: "",
  ftn: "",
  soloDate: "",
  certificate: null,
  certificateType: null,
  issuedBy: "",
  dateIssued: "",
  certificateNumber: "",
  cfiExpiration: "",
  craftCategories: [],
  endorsements: [],
  classRatings: [],
  otherRatings: [],
  tsaEvidenceShown: "none",
  tsaEndorsementsVerified: false,
  tsaNotes: "",
};

function dateStr(val: string | null | undefined): string {
  if (!val) return "";
  return val.split("T")[0];
}

// ── Component ──────────────────────────────────────────

export default function PilotTab({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Scalar pilot info
  const [info, setInfo] = useState<PilotInfoData>(EMPTY_INFO);
  const [form, setForm] = useState<PilotInfoData>(EMPTY_INFO);

  // Relational data
  const [courses, setCourses] = useState<Course[]>([]);
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [preferredInstructors, setPreferredInstructors] = useState<PreferredInstructor[]>([]);
  const [options, setOptions] = useState<OptionData>({ instructors: [], aircraft: [] });

  // Dialogs
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({ courseName: "", status: "enrolled", enrolledDate: "" });

  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ aircraftId: "", checkedOutBy: "", checkoutDate: "" });

  const [instructorDialogOpen, setInstructorDialogOpen] = useState(false);
  const [instructorForm, setInstructorForm] = useState({ instructorId: "" });

  // Documents
  const [pilotDocs, setPilotDocs] = useState<PilotDocument[]>([]);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [docType, setDocType] = useState("medical_certificate");
  const [docExpiry, setDocExpiry] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [docDragOver, setDocDragOver] = useState(false);

  useEffect(() => {
    loadAll();
  }, [clientId]);

  async function loadAll() {
    setLoading(true);
    const [infoRes, coursesRes, checkoutsRes, instructorsRes, optionsRes, docsRes] = await Promise.all([
      fetch(`/api/clients/pilot?profileId=${clientId}`),
      fetch(`/api/clients/pilot/courses?profileId=${clientId}`),
      fetch(`/api/clients/pilot/checkouts?profileId=${clientId}`),
      fetch(`/api/clients/pilot/instructors?profileId=${clientId}`),
      fetch("/api/clients/pilot/options"),
      fetch(`/api/documents?profileId=${clientId}`),
    ]);

    if (optionsRes.ok) setOptions(await optionsRes.json());
    if (coursesRes.ok) setCourses(await coursesRes.json());
    if (checkoutsRes.ok) setCheckouts(await checkoutsRes.json());
    if (instructorsRes.ok) setPreferredInstructors(await instructorsRes.json());
    if (docsRes.ok) setPilotDocs(await docsRes.json());

    if (infoRes.ok) {
      const data = await infoRes.json();
      if (data) {
        const parsed: PilotInfoData = {
          trainingStatus: data.trainingStatus ?? "not_enrolled",
          preferredLocation: data.preferredLocation ?? "",
          lastFlightReview: dateStr(data.lastFlightReview),
          rentersInsuranceExpiry: dateStr(data.rentersInsuranceExpiry),
          medicalClass: data.medicalClass ?? null,
          medicalExpires: dateStr(data.medicalExpires),
          ftn: data.ftn ?? "",
          soloDate: dateStr(data.soloDate),
          certificate: data.certificate ?? null,
          certificateType: data.certificateType ?? null,
          issuedBy: data.issuedBy ?? "",
          dateIssued: dateStr(data.dateIssued),
          certificateNumber: data.certificateNumber ?? "",
          cfiExpiration: dateStr(data.cfiExpiration),
          craftCategories: data.craftCategories ?? [],
          endorsements: data.endorsements ?? [],
          classRatings: data.classRatings ?? [],
          otherRatings: data.otherRatings ?? [],
          tsaEvidenceShown: data.tsaEvidenceShown ?? "none",
          tsaEndorsementsVerified: data.tsaEndorsementsVerified ?? false,
          tsaNotes: data.tsaNotes ?? "",
        };
        setInfo(parsed);
        setForm(parsed);
      }
    }

    setLoading(false);
  }

  async function handleSaveInfo() {
    setSaving(true);
    await fetch("/api/clients/pilot", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: clientId, ...form }),
    });
    setInfo(form);
    setEditing(false);
    setSaving(false);
  }

  async function handleAddCourse() {
    if (!courseForm.courseName) return;
    await fetch("/api/clients/pilot/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: clientId, ...courseForm }),
    });
    setCourseDialogOpen(false);
    setCourseForm({ courseName: "", status: "enrolled", enrolledDate: "" });
    const res = await fetch(`/api/clients/pilot/courses?profileId=${clientId}`);
    if (res.ok) setCourses(await res.json());
  }

  async function handleDeleteCourse(id: string) {
    await fetch(`/api/clients/pilot/courses?id=${id}`, { method: "DELETE" });
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleAddCheckout() {
    if (!checkoutForm.aircraftId || !checkoutForm.checkedOutBy) return;
    await fetch("/api/clients/pilot/checkouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: clientId, ...checkoutForm }),
    });
    setCheckoutDialogOpen(false);
    setCheckoutForm({ aircraftId: "", checkedOutBy: "", checkoutDate: "" });
    const res = await fetch(`/api/clients/pilot/checkouts?profileId=${clientId}`);
    if (res.ok) setCheckouts(await res.json());
  }

  async function handleDeleteCheckout(id: string) {
    await fetch(`/api/clients/pilot/checkouts?id=${id}`, { method: "DELETE" });
    setCheckouts((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleAddInstructor() {
    if (!instructorForm.instructorId) return;
    await fetch("/api/clients/pilot/instructors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: clientId, instructorId: instructorForm.instructorId, addedBy: "Admin" }),
    });
    setInstructorDialogOpen(false);
    setInstructorForm({ instructorId: "" });
    const res = await fetch(`/api/clients/pilot/instructors?profileId=${clientId}`);
    if (res.ok) setPreferredInstructors(await res.json());
  }

  async function handleDeleteInstructor(id: string) {
    await fetch(`/api/clients/pilot/instructors?id=${id}`, { method: "DELETE" });
    setPreferredInstructors((prev) => prev.filter((i) => i.id !== id));
  }

  // Document handlers
  const handleDocFile = useCallback((f: File) => {
    setDocFile(f);
  }, []);

  const handleDocDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDocDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleDocFile(f);
    },
    [handleDocFile]
  );

  async function handleUploadDocument() {
    if (!docFile) return;
    setDocUploading(true);

    try {
      // Upload file and extract data
      const formData = new FormData();
      formData.append("file", docFile);
      formData.append("type", "credential");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      let extracted: Record<string, unknown> = {};
      let expiryDate = docExpiry || null;

      if (uploadRes.ok) {
        const data = await uploadRes.json();
        extracted = data.extracted ?? {};
        // Auto-fill expiry from extraction if not manually set
        if (!expiryDate && extracted.expiry_date) {
          expiryDate = extracted.expiry_date as string;
          setDocExpiry(expiryDate);
        }
      }

      // Create document record
      // Use the file name as a placeholder URL (in production, upload to storage first)
      const docRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: clientId,
          type: docType,
          fileUrl: docFile.name,
          expiresAt: expiryDate || null,
          extractedData: extracted,
        }),
      });

      if (docRes.ok) {
        // Auto-update pilot_info dates based on document type
        if (docType === "medical_certificate" && expiryDate) {
          await fetch("/api/clients/pilot", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId: clientId, medicalExpires: expiryDate }),
          });
        } else if (docType === "renters_insurance" && expiryDate) {
          await fetch("/api/clients/pilot", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId: clientId, rentersInsuranceExpiry: expiryDate }),
          });
        }

        // Refresh docs and info
        const [docsRefresh, infoRefresh] = await Promise.all([
          fetch(`/api/documents?profileId=${clientId}`),
          fetch(`/api/clients/pilot?profileId=${clientId}`),
        ]);
        if (docsRefresh.ok) setPilotDocs(await docsRefresh.json());
        if (infoRefresh.ok) {
          const data = await infoRefresh.json();
          if (data) {
            const parsed: PilotInfoData = {
              trainingStatus: data.trainingStatus ?? "not_enrolled",
              preferredLocation: data.preferredLocation ?? "",
              lastFlightReview: dateStr(data.lastFlightReview),
              rentersInsuranceExpiry: dateStr(data.rentersInsuranceExpiry),
              medicalClass: data.medicalClass ?? null,
              medicalExpires: dateStr(data.medicalExpires),
              ftn: data.ftn ?? "",
              soloDate: dateStr(data.soloDate),
              certificate: data.certificate ?? null,
              certificateType: data.certificateType ?? null,
              issuedBy: data.issuedBy ?? "",
              dateIssued: dateStr(data.dateIssued),
              certificateNumber: data.certificateNumber ?? "",
              cfiExpiration: dateStr(data.cfiExpiration),
              craftCategories: data.craftCategories ?? [],
              endorsements: data.endorsements ?? [],
              classRatings: data.classRatings ?? [],
              otherRatings: data.otherRatings ?? [],
              tsaEvidenceShown: data.tsaEvidenceShown ?? "none",
              tsaEndorsementsVerified: data.tsaEndorsementsVerified ?? false,
              tsaNotes: data.tsaNotes ?? "",
            };
            setInfo(parsed);
            if (!editing) setForm(parsed);
          }
        }

        setDocDialogOpen(false);
        setDocFile(null);
        setDocExpiry("");
      }
    } catch {
      // silently fail
    } finally {
      setDocUploading(false);
    }
  }

  async function handleDeleteDocument(id: string) {
    await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    setPilotDocs((prev) => prev.filter((d) => d.id !== id));
  }

  const d = editing ? form : info;

  function toggleArrayItem(field: keyof PilotInfoData, item: string) {
    const arr = (form[field] as string[]) ?? [];
    const next = arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item];
    setForm({ ...form, [field]: next });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-muted-foreground">Loading pilot info...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Edit / Save bar */}
      <div className="flex justify-end">
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => { setForm(info); setEditing(true); }}>
            Edit Information
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveInfo} disabled={saving} className="bg-[#1A6FB5] hover:bg-[#155d99]">
              {saving ? "Saving..." : "Save Information"}
            </Button>
          </div>
        )}
      </div>

      {/* ── 1. Training ── */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Training</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setCourseDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Course
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Training Status</Label>
            {editing ? (
              <select
                value={d.trainingStatus ?? "not_enrolled"}
                onChange={(e) => setForm({ ...form, trainingStatus: e.target.value })}
                className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {TRAINING_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm font-medium">
                {TRAINING_STATUSES.find((s) => s.value === d.trainingStatus)?.label ?? "Not Enrolled"}
              </p>
            )}
          </div>

          {courses.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Not currently enrolled in any courses.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-sm">{c.courseName}</TableCell>
                    <TableCell className="text-sm capitalize">{c.status.replace("_", " ")}</TableCell>
                    <TableCell className="text-sm">{c.enrolledDate ? new Date(c.enrolledDate).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-sm">{c.completedDate ? new Date(c.completedDate).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCourse(c.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── 2. Aircraft Check-Outs ── */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Aircraft Check-Outs</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setCheckoutDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Aircraft Checkout
          </Button>
        </CardHeader>
        <CardContent>
          {checkouts.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">This pilot has no aircraft check-outs.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aircraft</TableHead>
                  <TableHead>Checkout Date</TableHead>
                  <TableHead>Checked Out By</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkouts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-sm">
                      {c.aircraftReg} {c.aircraftModel ? `(${c.aircraftModel})` : ""}
                    </TableCell>
                    <TableCell className="text-sm">{new Date(c.checkoutDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm">{c.checkedOutByName ?? "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCheckout(c.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── 3. Preferred Instructor(s) ── */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Preferred Instructor(s)</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setInstructorDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Preferred Instructor
          </Button>
        </CardHeader>
        <CardContent>
          {preferredInstructors.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No preferred instructors.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor Name</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead>Added By</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {preferredInstructors.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium text-sm">{i.instructorName ?? "—"}</TableCell>
                    <TableCell className="text-sm">{new Date(i.addedDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm">{i.addedBy ?? "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteInstructor(i.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── 4. Preferred Location ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Preferred Location</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <Input
              value={d.preferredLocation ?? ""}
              onChange={(e) => setForm({ ...form, preferredLocation: e.target.value })}
              placeholder="Select a location"
              className="max-w-xs"
            />
          ) : (
            <p className="text-sm font-medium">{d.preferredLocation || "—"}</p>
          )}
        </CardContent>
      </Card>

      {/* ── 5. Currency ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Currency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ScalarField label="Last FAA Flight Review" value={d.lastFlightReview} type="date" editing={editing}
              onChange={(v) => setForm({ ...form, lastFlightReview: v })} />
            <ScalarField label="Renter's Insurance Expiration" value={d.rentersInsuranceExpiry} type="date" editing={editing}
              onChange={(v) => setForm({ ...form, rentersInsuranceExpiry: v })} />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Medical Class</Label>
              {editing ? (
                <select
                  value={d.medicalClass ?? ""}
                  onChange={(e) => setForm({ ...form, medicalClass: e.target.value || null })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select a class</option>
                  {MEDICAL_CLASSES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium">{MEDICAL_CLASSES.find((m) => m.value === d.medicalClass)?.label ?? "—"}</p>
              )}
            </div>
            <ScalarField label="Medical Expires" value={d.medicalExpires} type="date" editing={editing}
              onChange={(v) => setForm({ ...form, medicalExpires: v })} />
          </div>
        </CardContent>
      </Card>

      {/* ── 6. Certificate Information ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Certificate Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ScalarField label="FTN" value={d.ftn} editing={editing}
              onChange={(v) => setForm({ ...form, ftn: v })} />
            <ScalarField label="Solo Date" value={d.soloDate} type="date" editing={editing}
              onChange={(v) => setForm({ ...form, soloDate: v })} />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Certificate</Label>
              {editing ? (
                <select
                  value={d.certificate ?? ""}
                  onChange={(e) => setForm({ ...form, certificate: e.target.value || null })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select a certificate</option>
                  {CERTIFICATES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium">{CERTIFICATES.find((c) => c.value === d.certificate)?.label ?? "—"}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Certificate Type</Label>
              {editing ? (
                <select
                  value={d.certificateType ?? ""}
                  onChange={(e) => setForm({ ...form, certificateType: e.target.value || null })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select a type</option>
                  {CERTIFICATE_TYPES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium">{CERTIFICATE_TYPES.find((c) => c.value === d.certificateType)?.label ?? "—"}</p>
              )}
            </div>
            <ScalarField label="Issued By" value={d.issuedBy} editing={editing}
              onChange={(v) => setForm({ ...form, issuedBy: v })} />
            <ScalarField label="Date Issued" value={d.dateIssued} type="date" editing={editing}
              onChange={(v) => setForm({ ...form, dateIssued: v })} />
            <ScalarField label="Certificate Number" value={d.certificateNumber} editing={editing}
              onChange={(v) => setForm({ ...form, certificateNumber: v })} />
            <ScalarField label="CFI Expiration" value={d.cfiExpiration} type="date" editing={editing}
              onChange={(v) => setForm({ ...form, cfiExpiration: v })} />
          </div>
        </CardContent>
      </Card>

      {/* ── 7. Categories, Ratings & Endorsements ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Categories, Ratings & Endorsements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CheckboxGroup label="Craft Categories" items={CRAFT_CATEGORIES} selected={d.craftCategories}
            editing={editing} onToggle={(item) => toggleArrayItem("craftCategories", item)} />
          <CheckboxGroup label="Endorsements" items={ENDORSEMENTS_LIST} selected={d.endorsements}
            editing={editing} onToggle={(item) => toggleArrayItem("endorsements", item)} />
          <CheckboxGroup label="Class Ratings" items={CLASS_RATINGS_LIST} selected={d.classRatings}
            editing={editing} onToggle={(item) => toggleArrayItem("classRatings", item)} />
          <CheckboxGroup label="Other Ratings" items={OTHER_RATINGS_LIST} selected={d.otherRatings}
            editing={editing} onToggle={(item) => toggleArrayItem("otherRatings", item)} />
        </CardContent>
      </Card>

      {/* ── 8. TSA Security Clearance ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">TSA Security Clearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!d.tsaEvidenceShown || d.tsaEvidenceShown === "none" ? (
            <p className="text-xs text-red-600 bg-red-50 rounded-md px-3 py-2">
              This pilot has no TSA security clearance evidence filed.
            </p>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Evidence Shown</Label>
              {editing ? (
                <select
                  value={d.tsaEvidenceShown ?? "none"}
                  onChange={(e) => setForm({ ...form, tsaEvidenceShown: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {TSA_EVIDENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium">{TSA_EVIDENCE_OPTIONS.find((o) => o.value === d.tsaEvidenceShown)?.label ?? "None"}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Verified student and instructor logbook endorsements?</Label>
              {editing ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.tsaEndorsementsVerified}
                    onChange={(e) => setForm({ ...form, tsaEndorsementsVerified: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{form.tsaEndorsementsVerified ? "Yes" : "No"}</span>
                </label>
              ) : (
                <p className="text-sm font-medium">{d.tsaEndorsementsVerified ? "Yes" : "No"}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notes</Label>
            {editing ? (
              <textarea
                value={form.tsaNotes ?? ""}
                onChange={(e) => setForm({ ...form, tsaNotes: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Notes..."
              />
            ) : (
              <p className="text-sm">{d.tsaNotes || "—"}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── 9. Documents ── */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Documents</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setDocFile(null);
              setDocExpiry("");
              setDocType("medical_certificate");
              setDocDialogOpen(true);
            }}
          >
            <Upload className="h-3.5 w-3.5 mr-1" /> Upload Document
          </Button>
        </CardHeader>
        <CardContent>
          {pilotDocs.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No documents uploaded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pilotDocs.map((doc) => {
                  const typeLabel = DOCUMENT_TYPES.find((t) => t.value === doc.type)?.label ?? doc.type;
                  const isExpired = doc.expiresAt && new Date(doc.expiresAt) < new Date();
                  const isExpiringSoon = doc.expiresAt && !isExpired &&
                    new Date(doc.expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Badge variant="outline" className={
                          doc.type === "medical_certificate" ? "bg-blue-100 text-blue-700" :
                          doc.type === "renters_insurance" ? "bg-green-100 text-green-700" :
                          doc.type === "pilot_certificate" ? "bg-purple-100 text-purple-700" :
                          ""
                        }>
                          {typeLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{doc.fileUrl}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {doc.expiresAt ? (
                          <span className={
                            isExpired ? "text-red-600 font-medium" :
                            isExpiringSoon ? "text-amber-600 font-medium" :
                            "text-muted-foreground"
                          }>
                            {new Date(doc.expiresAt).toLocaleDateString()}
                            {isExpired && " (Expired)"}
                            {isExpiringSoon && " (Soon)"}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteDocument(doc.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Upload Document Dialog ── */}
      <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a pilot document to extract and store</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Document Type</Label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDocDragOver(true); }}
              onDragLeave={() => setDocDragOver(false)}
              onDrop={handleDocDrop}
              className={`flex items-center justify-center rounded-md border border-dashed p-6 transition-colors ${
                docDragOver
                  ? "border-[#1A6FB5] bg-blue-50"
                  : docFile
                    ? "border-green-400 bg-green-50"
                    : "border-slate-300 hover:border-slate-400"
              }`}
            >
              {docFile ? (
                <div className="flex items-center gap-3 text-sm">
                  <FileText className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="truncate max-w-[200px]">{docFile.name}</span>
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs"
                    onClick={() => setDocFile(null)}>
                    Clear
                  </Button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  Drop PDF/image or click to browse
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocFile(f); }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Expiry Date <span className="text-xs text-muted-foreground">(auto-filled if extracted)</span></Label>
              <Input type="date" value={docExpiry} onChange={(e) => setDocExpiry(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUploadDocument} disabled={!docFile || docUploading} className="bg-[#1A6FB5] hover:bg-[#155d99]">
              {docUploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Uploading...</> : "Upload & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Course Dialog ── */}
      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Course</DialogTitle>
            <DialogDescription>Enroll in a training course</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Course Name</Label>
              <Input value={courseForm.courseName} onChange={(e) => setCourseForm({ ...courseForm, courseName: e.target.value })} placeholder="e.g. Private Pilot Ground School" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select value={courseForm.status} onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                {COURSE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Enrolled Date</Label>
              <Input type="date" value={courseForm.enrolledDate} onChange={(e) => setCourseForm({ ...courseForm, enrolledDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCourse} disabled={!courseForm.courseName} className="bg-[#1A6FB5] hover:bg-[#155d99]">
              Add Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Checkout Dialog ── */}
      <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Aircraft Checkout</DialogTitle>
            <DialogDescription>Approve this pilot to fly an aircraft</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Aircraft</Label>
              <select value={checkoutForm.aircraftId} onChange={(e) => setCheckoutForm({ ...checkoutForm, aircraftId: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="">Select aircraft...</option>
                {options.aircraft.map((a) => (
                  <option key={a.id} value={a.id}>{a.registration} — {a.model}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Checked Out By</Label>
              <select value={checkoutForm.checkedOutBy} onChange={(e) => setCheckoutForm({ ...checkoutForm, checkedOutBy: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="">Select instructor...</option>
                {options.instructors.map((i) => (
                  <option key={i.id} value={i.id}>{i.fullName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Checkout Date</Label>
              <Input type="date" value={checkoutForm.checkoutDate} onChange={(e) => setCheckoutForm({ ...checkoutForm, checkoutDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCheckout} disabled={!checkoutForm.aircraftId || !checkoutForm.checkedOutBy} className="bg-[#1A6FB5] hover:bg-[#155d99]">
              Add Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Instructor Dialog ── */}
      <Dialog open={instructorDialogOpen} onOpenChange={setInstructorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Preferred Instructor</DialogTitle>
            <DialogDescription>Select an instructor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Instructor</Label>
              <select value={instructorForm.instructorId} onChange={(e) => setInstructorForm({ instructorId: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="">Select instructor...</option>
                {options.instructors.map((i) => (
                  <option key={i.id} value={i.id}>{i.fullName}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstructorDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddInstructor} disabled={!instructorForm.instructorId} className="bg-[#1A6FB5] hover:bg-[#155d99]">
              Add Instructor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Helper Components ──────────────────────────────────

function ScalarField({
  label,
  value,
  type = "text",
  editing,
  onChange,
}: {
  label: string;
  value: string | null;
  type?: "text" | "date";
  editing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <Input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <p className="text-sm font-medium">{value || "—"}</p>
      )}
    </div>
  );
}

function CheckboxGroup({
  label,
  items,
  selected,
  editing,
  onToggle,
}: {
  label: string;
  items: string[];
  selected: string[];
  editing: boolean;
  onToggle: (item: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isSelected = selected.includes(item);
          if (editing) {
            return (
              <label key={item} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(item)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{item}</span>
              </label>
            );
          }
          if (!isSelected) return null;
          return (
            <span key={item} className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {item}
            </span>
          );
        })}
        {!editing && selected.length === 0 && <span className="text-sm text-muted-foreground">—</span>}
      </div>
    </div>
  );
}
