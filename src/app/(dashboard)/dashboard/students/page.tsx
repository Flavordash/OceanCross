"use client";

import { useEffect, useState } from "react";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Student {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  totalHours: number;
  nextBooking: {
    id: string;
    title: string;
    startTime: string;
    type: string;
  } | null;
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

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/students");
      if (res.ok) setStudents(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  async function openDetail(student: Student) {
    setSelected(student);
    setDetailOpen(true);
    const res = await fetch(`/api/students?id=${student.id}&detail=history`);
    if (res.ok) setHistory(await res.json());
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
      <div>
        <h1 className="text-2xl font-bold text-[#0F1B2D]">Students</h1>
        <p className="text-sm text-muted-foreground">Student roster and flight records</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Flight Hours</TableHead>
                <TableHead>Next Booking</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No students registered
                  </TableCell>
                </TableRow>
              ) : (
                students.map((s) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openDetail(s)}
                  >
                    <TableCell className="font-medium">{s.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{s.email}</TableCell>
                    <TableCell className="text-right">{s.totalHours}h</TableCell>
                    <TableCell>
                      {s.nextBooking ? (
                        <span className="text-sm">
                          {new Date(s.nextBooking.startTime).toLocaleDateString()} — {s.nextBooking.title}
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

      {/* Student Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.fullName}</DialogTitle>
                <DialogDescription>{selected.email}{selected.phone ? ` — ${selected.phone}` : ""}</DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-4 text-sm">
                <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">
                  <p className="text-lg font-bold text-[#1A6FB5]">{selected.totalHours}</p>
                  <p className="text-xs text-muted-foreground">Flight Hours</p>
                </div>
                {selected.nextBooking && (
                  <div className="rounded-lg bg-green-50 px-3 py-2">
                    <p className="font-medium text-green-700">{selected.nextBooking.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selected.nextBooking.startTime).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Schedule History</h3>
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No history</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((h) => (
                      <div key={h.id} className="flex items-center justify-between rounded border p-2 text-sm">
                        <div>
                          <p className="font-medium">{h.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(h.startTime).toLocaleDateString()}{" "}
                            {new Date(h.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                            {h.aircraftReg ? ` — ${h.aircraftReg}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={TYPE_COLORS[h.type] ?? ""}>
                            {h.type.replace("_", " ")}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">{h.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
