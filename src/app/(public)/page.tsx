import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plane,
  Calendar,
  Bot,
  Wrench,
  Users,
  Shield,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "FullCalendar-powered scheduling with conflict detection. Manage flight training, exams, ground school, and maintenance in one view.",
  },
  {
    icon: Bot,
    title: "AI Assistant",
    description:
      "Chat with our AI to book flights, check availability, and manage your schedule using natural language.",
  },
  {
    icon: Plane,
    title: "Fleet Management",
    description:
      "Track aircraft status, total hours, and maintenance schedules. Know which planes are available at a glance.",
  },
  {
    icon: Wrench,
    title: "Maintenance Tracking",
    description:
      "Manage maintenance jobs, parts orders, and mechanic assignments. Never miss a scheduled maintenance window.",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description:
      "Separate dashboards for admins, instructors, students, and mechanics. Everyone sees exactly what they need.",
  },
  {
    icon: Shield,
    title: "Conflict Detection",
    description:
      "Automatic overlap detection for aircraft, instructors, and students. No more double bookings.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0F1B2D] via-[#152842] to-[#1A6FB5]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMCBoNjAgdjYwIEgwIHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-50" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-white/80 mb-6">
              <Plane className="h-3.5 w-3.5" />
              Florida-based Aviation Training & MRO
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              AI-Powered
              <br />
              <span className="text-[#60A5FA]">Aviation Scheduling</span>
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-lg">
              Streamline flight training, aircraft maintenance, and crew
              scheduling with intelligent automation. One platform for your
              entire aviation operation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-[#1A6FB5] hover:bg-[#155d99] text-base"
                asChild
              >
                <Link href="/signup">
                  Start Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-[#0F1B2D] hover:bg-white/10 hover:text-white text-base"
                asChild
              >
                <Link href="/services">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0F1B2D]">
              Everything You Need
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              From scheduling to AI-powered assistance, manage your aviation
              operations efficiently.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card
                key={f.title}
                className="border-0 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1A6FB5]/10 mb-4">
                    <f.icon className="h-5 w-5 text-[#1A6FB5]" />
                  </div>
                  <h3 className="font-semibold text-[#0F1B2D] mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Card className="bg-[#0F1B2D] border-0 overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Ready to Modernize Your Flight Operations?
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Join Crossocean Flight and experience AI-powered scheduling
                that saves time and prevents conflicts.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  size="lg"
                  className="bg-[#1A6FB5] hover:bg-[#155d99]"
                  asChild
                >
                  <Link href="/signup">Create Account</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-[#60A5FA] hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
