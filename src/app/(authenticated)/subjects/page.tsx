"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { auth } from "@/lib/auth";
import type { ListResponse } from "@/types/api";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast-provider";
import { BookOpenText, Eye, Pencil, Plus, School, Trash2, UserRound } from "lucide-react";

const DEFAULT_LIMIT = 10;

type SchoolOption = { id: number; name: string };

type SubjectItem = {
  id: number;
  title: string;
  author: string;
  school_id?: number;
};

type SubjectPayload = {
  title: string;
  author: string;
  school_id?: number;
};

const emptyForm: SubjectPayload = {
  title: "",
  author: "",
  school_id: undefined,
};

export default function BooksPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const role = auth.getRole();
  const isSuperAdmin = role === "super_admin";

  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [form, setForm] = useState<SubjectPayload>(emptyForm);
  const [editing, setEditing] = useState<SubjectItem | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [detailBook, setDetailBook] = useState<SubjectItem | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["subjects", offset, limit],
    queryFn: async () => {
      const res = await api.get<ListResponse<SubjectItem>>(`/subjects?offset=${offset}&limit=${limit}`);
      return res.data;
    },
  });

  const schoolsQuery = useQuery({
    queryKey: ["book-form", "schools", isSuperAdmin],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const res = await api.get<ListResponse<SchoolOption>>("/schools?offset=0&limit=100");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: SubjectPayload) => api.post("/subjects", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setForm(emptyForm);
      setOpenModal(false);
      showToast("Mata pelajaran berhasil dibuat", "success");
    },
    onError: () => showToast("Gagal membuat mata pelajaran", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SubjectPayload }) => api.put(`/subjects/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setEditing(null);
      setForm(emptyForm);
      setOpenModal(false);
      showToast("Mata pelajaran berhasil diupdate", "success");
    },
    onError: () => showToast("Gagal update mata pelajaran", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/subjects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      showToast("Mata pelajaran berhasil dihapus", "success");
    },
    onError: () => showToast("Gagal hapus mata pelajaran", "error"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSuperAdmin && !form.school_id) {
      showToast("Sekolah wajib dipilih untuk super admin", "error");
      return;
    }

    if (editing) updateMutation.mutate({ id: editing.id, payload: form });
    else createMutation.mutate(form);
  };

  const onEdit = (b: SubjectItem) => {
    setEditing(b);
    setForm({ title: b.title, author: b.author, school_id: b.school_id });
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
        <h1 className="text-2xl font-semibold">Mata Pelajaran</h1>
        <button onClick={openCreateModal} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700">
          <Plus className="size-4" /> Tambah Mata Pelajaran
        </button>
      </div>

      {isLoading && <p>Memuat...</p>}
      {isError && <p className="text-red-600">Gagal ambil data mata pelajaran.</p>}

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
            { key: "no", header: "No", render: (_r, idx) => <span className="text-sm font-medium text-slate-700">{offset + idx + 1}</span> },
            {
              key: "mapel",
              header: "Mata Pelajaran",
              render: (b) => (
                <>
                  <div className="font-medium text-slate-900">{b.title}</div>
                  <div className="text-xs text-slate-500">Pengampu: {b.author || "-"}</div>
                </>
              ),
            },
            {
              key: "sekolah",
              header: "Sekolah",
              render: (b) => {
                if (!isSuperAdmin) return <span className="text-sm text-slate-700">-</span>;
                const school = schoolsQuery.data?.data.find((s) => s.id === b.school_id);
                return <span className="text-sm text-slate-700">{school?.name ?? (b.school_id ? `ID ${b.school_id}` : "-")}</span>;
              },
            },
            {
              key: "aksi",
              header: "Aksi",
              className: "text-right",
              render: (b) => (
                <div className="flex justify-end gap-2">
                  <button onClick={() => setDetailBook(b)} className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100">
                    <Eye className="size-3" /> Detail
                  </button>
                  <button onClick={() => onEdit(b)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100">
                    <Pencil className="size-3" /> Edit
                  </button>
                  <button onClick={() => deleteMutation.mutate(b.id)} className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100">
                    <Trash2 className="size-3" /> Hapus
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal open={openModal} title={editing ? "Ubah Mata Pelajaran" : "Tambah Mata Pelajaran"} onClose={() => setOpenModal(false)}>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {isSuperAdmin && (
            <Field label="Sekolah" required icon={School}>
              <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.school_id ?? ""} onChange={(e) => setForm((p) => ({ ...p, school_id: e.target.value ? Number(e.target.value) : undefined }))} required>
                <option value="">Pilih sekolah</option>
                {(schoolsQuery.data?.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Nama Mata Pelajaran" required icon={BookOpenText}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Contoh: Matematika" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          </Field>
          <Field label="Pengampu" required icon={UserRound}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Nama guru pengampu" value={form.author} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} required />
          </Field>

          <div className="lg:col-span-2 flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setOpenModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
            <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700" type="submit">
              {editing ? "Simpan Perubahan" : "Buat Mata Pelajaran"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detailBook} title="Detail Mata Pelajaran" onClose={() => setDetailBook(null)}>
        {detailBook && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <DetailItem label="Nama Mata Pelajaran" value={detailBook.title} />
            <DetailItem label="Pengampu" value={detailBook.author} />
            {isSuperAdmin && (
              <DetailItem label="Sekolah" value={schoolsQuery.data?.data.find((s) => s.id === detailBook.school_id)?.name ?? (detailBook.school_id ? `ID ${detailBook.school_id}` : "-")} />
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

function Field({ label, required, icon: Icon, children }: { label: string; required?: boolean; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="inline-flex items-center gap-1.5 text-slate-700">
        <Icon className="size-3.5 text-slate-500" />
        <span className="font-medium">{label}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${required ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`}>{required ? "Wajib" : "Opsional"}</span>
      </span>
      {children}
    </label>
  );
}

function DetailItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm text-slate-800 break-all">{value || "-"}</div>
    </div>
  );
}
