"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { auth } from "@/lib/auth";
import type { ListResponse } from "@/types/api";
import type { Student } from "@/types/student";
import type { ClassItem } from "@/types/class";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast-provider";
import { Eye, Layers, Mail, Pencil, Plus, School, Trash2, UserRound } from "lucide-react";

const DEFAULT_LIMIT = 10;

type SchoolOption = { id: number; name: string };

type StudentPayload = {
  name: string;
  email: string;
  type: "junior" | "senior";
  class_id?: number;
  school_id?: number;
};

const emptyForm: StudentPayload = {
  name: "",
  email: "",
  type: "junior",
  class_id: undefined,
  school_id: undefined,
};

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const role = auth.getRole();
  const isSuperAdmin = role === "super_admin";

  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [form, setForm] = useState<StudentPayload>(emptyForm);
  const [editing, setEditing] = useState<Student | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["students", offset, limit],
    queryFn: async () => {
      const res = await api.get<ListResponse<Student>>(`/students?offset=${offset}&limit=${limit}`);
      return res.data;
    },
  });

  const classesQuery = useQuery({
    queryKey: ["student-form", "classes", isSuperAdmin],
    queryFn: async () => {
      const res = await api.get<ListResponse<ClassItem>>("/classes?offset=0&limit=200");
      return res.data;
    },
  });

  const schoolsQuery = useQuery({
    queryKey: ["student-form", "schools", isSuperAdmin],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const res = await api.get<ListResponse<SchoolOption>>("/schools?offset=0&limit=100");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: StudentPayload) => api.post("/students", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setForm(emptyForm);
      setOpenModal(false);
      showToast("Siswa berhasil dibuat", "success");
    },
    onError: () => showToast("Gagal membuat siswa", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: StudentPayload }) => api.put(`/students/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setEditing(null);
      setForm(emptyForm);
      setOpenModal(false);
      showToast("Siswa berhasil diupdate", "success");
    },
    onError: () => showToast("Gagal update siswa", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      showToast("Siswa berhasil dihapus", "success");
    },
    onError: () => showToast("Gagal hapus siswa", "error"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSuperAdmin && !form.school_id) {
      showToast("Sekolah wajib dipilih untuk super admin", "error");
      return;
    }

    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const onEdit = (s: Student) => {
    setEditing(s);
    setForm({
      name: s.name,
      email: s.email,
      type: s.type,
      class_id: s.class_id,
      school_id: s.school_id,
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
        <h1 className="text-2xl font-semibold">Siswa</h1>
        <button onClick={openCreateModal} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700">
          <Plus className="size-4" /> Tambah Siswa
        </button>
      </div>

      {isLoading && <p>Memuat...</p>}
      {isError && <p className="text-red-600">Gagal ambil data siswa.</p>}

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
              key: "nama",
              header: "Nama",
              render: (s) => (
                <>
                  <div className="font-medium text-slate-900">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.email}</div>
                </>
              ),
            },
            {
              key: "tipe",
              header: "Tipe",
              render: (s) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{s.type}</span>,
            },
            {
              key: "kelas",
              header: "Kelas",
              render: (s) => {
                const kelas = classesQuery.data?.data.find((k) => k.id === s.class_id);
                return <span className="text-sm text-slate-700">{kelas ? `${kelas.name} (${kelas.level})` : "-"}</span>;
              },
            },
            {
              key: "aksi",
              header: "Aksi",
              className: "text-right",
              render: (s) => (
                <div className="flex justify-end gap-2">
                  <button onClick={() => setDetailStudent(s)} className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100">
                    <Eye className="size-3" /> Detail
                  </button>
                  <button onClick={() => onEdit(s)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100">
                    <Pencil className="size-3" /> Edit
                  </button>
                  <button onClick={() => deleteMutation.mutate(s.id)} className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100">
                    <Trash2 className="size-3" /> Hapus
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal open={openModal} title={editing ? "Ubah Siswa" : "Tambah Siswa"} onClose={() => setOpenModal(false)}>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {isSuperAdmin && (
            <Field label="Sekolah" required icon={School}>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                value={form.school_id ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, school_id: e.target.value ? Number(e.target.value) : undefined }))}
                required
              >
                <option value="">Pilih sekolah</option>
                {(schoolsQuery.data?.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Nama" required icon={UserRound}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Nama siswa" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          </Field>
          <Field label="Email" required icon={Mail}>
            <input type="email" className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="email@contoh.com" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
          </Field>
          <Field label="Tipe" required icon={Layers}>
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "junior" | "senior" }))}>
              <option value="junior">junior</option>
              <option value="senior">senior</option>
            </select>
          </Field>
          <Field label="Kelas" icon={School}>
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.class_id ?? ""} onChange={(e) => setForm((p) => ({ ...p, class_id: e.target.value ? Number(e.target.value) : undefined }))}>
              <option value="">Pilih kelas (opsional)</option>
              {(classesQuery.data?.data ?? []).map((k) => (
                <option key={k.id} value={k.id}>{k.name} ({k.level})</option>
              ))}
            </select>
          </Field>

          <div className="lg:col-span-2 flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setOpenModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
            <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700" type="submit">
              {editing ? "Simpan Perubahan" : "Buat Siswa"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detailStudent} title="Detail Siswa" onClose={() => setDetailStudent(null)}>
        {detailStudent && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <DetailItem label="Nama" value={detailStudent.name} />
            <DetailItem label="Email" value={detailStudent.email} />
            <DetailItem label="Tipe" value={detailStudent.type} />
            <DetailItem label="Kelas" value={classesQuery.data?.data.find((k) => k.id === detailStudent.class_id)?.name} />
            {isSuperAdmin && (
              <DetailItem label="Sekolah" value={schoolsQuery.data?.data.find((s) => s.id === detailStudent.school_id)?.name} />
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
