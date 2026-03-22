import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/queue", label: "Queue" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    redirect("/admin/login");
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Barber admin
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Control</h1>
          <p className="text-sm text-slate-600 sm:text-base">
            Signed in as {admin.admin.email}. Actions are live.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <nav className="no-scrollbar flex w-full flex-nowrap items-center gap-2 overflow-x-auto rounded-full bg-white/80 px-2 py-1 shadow-sm ring-1 ring-slate-100 sm:w-auto">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 sm:text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <SignOutButton />
        </div>
      </header>

      <section>{children}</section>
    </main>
  );
}
