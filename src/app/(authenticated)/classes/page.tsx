"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { auth } from "@/lib/auth";
import type { ListResponse } from "@/types/api";
import type { ClassItem } from "@/types/class";
import { Modal } from "@/components/ui/modal";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/components/ui/toast-provider";
import { BookText, Eye, Layers, Pencil, Plus, School, Trash2, UserRound } from "lucide-react";

const DEFAULT_LIMIT = 10;

type ClassPayload = {
  name: string;
  level: string;
  homeroom?: string;
  academic_year: string;
  school_id?: number;
};

type SchoolOption = {
  id: number;
  name: string;
};

const emptyForm: ClassPayload = {
  name: "",
  level: "",
  homeroom: "",
  academic_year: "",
};

export default function ClassesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const role = auth.getRole();
  const isSuperAdmin = role === "super_admin";

  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [form, setForm] = useState<ClassPayload>(emptyForm);
  const [editing, setEditing] = useState<ClassItem | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [detailClass, setDetailClass] = useState<ClassItem | null>(null);

  const schoolsQuery = useQuery({
    queryKey: ["class-form", "schools", isSuperAdmin],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const res = await api.get<ListResponse<SchoolOption>>("/schools?offset=0&limit=100");
      return res.data;
    },
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["classes", offset, limit],
    queryFn: async () => {
      const res = await api.get<ListResponse<ClassItem>>(`/classes?offset=${offset}&limit=${limit}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: ClassPayload) => api.post("/classes", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setForm(emptyForm);
      setOpenModal(false);
      showToast("Kelas berhasil dibuat", "success");
    },
    onError: () => showToast("Gagal membuat kelas", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ClassPayload }) => api.put(`/classes/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setEditing(null);
      setForm(emptyForm);
      setOpenModal(false);
      showToast("Kelas berhasil diupdate", "success");
    },
    onError: () => showToast("Gagal update kelas", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/classes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      showToast("Kelas berhasil dihapus", "success");
    },
    onError: () => showToast("Gagal hapus kelas", "error"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSuperAdmin && !form.school_id) {
      showToast("Sekolah wajib dipilih untuk super admin", "error");
      return;
    }

    if (editing) {
      updateMutation.mutate({ id: editing.uuid ?? String(editing.id), payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const onEdit = (row: ClassItem) => {
    setEditing(row);
    setForm({
      name: row.name,
      level: row.level,
      homeroom: row.homeroom ?? "",
      academic_year: row.academic_year,
      school_id: row.school_id,
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
        <h1 className="text-2xl font-semibold">Kelas</h1>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <Plus className="size-4" /> Tambah Kelas
        </button>
      </div>

      {isLoading && <p>Memuat...</p>}
      {isError && <p className="text-red-600">Gagal ambil data kelas.</p>}

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
            {
              key: "no",
              header: "No",
              render: (_row, idx) => <span className="text-sm font-medium text-slate-700">{offset + idx + 1}</span>,
            },
            {
              key: "kelas",
              header: "Kelas",
              render: (k) => (
                <>
                  <div className="font-medium text-slate-900">{k.name}</div>
                  <div className="text-xs text-slate-500">Wali kelas: {k.homeroom || "-"}</div>
                </>
              ),
            },
            {
              key: "tingkat",
              header: "Tingkat",
              render: (k) => <span className="text-sm text-slate-700">{k.level}</span>,
            },
            ...(isSuperAdmin
              ? [
                  {
                    key: "sekolah",
                    header: "Sekolah",
                    render: (k: ClassItem) => {
                      const schoolName = schoolsQuery.data?.data.find((s) => s.id === k.school_id)?.name;
                      return <span className="text-sm text-slate-700">{schoolName ?? `ID ${k.school_id ?? "-"}`}</span>;
                    },
                  },
                ]
              : []),
            {
              key: "tahun",
              header: "Tahun Ajaran",
              render: (k) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{k.academic_year}</span>,
            },
            {
              key: "aksi",
              header: "Aksi",
              className: "text-right",
              render: (k) => (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setDetailClass(k)}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                  >
                    <Eye className="size-3" /> Detail
                  </button>
                  <button
                    onClick={() => onEdit(k)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    <Pencil className="size-3" /> Edit
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(k.uuid ?? String(k.id))}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                  >
                    <Trash2 className="size-3" /> Hapus
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal open={openModal} title={editing ? "Ubah Kelas" : "Tambah Kelas"} onClose={() => setOpenModal(false)}>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {isSuperAdmin && (
            <Field label="Sekolah" required icon={School}>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                value={form.school_id ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    school_id: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                required
              >
                <option value="">Pilih sekolah</option>
                {(schoolsQuery.data?.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Nama Kelas" required icon={School}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Nama Kelas" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          </Field>
          <Field label="Tingkat" required icon={Layers}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Contoh: 7, 8, 9" value={form.level} onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))} required />
          </Field>
          <Field label="Wali Kelas" icon={UserRound}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Nama wali kelas" value={form.homeroom ?? ""} onChange={(e) => setForm((p) => ({ ...p, homeroom: e.target.value }))} />
          </Field>
          <Field label="Tahun Ajaran" required icon={BookText}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="2025/2026" value={form.academic_year} onChange={(e) => setForm((p) => ({ ...p, academic_year: e.target.value }))} required />
          </Field>
          <div className="lg:col-span-2 flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setOpenModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
            <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700" type="submit">
              {editing ? "Simpan Perubahan" : "Buat Kelas"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detailClass} title="Detail Kelas" onClose={() => setDetailClass(null)}>
        {detailClass && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <DetailItem label="Nama Kelas" value={detailClass.name} />
            <DetailItem label="Tingkat" value={detailClass.level} />
            <DetailItem label="Wali Kelas" value={detailClass.homeroom} />
            <DetailItem label="Tahun Ajaran" value={detailClass.academic_year} />
            {isSuperAdmin && (
              <DetailItem
                label="Sekolah"
                value={schoolsQuery.data?.data.find((s) => s.id === detailClass.school_id)?.name ?? (detailClass.school_id ? `ID ${detailClass.school_id}` : "-")}
              />
            )}
          </div>
        )}
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
          {required ? "Wajib" : "Opsional"}
        </span>
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
