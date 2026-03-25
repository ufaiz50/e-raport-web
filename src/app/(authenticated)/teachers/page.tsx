"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ListResponse } from "@/types/api";
import { DataTable } from "@/components/ui/data-table";
import type { Teacher } from "@/types/teacher";
import { teacherDisplayName } from "@/types/teacher";

const DEFAULT_LIMIT = 10;

export default function TeachersPage() {
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["teachers", offset, limit],
    queryFn: async () => {
      const res = await api.get<ListResponse<Teacher>>(`/teachers?offset=${offset}&limit=${limit}`);
      return res.data;
    },
  });

  return (
    <>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Guru</h1>
        <p className="text-sm text-slate-500">Daftar akun guru (alias dari user dengan role guru).</p>
      </div>

      {isLoading && <p>Memuat...</p>}
      {isError && <p className="text-red-600">Gagal mengambil data guru.</p>}

      {!!data && (
        <DataTable
          rows={data.data}
          total={data.meta.total}
          offset={offset}
          limit={limit}
          onOffsetChange={setOffset}
          onLimitChange={(next) => {
            setLimit(next);
            setOffset(0);
          }}
          rowKey={(row) => row.id}
          columns={[
            { key: "no", header: "No", render: (_row, idx) => <span className="text-sm font-medium text-slate-700">{offset + idx + 1}</span> },
            { key: "name", header: "Nama Lengkap", render: (t) => <span className="text-sm font-medium text-slate-900">{teacherDisplayName(t)}</span> },
            { key: "username", header: "Username", render: (t) => <span className="text-sm text-slate-700">{t.username}</span> },
            { key: "role", header: "Role", render: (t) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{t.role ?? "-"}</span> },
            { key: "school", header: "Sekolah ID", render: (t) => <span className="text-sm text-slate-700">{t.school_id ?? "-"}</span> },
          ]}
        />
      )}
    </>
  );
}
