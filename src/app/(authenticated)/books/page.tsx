"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BooksRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/subjects");
  }, [router]);
  return null;
}
