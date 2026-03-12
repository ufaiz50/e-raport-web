"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ListResponse } from "@/types/api";
import type { Student } from "@/types/student";

const LIMIT = 10;

type StudentPayload = {
  name: string;
  email: string;
  type: "junior" | "senior";
  class_id?: number;
};

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [form, setForm] = useState<StudentPayload>({ name: "", email: "", type: "junior" });
  const [editing, setEditing] = useState<Student | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["students", offset],
    queryFn: async () => {
      const res = await api.get<ListResponse<Student>>(`/students?offset=${offset}&limit=${LIMIT}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: StudentPayload) => api.post("/students", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setForm({ name: "", email: "", type: "junior" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: StudentPayload }) => api.put(`/students/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setEditing(null);
      setForm({ name: "", email: "", type: "junior" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/students/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });

  const canPrev = offset > 0;
  const canNext = useMemo(() => {
    if (!data?.meta) return false;
    return offset + LIMIT < data.meta.total;
  }, [data?.meta, offset]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: StudentPayload = {
      name: form.name,
      email: form.email,
      type: form.type,
      class_id: form.class_id || undefined,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const onEdit = (s: Student) => {
    setEditing(s);
    setForm({
      name: s.name,
      email: s.email,
      type: s.type,
      class_id: s.class_id,
    });
  };

  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Siswa</h1>

      <form onSubmit={onSubmit} className="mb-6 grid grid-cols-1 gap-2 md:grid-cols-5">
        <input
          className="rounded border px-3 py-2"
          placeholder="Nama"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
        />
        <input
          className="rounded border px-3 py-2"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          required
        />
        <select
          className="rounded border px-3 py-2"
          value={form.type}
          onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "junior" | "senior" }))}
        >
          <option value="junior">junior</option>
          <option value="senior">senior</option>
        </select>
        <input
          className="rounded border px-3 py-2"
          placeholder="ID Kelas (opsional)"
          type="number"
          value={form.class_id ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, class_id: e.target.value ? Number(e.target.value) : undefined }))}
        />
        <button className="rounded bg-black px-3 py-2 text-white" type="submit">
          {editing ? "Update" : "Tambah"}
        </button>
      </form>

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
                  <th className="border-b px-3 py-2">Nama</th>
                  <th className="border-b px-3 py-2">Email</th>
                  <th className="border-b px-3 py-2">Tipe</th>
                  <th className="border-b px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((s) => (
                  <tr key={s.id}>
                    <td className="border-b px-3 py-2">{s.id}</td>
                    <td className="border-b px-3 py-2">{s.name}</td>
                    <td className="border-b px-3 py-2">{s.email}</td>
                    <td className="border-b px-3 py-2">{s.type}</td>
                    <td className="border-b px-3 py-2">
                      <div className="flex gap-2">
                        <button onClick={() => onEdit(s)} className="rounded border px-2 py-1 text-xs">
                          Edit
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(s.id)}
                          className="rounded border border-red-300 px-2 py-1 text-xs text-red-600"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
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
    </>
  );
}
