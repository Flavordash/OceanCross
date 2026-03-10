"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Upload,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────

interface MechanicProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  activeJobs: number;
}

interface JobItem {
  id: string;
  description: string;
  status: string;
  bay: string | null;
  estimatedStart: string | null;
  estimatedEnd: string | null;
  aircraftReg: string | null;
  aircraftModel: string | null;
}

interface MechanicDocument {
  id: string;
  type: string;
  fileUrl: string;
  uploadedAt: string;
  expiresAt: string | null;
}

const JOB_STATUS_BADGE: Record<string, string> = {
  pending_parts: "bg-yellow-100 text-yellow-700",
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
};

const DOCUMENT_TYPES = [
  { value: "a_and_p_certificate", label: "A&P Certificate" },
  { value: "ia_certificate", label: "IA Certificate" },
  { value: "medical_certificate", label: "Medical Certificate" },
  { value: "renters_insurance", label: "Insurance" },
  { value: "other", label: "Other" },
];

const DOC_TYPE_BADGE: Record<string, string> = {
  a_and_p_certificate: "bg-blue-100 text-blue-700",
  ia_certificate: "bg-purple-100 text-purple-700",
  medical_certificate: "bg-green-100 text-green-700",
  renters_insurance: "bg-amber-100 text-amber-700",
  other: "bg-gray-100 text-gray-700",
};

type TabId = "jobs" | "documents";

// ── Component ──────────────────────────────────────────

