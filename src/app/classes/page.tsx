"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ListResponse } from "@/types/api";
import type { ClassItem } from "@/types/class";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuthGuard } from "@/hooks/use-auth-guard";

const LIMIT = 10;

type ClassPayload = {
  name: string;
  level: string;
  homeroom?: string;
  academic_year: string;
};

export default function ClassesPage() {
  useAuthGuard();

  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [form, setForm] = useState<ClassPayload>({ name: "", level: "", homeroom: "", academic_year: "" });
  const [editing, setEditing] = useState<ClassItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["classes", offset],
    queryFn: async () => {
      const res = await api.get<ListResponse<ClassItem>>(`/classes?offset=${offset}&limit=${LIMIT}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: ClassPayload) => api.post("/classes", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setForm({ name: "", level: "", homeroom: "", academic_year: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ClassPayload }) => api.put(`/classes/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setEditing(null);
      setForm({ name: "", level: "", homeroom: "", academic_year: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/classes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });

  const canPrev = offset > 0;
  const canNext = useMemo(() => {
    if (!data?.meta) return false;
    return offset + LIMIT < data.meta.total;
  }, [data?.meta, offset]);

  return (
    <DashboardLayout>
      <h1 className="mb-4 text-2xl font-semibold">Classes</h1>

      <form
        className="mb-6 grid grid-cols-1 gap-2 md:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (editing) updateMutation.mutate({ id: editing.id, payload: form });
          else createMutation.mutate(form);
        }}
      >
        <input className="rounded border px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
        <input className="rounded border px-3 py-2" placeholder="Level" value={form.level} onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))} required />
        <input className="rounded border px-3 py-2" placeholder="Homeroom" value={form.homeroom} onChange={(e) => setForm((p) => ({ ...p, homeroom: e.target.value }))} />
        <input className="rounded border px-3 py-2" placeholder="Academic Year" value={form.academic_year} onChange={(e) => setForm((p) => ({ ...p, academic_year: e.target.value }))} required />
        <button className="rounded bg-black px-3 py-2 text-white">{editing ? "Update" : "Add"}</button>
      </form>

      {isLoading && <p>Loading...</p>}

      {!!data && (
        <>
          <div className="overflow-hidden rounded border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="border-b px-3 py-2">ID</th>
                  <th className="border-b px-3 py-2">Name</th>
                  <th className="border-b px-3 py-2">Level</th>
                  <th className="border-b px-3 py-2">Academic Year</th>
                  <th className="border-b px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((c) => (
                  <tr key={c.id}>
                    <td className="border-b px-3 py-2">{c.id}</td>
                    <td className="border-b px-3 py-2">{c.name}</td>
                    <td className="border-b px-3 py-2">{c.level}</td>
                    <td className="border-b px-3 py-2">{c.academic_year}</td>
                    <td className="border-b px-3 py-2">
                      <div className="flex gap-2">
                        <button className="rounded border px-2 py-1 text-xs" onClick={() => { setEditing(c); setForm({ name: c.name, level: c.level, homeroom: c.homeroom, academic_year: c.academic_year }); }}>Edit</button>
                        <button className="rounded border border-red-300 px-2 py-1 text-xs text-red-600" onClick={() => deleteMutation.mutate(c.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-2">
            <button disabled={!canPrev} onClick={() => setOffset((p) => Math.max(0, p - LIMIT))} className="rounded border px-3 py-2 text-sm disabled:opacity-40">Prev</button>
            <button disabled={!canNext} onClick={() => setOffset((p) => p + LIMIT)} className="rounded border px-3 py-2 text-sm disabled:opacity-40">Next</button>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
