"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/auth";

const menus = [
  { href: "/students", label: "Students" },
  { href: "/classes", label: "Classes" },
  { href: "/grades", label: "Grades" },
  { href: "/reports", label: "Reports" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const onLogout = () => {
    auth.clearToken();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex max-w-6xl gap-6 p-4">
        <aside className="w-56 rounded border bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold">E-Raport</h2>
          <nav className="space-y-1">
            {menus.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className={`block rounded px-3 py-2 text-sm ${pathname === m.href ? "bg-black text-white" : "hover:bg-gray-100"}`}
              >
                {m.label}
              </Link>
            ))}
          </nav>
          <button onClick={onLogout} className="mt-6 w-full rounded border px-3 py-2 text-sm">
            Logout
          </button>
        </aside>
        <section className="flex-1 rounded border bg-white p-4">{children}</section>
      </div>
    </div>
  );
}
