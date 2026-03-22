import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import trimQLogo from "./TrimQ.png";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "TrimQ | Book your cut. Track your turn.",
  description: "Book your cut. Track your turn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className={`${spaceGrotesk.variable} min-h-full bg-background text-foreground antialiased`}
      >
        <div className="min-h-screen flex flex-col">
          <header className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 sm:pt-5">
            <nav className="glass-panel fade-up flex items-center justify-between gap-2 rounded-2xl px-3 py-2 sm:px-6 sm:py-3">
              <Link
                href="/"
                className="relative flex h-9 w-20 shrink-0 items-center overflow-hidden sm:h-12 sm:w-32"
                aria-label="TrimQ home"
              >
                <Image
                  src={trimQLogo}
                  alt="TrimQ logo"
                  priority
                  className="absolute left-0 top-1/2 h-16 w-auto max-w-none -translate-y-1/2 object-contain sm:h-28"
                />
              </Link>

              <div className="flex items-center justify-end gap-0.5 text-[11px] font-semibold text-slate-700 sm:gap-2 sm:text-sm">
                <Link
                  href="/book"
                  className="rounded-full px-2 py-1.5 transition hover:bg-white/90 sm:px-3 sm:py-2"
                >
                  Book
                </Link>
                <Link
                  href="/queue"
                  className="rounded-full px-2 py-1.5 transition hover:bg-white/90 sm:px-3 sm:py-2"
                >
                  Queue
                </Link>
                <Link
                  href="/track"
                  className="rounded-full px-2 py-1.5 transition hover:bg-white/90 sm:px-3 sm:py-2"
                >
                  Track
                </Link>
                <Link
                  href="/admin/login"
                  className="rounded-full border border-accent/20 bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.09em] text-accent transition hover:bg-accent hover:text-white sm:px-4 sm:py-2 sm:text-xs"
                >
                  Admin
                </Link>
              </div>
            </nav>
          </header>

          <div className="flex-1">{children}</div>

          <footer className="mx-auto w-full max-w-6xl px-6 pb-8 pt-6">
            <div className="flex flex-col items-start justify-between gap-2 border-t border-slate-300/40 pt-4 text-xs text-slate-600 sm:flex-row sm:items-center">
              <p>Book your cut. Track your turn.</p>
              <p>Built for modern barbershops</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}