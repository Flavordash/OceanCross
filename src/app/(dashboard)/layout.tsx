"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Menu, LogOut, Plane } from "lucide-react";

interface UserProfile {
  fullName: string;
  email: string;
  role: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, role")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile({
          fullName: data.full_name,
          email: data.email,
          role: data.role,
        });
      }
    }
    loadProfile();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = profile?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A6FB5]">
          <Plane className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide">
            Crossocean
          </h1>
          <p className="text-[11px] text-slate-400">Flight Operations</p>
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        <SidebarNav
          role={profile?.role ?? "student"}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      <Separator className="bg-white/10" />

      {/* User info */}
      <div className="flex items-center gap-3 px-4 py-4">
        <Avatar size="sm">
          <AvatarFallback className="bg-[#1A6FB5] text-white text-xs">
            {initials ?? "??"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {profile?.fullName ?? "Loading..."}
          </p>
          <p className="text-[11px] text-slate-400 capitalize">
            {profile?.role ?? ""}
          </p>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col bg-[#0F1B2D] border-r border-white/5">
        {sidebarContent}
      </aside>

      {/* Main Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b bg-white px-4 lg:px-6">
          {/* Mobile Menu */}
          {mobileOpen && (
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetContent
                side="left"
                className="w-60 p-0 bg-[#0F1B2D] border-r-white/5"
                showCloseButton={false}
              >
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                {sidebarContent}
              </SheetContent>
            </Sheet>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden lg:block" />

          {/* Right: user + logout */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">
                {profile?.fullName ?? "Loading..."}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {profile?.role ?? ""}
              </p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-[#0F1B2D] text-white text-xs">
                {initials ?? "??"}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
