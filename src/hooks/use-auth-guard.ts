"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/auth";

export function useAuthGuard() {
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoggedIn()) {
      router.replace("/login");
    }
  }, [router]);
}
