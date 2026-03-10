import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="logo-hover">
              <Image
                src="/logo.svg"
                alt="CrossAirOcean"
                width={40}
                height={40}
              />
            </span>
            <span className="text-lg font-bold text-[#0F1B2D]">
              CrossAirOcean
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-[#0F1B2D] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/services"
              className="text-sm font-medium text-muted-foreground hover:text-[#0F1B2D] transition-colors"
            >
              Services
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-muted-foreground hover:text-[#0F1B2D] transition-colors"
            >
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              size="sm"
              className="bg-[#1A6FB5] hover:bg-[#155d99]"
              asChild
            >
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-[#0F1B2D] text-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="logo-hover">
                  <Image src="/logo.svg" alt="CrossAirOcean" width={28} height={28} />
                </span>
                <span className="font-bold">CrossAirOcean</span>
              </div>
              <p className="text-sm text-slate-400">
                AI-Powered Aviation Scheduling Platform based in Florida.
                Training, maintenance, and fleet management — all in one place.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <Link href="/services" className="block hover:text-white transition-colors">
                  Services
                </Link>
                <Link href="/contact" className="block hover:text-white transition-colors">
                  Contact
                </Link>
                <Link href="/login" className="block hover:text-white transition-colors">
                  Sign In
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <p>Florida, United States</p>
                <p>info@crossoceanflight.com</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-700 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} CrossAirOcean. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
