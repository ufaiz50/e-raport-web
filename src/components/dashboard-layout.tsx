"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, BookOpenCheck, ClipboardList, GraduationCap, LogOut, PanelLeftClose, PanelLeftOpen, School2, Users } from "lucide-react";
import { auth } from "@/lib/auth";

const menus = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/students", label: "Students", icon: Users },
  { href: "/classes", label: "Classes", icon: School2 },
  { href: "/grades", label: "Grades", icon: BookOpenCheck },
  { href: "/reports", label: "Reports", icon: ClipboardList },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const onLogout = () => {
    auth.clearToken();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-indigo-100 p-4 md:p-6">
      <div className="flex w-full gap-6">
        <aside className={`${sidebarCollapsed ? "w-20" : "w-64"} rounded-3xl border border-white/60 bg-white/80 p-4 shadow-xl backdrop-blur-md transition-all duration-200`}>
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
              {!sidebarCollapsed && "Toggle"}
            </button>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 p-2.5 text-white">
              <GraduationCap className="size-5" />
            </div>
            <div className={sidebarCollapsed ? "hidden" : "block"}>
              <h2 className="text-lg font-semibold text-slate-900">E-Raport</h2>
              <p className="text-xs text-slate-500">School Management</p>
            </div>
          </div>

          {!sidebarCollapsed && (
            <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Main menu</div>
          )}
          <nav className="space-y-1">
            {menus.map((m) => (
              <NavItem key={m.href} href={m.href} label={m.label} pathname={pathname} icon={m.icon} collapsed={sidebarCollapsed} />
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="mt-6 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
              <div className="mb-2 font-medium text-slate-800">Quick tips</div>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2"><Users className="size-3.5" /> Review student data weekly</li>
                <li className="flex items-center gap-2"><BookOpenCheck className="size-3.5" /> Keep grades updated per semester</li>
                <li className="flex items-center gap-2"><ClipboardList className="size-3.5" /> Finalize reports before print</li>
              </ul>
            </div>
          )}

          <button
            onClick={onLogout}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <LogOut className="size-4" /> {!sidebarCollapsed && "Logout"}
          </button>
        </aside>

        <section className="min-h-[calc(100vh-3rem)] flex-1 rounded-3xl border border-white/60 bg-white/85 p-5 shadow-xl backdrop-blur-md md:p-6">
          {children}
        </section>
      </div>
    </div>
  );
}

function NavItem({ href, label, pathname, icon: Icon, collapsed }: { href: string; label: string; pathname: string; icon: React.ComponentType<{ className?: string }>; collapsed: boolean }) {
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`block rounded-xl px-3 py-2.5 text-sm transition ${
        active
          ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow"
          : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      <span className={`inline-flex items-center ${collapsed ? "justify-center" : "gap-2"} w-full`}>
        <Icon className="size-4" />
        {!collapsed && label}
      </span>
    </Link>
  );
}
