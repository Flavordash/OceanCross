"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReminderProgressBar, type ReminderStatus } from "./reminder-progress-bar";
import { ReminderFormDialog } from "./reminder-form-dialog";
import { Plus, Pencil, Trash2, CheckCircle } from "lucide-react";

interface Reminder {
  id: string;
  aircraftId: string;
  name: string;
  type: string;
  dueHours: number | null;
  warningHours: number | null;
  dueDate: string | null;
  warningDays: number | null;
  lastCompletedAt: string | null;
  lastCompletedHours: number | null;
  notes: string | null;
  hoursRemaining: number | null;
  daysRemaining: number | null;
  status: ReminderStatus;
  percentRemaining: number;
}

interface Props {
  aircraftId: string;
  reminders: Reminder[];
  canEdit: boolean;
  onRefresh: () => void;
}

function getRemainingLabel(r: Reminder): string {
  if (r.status === "expired") return "EXPIRED";
  if (r.hoursRemaining !== null && r.daysRemaining !== null) {
    return `${r.hoursRemaining} hrs / ${r.daysRemaining} days`;
  }
  if (r.hoursRemaining !== null) return `${r.hoursRemaining} hrs`;
  if (r.daysRemaining !== null) return `${r.daysRemaining} days`;
  return "N/A";
}

export function RemindersTable({ aircraftId, reminders, canEdit, onRefresh }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<{
    id: string;
    name: string;
    type: string;
    dueHours: string;
    warningHours: string;
    dueDate: string;
    warningDays: string;
    notes: string;
  } | null>(null);

  function openCreate() {
    setEditData(null);
    setFormOpen(true);
  }

  function openEdit(r: Reminder) {
    setEditData({
      id: r.id,
      name: r.name,
      type: r.type,
      dueHours: r.dueHours?.toString() ?? "",
      warningHours: r.warningHours?.toString() ?? "10",
      dueDate: r.dueDate ? new Date(r.dueDate).toISOString().split("T")[0] : "",
      warningDays: r.warningDays?.toString() ?? "30",
      notes: r.notes ?? "",
    });
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/aircraft/reminders?id=${id}`, { method: "DELETE" });
    onRefresh();
  }

  async function handleComplete(id: string) {
    await fetch("/api/aircraft/reminders?action=complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    onRefresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Maintenance Reminders</h3>
        {canEdit && (
          <Button size="sm" onClick={openCreate} className="bg-[#1A6FB5] hover:bg-[#155d99]">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Reminder
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Remaining</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="text-right">Hours</TableHead>
            <TableHead className="text-right">Days</TableHead>
            {canEdit && <TableHead className="w-24" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {reminders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canEdit ? 6 : 5} className="text-center text-muted-foreground py-8">
                No reminders set
              </TableCell>
            </TableRow>
          ) : (
            reminders.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>
                  <ReminderProgressBar
                    status={r.status}
                    percentRemaining={r.percentRemaining}
                    label={getRemainingLabel(r)}
                  />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.dueHours != null && <div>{r.dueHours} hrs</div>}
                  {r.dueDate && (
                    <div>{new Date(r.dueDate).toLocaleDateString()}</div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {r.hoursRemaining !== null ? r.hoursRemaining : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {r.daysRemaining !== null ? r.daysRemaining : "—"}
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-green-600"
                        title="Mark Completed"
                        onClick={() => handleComplete(r.id)}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(r)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(r.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ReminderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        aircraftId={aircraftId}
        editData={editData}
        onSaved={onRefresh}
      />
    </div>
  );
}
