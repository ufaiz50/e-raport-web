"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { auth } from "@/lib/auth";
import type { ListResponse } from "@/types/api";

const LIMIT = 10;

type School = {
  id: number;
  name: string;
  code: string;
  address?: string;
  npsn?: string;
  principal_name?: string;
  principal_nip?: string;
  headmaster_sign?: string;
  school_stamp?: string;
};

type SchoolPayload = Omit<School, "id">;

const emptyForm: SchoolPayload = {
  name: "",
  code: "",
  address: "",
  npsn: "",
  principal_name: "",
  principal_nip: "",
  headmaster_sign: "",
  school_stamp: "",
};

export default function SchoolsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [form, setForm] = useState<SchoolPayload>(emptyForm);
  const [editing, setEditing] = useState<School | null>(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const role = auth.getRole();
    if (role && role !== "super_admin") {
      router.replace("/dashboard");
    }
  }, [router]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["schools", offset],
    queryFn: async () => {
      const res = await api.get<ListResponse<School>>(`/schools?offset=${offset}&limit=${LIMIT}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: SchoolPayload) => api.post("/schools", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      setForm(emptyForm);
      setOpenModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SchoolPayload }) => api.put(`/schools/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      setEditing(null);
      setForm(emptyForm);
      setOpenModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/schools/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schools"] }),
  });

  const canPrev = offset > 0;
  const canNext = useMemo(() => {
    if (!data?.meta) return false;
    return offset + LIMIT < data.meta.total;
  }, [data?.meta, offset]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const onEdit = (row: School) => {
    setEditing(row);
    setForm({
      name: row.name,
      code: row.code,
      address: row.address ?? "",
      npsn: row.npsn ?? "",
      principal_name: row.principal_name ?? "",
      principal_nip: row.principal_nip ?? "",
      headmaster_sign: row.headmaster_sign ?? "",
      school_stamp: row.school_stamp ?? "",
    });
    setOpenModal(true);
  };

  const openCreateModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpenModal(true);
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Schools (Super Admin)</h1>
        <button onClick={openCreateModal} className="rounded bg-black px-3 py-2 text-sm text-white">Add School</button>
      </div>

      {isLoading && <p>Loading...</p>}
      {isError && <p className="text-red-600">Gagal ambil data schools.</p>}

      {!!data && (
        <>
          <div className="mb-3 text-sm text-gray-600">
            Total: {data.meta.total} • Menampilkan: {data.meta.count} • Offset: {data.meta.offset}
          </div>

          <div className="overflow-x-auto rounded border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="border-b px-3 py-2">ID</th>
                  <th className="border-b px-3 py-2">Name</th>
                  <th className="border-b px-3 py-2">Code</th>
                  <th className="border-b px-3 py-2">NPSN</th>
                  <th className="border-b px-3 py-2">Principal</th>
                  <th className="border-b px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((s) => (
                  <tr key={s.id}>
                    <td className="border-b px-3 py-2">{s.id}</td>
                    <td className="border-b px-3 py-2">{s.name}</td>
                    <td className="border-b px-3 py-2">{s.code}</td>
                    <td className="border-b px-3 py-2">{s.npsn ?? "-"}</td>
                    <td className="border-b px-3 py-2">{s.principal_name ?? "-"}</td>
                    <td className="border-b px-3 py-2">
                      <div className="flex gap-2">
                        <button onClick={() => onEdit(s)} className="rounded border px-2 py-1 text-xs">Edit</button>
                        <button onClick={() => deleteMutation.mutate(s.id)} className="rounded border border-red-300 px-2 py-1 text-xs text-red-600">Delete</button>
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

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Update School" : "Create School"}</h2>
              <button
                onClick={() => setOpenModal(false)}
                className="rounded border px-2 py-1 text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              <input className="rounded border px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
              <input className="rounded border px-3 py-2" placeholder="Code" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required />
              <input className="rounded border px-3 py-2" placeholder="Address" value={form.address ?? ""} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
              <input className="rounded border px-3 py-2" placeholder="NPSN" value={form.npsn ?? ""} onChange={(e) => setForm((p) => ({ ...p, npsn: e.target.value }))} />
              <input className="rounded border px-3 py-2" placeholder="Principal Name" value={form.principal_name ?? ""} onChange={(e) => setForm((p) => ({ ...p, principal_name: e.target.value }))} />
              <input className="rounded border px-3 py-2" placeholder="Principal NIP" value={form.principal_nip ?? ""} onChange={(e) => setForm((p) => ({ ...p, principal_nip: e.target.value }))} />
              <input className="rounded border px-3 py-2" placeholder="Headmaster Sign URL" value={form.headmaster_sign ?? ""} onChange={(e) => setForm((p) => ({ ...p, headmaster_sign: e.target.value }))} />
              <input className="rounded border px-3 py-2" placeholder="School Stamp URL" value={form.school_stamp ?? ""} onChange={(e) => setForm((p) => ({ ...p, school_stamp: e.target.value }))} />
              <button className="rounded bg-black px-3 py-2 text-white lg:col-span-2" type="submit">
                {editing ? "Update School" : "Create School"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