export default function MechanicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mechanicId = params.id as string;

  const [tab, setTab] = useState<TabId>("jobs");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MechanicProfile | null>(null);
  const [jobs, setJobs] = useState<JobItem[]>([]);

  // Documents
  const [docs, setDocs] = useState<MechanicDocument[]>([]);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [docType, setDocType] = useState("a_and_p_certificate");
  const [docExpiry, setDocExpiry] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [docDragOver, setDocDragOver] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [mechanicId]);

  useEffect(() => {
    if (tab === "documents") loadDocuments();
  }, [tab, mechanicId]);

  async function loadProfile() {
    const [listRes, jobsRes] = await Promise.all([
      fetch("/api/mechanics"),
      fetch(`/api/mechanics?id=${mechanicId}&detail=jobs`),
    ]);

    if (listRes.ok) {
      const all = await listRes.json();
      const found = all.find((m: { id: string }) => m.id === mechanicId);
      if (found) setProfile(found);
    }

    if (jobsRes.ok) setJobs(await jobsRes.json());

    setLoading(false);
  }

  async function loadDocuments() {
    const res = await fetch(`/api/documents?profileId=${mechanicId}`);
    if (res.ok) setDocs(await res.json());
  }

  const handleDocFile = useCallback((file: File) => {
    setDocFile(file);
  }, []);

  const handleDocDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDocDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleDocFile(file);
    },
    [handleDocFile]
  );

  async function handleUploadDocument() {
    if (!docFile) return;
    setDocUploading(true);

    try {
      // Upload file
      const fd = new FormData();
      fd.append("file", docFile);
      const uploadRes = await fetch("/api/upload?type=credential", {
        method: "POST",
        body: fd,
      });

      if (!uploadRes.ok) {
        setDocUploading(false);
        return;
      }

      const uploadData = await uploadRes.json();

      // Determine expiry from extraction or manual input
      let expiresAt = docExpiry || null;
      if (!expiresAt && uploadData.extracted) {
        if (docType === "medical_certificate" && uploadData.extracted.medical_expiry) {
          expiresAt = uploadData.extracted.medical_expiry;
        }
        if (docType === "renters_insurance" && uploadData.extracted.insurance_expiry) {
          expiresAt = uploadData.extracted.insurance_expiry;
        }
      }

      // Create document record
      await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: mechanicId,
          type: docType,
          fileUrl: uploadData.fileUrl ?? docFile.name,
          expiresAt,
          extractedData: uploadData.extracted ?? null,
        }),
      });

      // Reset and reload
      setDocDialogOpen(false);
      setDocFile(null);
      setDocType("a_and_p_certificate");
      setDocExpiry("");
      loadDocuments();
    } finally {
      setDocUploading(false);
    }
  }

  async function handleDeleteDocument(id: string) {
    await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    loadDocuments();
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
        <p className="text-muted-foreground">Mechanic not found</p>
        <Button variant="link" onClick={() => router.push("/dashboard/mechanics")}>
          Back to Mechanics
        </Button>
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "jobs", label: "Jobs" },
    { id: "documents", label: "Documents" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/mechanics")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-orange-600 flex items-center justify-center text-white text-lg font-bold">
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0F1B2D]">
                {profile.fullName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {profile.email}
                {profile.phone ? ` — ${profile.phone}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <div className="rounded-lg bg-orange-50 px-4 py-2 text-center">
            <p className="text-lg font-bold text-orange-600">
              {profile.activeJobs}
            </p>
            <p className="text-xs text-muted-foreground">Active Jobs</p>
          </div>
          <div className="rounded-lg bg-blue-50 px-4 py-2 text-center">
            <p className="text-lg font-bold text-[#1A6FB5]">{docs.length}</p>
            <p className="text-xs text-muted-foreground">Documents</p>
          </div>
        </div>
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
      {tab === "jobs" && <JobsTab jobs={jobs} />}

      {tab === "documents" && (
        <DocumentsTab
          docs={docs}
          onUpload={() => setDocDialogOpen(true)}
          onDelete={handleDeleteDocument}
        />
      )}

      {/* Upload Document Dialog */}
      <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a certificate, license, or other document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Document Type</Label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {DOCUMENT_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* File drop zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                docDragOver
                  ? "border-[#1A6FB5] bg-blue-50"
                  : "border-muted-foreground/25"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDocDragOver(true);
              }}
              onDragLeave={() => setDocDragOver(false)}
              onDrop={handleDocDrop}
            >
              {docFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-[#1A6FB5]" />
                  <span className="text-sm font-medium">{docFile.name}</span>
                  <button
                    onClick={() => setDocFile(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer space-y-1">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop or{" "}
                    <span className="text-[#1A6FB5] underline">browse</span>
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleDocFile(f);
                    }}
                  />
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Expiry Date (optional)</Label>
              <Input
                type="date"
                value={docExpiry}
                onChange={(e) => setDocExpiry(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDocDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadDocument}
              disabled={docUploading || !docFile}
              className="bg-[#1A6FB5] hover:bg-[#155d99]"
            >
              {docUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Jobs Tab ──────────────────────────────────────────

function JobsTab({ jobs }: { jobs: JobItem[] }) {
  if (jobs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No jobs assigned
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {jobs.map((j) => (
        <div key={j.id} className="rounded border p-4 text-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="font-medium">{j.description}</p>
            <Badge
              variant="outline"
              className={JOB_STATUS_BADGE[j.status] ?? ""}
            >
              {j.status.replace("_", " ")}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {j.aircraftReg && (
              <span>
                {j.aircraftReg} ({j.aircraftModel})
              </span>
            )}
            {j.bay && <span>Bay {j.bay}</span>}
            {j.estimatedStart && (
              <span>
                {new Date(j.estimatedStart).toLocaleDateString()}
                {j.estimatedEnd
                  ? ` – ${new Date(j.estimatedEnd).toLocaleDateString()}`
                  : ""}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Documents Tab ─────────────────────────────────────

function DocumentsTab({
  docs,
  onUpload,
  onDelete,
}: {
  docs: MechanicDocument[];
  onUpload: () => void;
  onDelete: (id: string) => void;
}) {
  function expiryColor(expiresAt: string | null) {
    if (!expiresAt) return "";
    const diff = new Date(expiresAt).getTime() - Date.now();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days < 0) return "text-red-600 font-medium";
    if (days < 30) return "text-amber-600 font-medium";
    return "text-green-600";
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={onUpload}
          className="bg-[#1A6FB5] hover:bg-[#155d99]"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
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
              {docs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No documents uploaded
                  </TableCell>
                </TableRow>
              ) : (
                docs.map((d) => {
                  const typeMeta = DOCUMENT_TYPES.find(
                    (dt) => dt.value === d.type
                  );
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={DOC_TYPE_BADGE[d.type] ?? DOC_TYPE_BADGE.other}
                        >
                          {typeMeta?.label ?? d.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          {d.fileUrl.split("/").pop() ?? d.fileUrl}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(d.uploadedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className={`text-sm ${expiryColor(d.expiresAt)}`}>
                        {d.expiresAt
                          ? new Date(d.expiresAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => onDelete(d.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
