import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Queue | Barber Booking & Live Queue",
  description:
    "Free-to-host barber booking and live queue management for neighborhood barber shops.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        <div className="min-h-screen flex flex-col">{children}</div>
      </body>
    </html>
  );
}
