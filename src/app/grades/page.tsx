"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export default function GradesPage() {
  useAuthGuard();

  return (
    <DashboardLayout>
      <h1 className="mb-2 text-2xl font-semibold">Grades</h1>
      <p className="text-gray-600">Halaman grades siap dilanjutkan (filter + CRUD).</p>
    </DashboardLayout>
  );
}
