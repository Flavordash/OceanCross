import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plane,
  GraduationCap,
  Wrench,
  ClipboardCheck,
  BookOpen,
  BarChart3,
} from "lucide-react";

const services = [
  {
    icon: GraduationCap,
    title: "Flight Training",
    description:
      "Comprehensive flight training programs from private pilot to commercial certification. AI-optimized scheduling ensures maximum efficiency for students and instructors.",
    highlights: [
      "Private Pilot License (PPL)",
      "Instrument Rating (IR)",
      "Commercial Pilot License (CPL)",
      "AI-scheduled training sessions",
    ],
  },
  {
    icon: Wrench,
    title: "Aircraft Maintenance (MRO)",
    description:
      "Full-service maintenance, repair, and overhaul operations. Track parts orders, mechanic assignments, and maintenance bay scheduling all in one platform.",
    highlights: [
      "Scheduled maintenance tracking",
      "Parts order management",
      "Mechanic assignment optimization",
      "Maintenance history records",
    ],
  },
  {
    icon: ClipboardCheck,
    title: "Exam Scheduling",
    description:
      "Coordinate ground and practical exams with instructors, aircraft, and students. Automatic conflict detection ensures smooth exam scheduling.",
    highlights: [
      "Written exam coordination",
      "Checkride scheduling",
      "Examiner availability tracking",
      "Automatic conflict alerts",
    ],
  },
  {
    icon: BookOpen,
    title: "Ground School",
    description:
      "Organize ground school sessions with classroom scheduling, instructor assignment, and student enrollment tracking.",
    highlights: [
      "Classroom scheduling",
      "Curriculum tracking",
      "Instructor assignments",
      "Student progress monitoring",
    ],
  },
  {
    icon: Plane,
    title: "Fleet Management",
    description:
      "Complete visibility into your aircraft fleet. Track availability, total hours, maintenance status, and scheduling across all aircraft.",
    highlights: [
      "Real-time availability",
      "Hour tracking",
      "Status monitoring",
      "Utilization reports",
    ],
  },
  {
    icon: BarChart3,
    title: "AI Scheduling Assistant",
    description:
      "Natural language chat interface powered by AI. Book flights, check availability, and manage schedules by simply asking.",
    highlights: [
      "Natural language booking",
      "24/7 availability",
      "Smart conflict resolution",
      "Schedule recommendations",
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-[#0F1B2D] py-16">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Our Services
          </h1>
          <p className="mt-3 text-slate-400 max-w-md mx-auto">
            Comprehensive aviation training and management solutions powered by
            modern technology.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((s) => (
              <Card key={s.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#1A6FB5]/10">
                      <s.icon className="h-6 w-6 text-[#1A6FB5]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#0F1B2D] mb-2">
                        {s.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                        {s.description}
                      </p>
                      <ul className="space-y-1">
                        {s.highlights.map((h) => (
                          <li
                            key={h}
                            className="text-sm text-muted-foreground flex items-center gap-2"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1A6FB5]" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl font-bold text-[#0F1B2D] mb-3">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Create an account and start scheduling your flights today.
          </p>
          <div className="flex justify-center gap-3">
            <Button className="bg-[#1A6FB5] hover:bg-[#155d99]" asChild>
              <Link href="/signup">Create Account</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
