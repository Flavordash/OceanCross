"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Plane,
  GraduationCap,
  Wrench,
  Package,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/dashboard/aircraft", label: "Aircraft", icon: Plane },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/instructors", label: "Instructors", icon: GraduationCap },
  { href: "/dashboard/mechanics", label: "Mechanics", icon: Wrench },
  { href: "/dashboard/inventory", label: "Inventory", icon: Package },
  { href: "/dashboard/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

const ROLE_ACCESS: Record<string, string[]> = {
  admin: ALL_ITEMS.map((i) => i.href),
  instructor: [
    "/dashboard",
    "/dashboard/schedule",
    "/dashboard/clients",
    "/dashboard/instructors",
    "/dashboard/chat",
    "/dashboard/settings",
  ],
  student: ["/dashboard/schedule", "/dashboard/chat", "/dashboard/settings"],
  mechanic: [
    "/dashboard",
    "/dashboard/schedule",
    "/dashboard/aircraft",
    "/dashboard/inventory",
    "/dashboard/chat",
    "/dashboard/settings",
  ],
  customer: ["/dashboard", "/dashboard/schedule", "/dashboard/settings"],
};

interface SidebarNavProps {
  role: string;
  onNavigate?: () => void;
}

export function SidebarNav({ role, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const allowed = ROLE_ACCESS[role] ?? ROLE_ACCESS.student;
  const items = ALL_ITEMS.filter((item) => allowed.includes(item.href));

  return (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {items.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-[#1A6FB5] text-white"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
