"use client";

import { useAuthGuard } from "@/hooks/use-auth-guard";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useAuthGuard();

  return <DashboardLayout>{children}</DashboardLayout>;
}
