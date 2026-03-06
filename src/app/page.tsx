"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (auth.isLoggedIn()) {
      router.replace("/students");
    }
  }, [router]);

  return (
    <main className="mx-auto max-w-xl p-8 text-center">
      <h1 className="mb-3 text-3xl font-bold">E-Raport Web</h1>
      <p className="mb-6 text-gray-600">Frontend internal untuk sistem e-raport multi-sekolah.</p>
      <Link href="/login" className="rounded bg-black px-4 py-2 text-white">
        Masuk ke Dashboard
      </Link>
    </main>
  );
}
