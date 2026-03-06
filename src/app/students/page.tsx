"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { auth } from "@/lib/auth";
import type { ListResponse } from "@/types/api";
import type { Student } from "@/types/student";

const LIMIT = 10;

export default function StudentsPage() {
  const router = useRouter();
  const [offset, setOffset] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["students", offset],
    queryFn: async () => {
      const res = await api.get<ListResponse<Student>>(`/students?offset=${offset}&limit=${LIMIT}`);
      return res.data;
    },
  });

  const canPrev = offset > 0;
  const canNext = useMemo(() => {
    if (!data?.meta) return false;
    return offset + LIMIT < data.meta.total;
  }, [data?.meta, offset]);

  const onLogout = () => {
    auth.clearToken();
    router.push("/login");
  };

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Students</h1>
        <button onClick={onLogout} className="rounded border px-3 py-2 text-sm">
          Logout
        </button>
      </div>

      {isLoading && <p>Loading...</p>}
      {isError && <p className="text-red-600">Gagal ambil data students.</p>}

      {!!data && (
        <>
          <div className="mb-3 text-sm text-gray-600">
            Total: {data.meta.total} • Menampilkan: {data.meta.count} • Offset: {data.meta.offset}
          </div>

          <div className="overflow-hidden rounded border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="border-b px-3 py-2">ID</th>
                  <th className="border-b px-3 py-2">Name</th>
                  <th className="border-b px-3 py-2">Email</th>
                  <th className="border-b px-3 py-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((s) => (
                  <tr key={s.id}>
                    <td className="border-b px-3 py-2">{s.id}</td>
                    <td className="border-b px-3 py-2">{s.name}</td>
                    <td className="border-b px-3 py-2">{s.email}</td>
                    <td className="border-b px-3 py-2">{s.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              disabled={!canPrev}
              onClick={() => setOffset((p) => Math.max(0, p - LIMIT))}
              className="rounded border px-3 py-2 text-sm disabled:opacity-40"
            >
              Prev
            </button>
            <button
              disabled={!canNext}
              onClick={() => setOffset((p) => p + LIMIT)}
              className="rounded border px-3 py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </main>
  );
}
