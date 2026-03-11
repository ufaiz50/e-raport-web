"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { auth } from "@/lib/auth";
import type { ListResponse } from "@/types/api";
import { Modal } from "@/components/ui/modal";
import { BookText, Hash, ImageIcon, MapPin, Pencil, Plus, School, Signature, Trash2, UserRound } from "lucide-react";

const DEFAULT_LIMIT = 10;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

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
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
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
    queryKey: ["schools", offset, limit],
    queryFn: async () => {
      const res = await api.get<ListResponse<School>>(`/schools?offset=${offset}&limit=${limit}`);
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
    return offset + limit < data.meta.total;
  }, [data?.meta, offset, limit]);

  const totalPages = useMemo(() => {
    if (!data?.meta?.total) return 1;
    return Math.max(1, Math.ceil(data.meta.total / limit));
  }, [data, limit]);

  const currentPage = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);

  const pageNumbers = useMemo(() => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    if (totalPages <= 7) return pages;

    if (currentPage <= 4) return [1, 2, 3, 4, 5, -1, totalPages];
    if (currentPage >= totalPages - 3) return [1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
  }, [currentPage, totalPages]);

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
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <Plus className="size-4" /> Add School
        </button>
      </div>

      {isLoading && <p>Loading...</p>}
      {isError && <p className="text-red-600">Gagal ambil data schools.</p>}

      {!!data && (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
            <div>
              Total: <span className="font-semibold text-slate-800">{data.meta.total}</span> • Menampilkan: <span className="font-semibold text-slate-800">{data.meta.count}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500">Data per page</label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setOffset(0);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">No</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">School</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Code</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">NPSN</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Principal</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((s, idx) => (
                    <tr key={s.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"} transition hover:bg-indigo-50/50`}>
                      <td className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-700">{offset + idx + 1}</td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <div className="font-medium text-slate-900">{s.name}</div>
                        <div className="text-xs text-slate-500">{s.address || "No address"}</div>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">{s.code}</td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{s.npsn ?? "-"}</span>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">{s.principal_name ?? "-"}</td>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => onEdit(s)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            <Pencil className="size-3" /> Edit
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(s.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                          >
                            <Trash2 className="size-3" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button disabled={!canPrev} onClick={() => setOffset((p) => Math.max(0, p - limit))} className="rounded border px-3 py-2 text-sm disabled:opacity-40">Prev</button>
            <div className="flex items-center gap-1">
              {pageNumbers.map((p, idx) =>
                p === -1 ? (
                  <span key={`dots-${idx}`} className="px-2 text-slate-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setOffset((p - 1) * limit)}
                    className={`rounded-lg px-3 py-1.5 text-sm ${p === currentPage ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                  >
                    {p}
                  </button>
                ),
              )}
            </div>
            <button disabled={!canNext} onClick={() => setOffset((p) => p + limit)} className="rounded border px-3 py-2 text-sm disabled:opacity-40">Next</button>
          </div>
        </>
      )}

      <Modal open={openModal} title={editing ? "Update School" : "Create School"} onClose={() => setOpenModal(false)}>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Field label="School Name" required icon={School}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="School Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          </Field>
          <Field label="Code" required icon={BookText}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Code" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required />
          </Field>
          <Field label="Address" icon={MapPin}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Address" value={form.address ?? ""} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
          </Field>
          <Field label="NPSN" icon={Hash}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="NPSN" value={form.npsn ?? ""} onChange={(e) => setForm((p) => ({ ...p, npsn: e.target.value }))} />
          </Field>
          <Field label="Principal Name" icon={UserRound}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Principal Name" value={form.principal_name ?? ""} onChange={(e) => setForm((p) => ({ ...p, principal_name: e.target.value }))} />
          </Field>
          <Field label="Principal NIP" icon={Signature}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Principal NIP" value={form.principal_nip ?? ""} onChange={(e) => setForm((p) => ({ ...p, principal_nip: e.target.value }))} />
          </Field>
          <Field label="Headmaster Sign URL" icon={ImageIcon}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Headmaster Sign URL" value={form.headmaster_sign ?? ""} onChange={(e) => setForm((p) => ({ ...p, headmaster_sign: e.target.value }))} />
          </Field>
          <Field label="School Stamp URL" icon={ImageIcon}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="School Stamp URL" value={form.school_stamp ?? ""} onChange={(e) => setForm((p) => ({ ...p, school_stamp: e.target.value }))} />
          </Field>
          <div className="lg:col-span-2 flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setOpenModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700" type="submit">
              {editing ? "Update School" : "Create School"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Field({
  label,
  required,
  icon: Icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="inline-flex items-center gap-1.5 text-slate-700">
        <Icon className="size-3.5 text-slate-500" />
        <span className="font-medium">{label}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${required ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
          {required ? "Required" : "Optional"}
        </span>
      </span>
      {children}
    </label>
  );
}
