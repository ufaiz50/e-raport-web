"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export default function ReportsPage() {
  useAuthGuard();

  return (
    <DashboardLayout>
      <h1 className="mb-2 text-2xl font-semibold">Reports</h1>
      <p className="text-gray-600">Halaman reports siap dilanjutkan (print/pdf student & class).</p>
    </DashboardLayout>
  );
}
