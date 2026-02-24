"use client";

import { cn } from "@/lib/utils";

export type ReminderStatus = "expired" | "warning" | "ok" | "good";

const STATUS_COLORS: Record<ReminderStatus, string> = {
  expired: "bg-red-500",
  warning: "bg-orange-400",
  ok: "bg-green-500",
  good: "bg-slate-400",
};

const STATUS_BG: Record<ReminderStatus, string> = {
  expired: "bg-red-100",
  warning: "bg-orange-100",
  ok: "bg-green-100",
  good: "bg-slate-100",
};

interface ReminderProgressBarProps {
  status: ReminderStatus;
  percentRemaining: number;
  label: string;
}

export function ReminderProgressBar({
  status,
  percentRemaining,
  label,
}: ReminderProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percentRemaining));

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div
        className={cn(
          "relative h-5 w-full rounded-sm overflow-hidden",
          STATUS_BG[status]
        )}
      >
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-sm transition-all",
            STATUS_COLORS[status]
          )}
          style={{ width: `${clamped}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-white mix-blend-difference">
          {label}
        </span>
      </div>
    </div>
  );
}
