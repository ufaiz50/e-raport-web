"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ListResponse } from "@/types/api";
import type { Teacher } from "@/types/teacher";
import { teacherDisplayName } from "@/types/teacher";
import type { School } from "@/types/school";
import { auth } from "@/lib/auth";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast-provider";
import { Pencil, Plus, Trash2 } from "lucide-react";
import axios from "axios";

type AcademicYear = { id: number; year: string; is_active?: boolean };
type Semester = { id: number; academic_year_id: number; name: string; order_no: number; is_active?: boolean };
type Curriculum = { id: number; name: string; year?: string; description?: string };
type Teaching = { id: number; teacher_id: number; class_id: number; subject_id: number; semester_id?: number };
type ClassItem = { id: number; name: string; level: string };
type Subject = { id: number; title?: string; name?: string };

export default function AcademicsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [tab, setTab] = useState<"years" | "semesters" | "curriculums" | "teachings">("years");
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "year" | "semester" | "curriculum" | "teaching"; id: number; label: string } | null>(null);

  const [yearForm, setYearForm] = useState({ year: "", is_active: false });
  const [semesterForm, setSemesterForm] = useState({ academic_year_id: 0, name: "", order_no: 1, is_active: false });
  const [curriculumForm, setCurriculumForm] = useState({ name: "", year: "", description: "" });
  const [teachingForm, setTeachingForm] = useState({ teacher_id: 0, class_id: 0, subject_id: 0, semester_id: 0 });

  // Super admin can work across multiple schools; others are bound to their school from token.
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | "">("");

  const role = useMemo(() => auth.getRole(), []);
  const isSuperAdmin = role === "super_admin";

  const yearsQ = useQuery({ queryKey: ["academic-years"], queryFn: async () => (await api.get<ListResponse<AcademicYear>>("/academic-years?offset=0&limit=200")).data });
  const semestersQ = useQuery({ queryKey: ["semesters"], queryFn: async () => (await api.get<ListResponse<Semester>>("/semesters?offset=0&limit=200")).data });
  const curriculumsQ = useQuery({ queryKey: ["curriculums"], queryFn: async () => (await api.get<ListResponse<Curriculum>>("/curriculums?offset=0&limit=200")).data });
  const teachingsQ = useQuery({ queryKey: ["teachings"], queryFn: async () => (await api.get<ListResponse<Teaching>>("/teachings?offset=0&limit=200")).data });

  const teachersQ = useQuery({ queryKey: ["teachers-lookup"], queryFn: async () => (await api.get<ListResponse<Teacher>>("/teachers?offset=0&limit=200")).data });
  const classesQ = useQuery({ queryKey: ["classes-lookup"], queryFn: async () => (await api.get<ListResponse<ClassItem>>("/classes?offset=0&limit=200")).data });
  const subjectsQ = useQuery({ queryKey: ["subjects-lookup"], queryFn: async () => (await api.get<ListResponse<Subject>>("/subjects?offset=0&limit=200")).data });

  const schoolsQ = useQuery({
    queryKey: ["schools-lookup"],
    // Only super admin is allowed to hit /schools; others will get 403 so we short-circuit.
    enabled: isSuperAdmin,
    queryFn: async () => {
      const res = await api.get<ListResponse<School>>("/schools?offset=0&limit=200");
      return res.data;
    },
  });

  // Helper: attach school_id when super admin has selected a school.
  const withSchool = <T extends object>(payload: T): T & { school_id?: number } => {
    if (isSuperAdmin && selectedSchoolId) {
      return { ...(payload as T), school_id: selectedSchoolId as number };
    }
    return payload as T & { school_id?: number };
  };

  const createYear = useMutation({ mutationFn: () => api.post("/academic-years", withSchool(yearForm)), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["academic-years"] }); setOpenModal(false); showToast("Tahun ajaran berhasil dibuat", "success"); }, onError: () => showToast("Gagal membuat tahun ajaran", "error") });
  const updateYear = useMutation({ mutationFn: () => api.put(`/academic-years/${editingId}`, withSchool(yearForm)), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["academic-years"] }); setOpenModal(false); setEditingId(null); showToast("Tahun ajaran berhasil diupdate", "success"); }, onError: () => showToast("Gagal update tahun ajaran", "error") });
  const deleteYear = useMutation({ mutationFn: (id: number) => api.delete(`/academic-years/${id}`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["academic-years"] }); showToast("Tahun ajaran berhasil dihapus", "success"); }, onError: (e) => showToast((axios.isAxiosError(e) ? (e.response?.data as { error?: string } | undefined)?.error : undefined) || "Gagal hapus tahun ajaran", "error") });
  const createSemester = useMutation({ mutationFn: () => api.post("/semesters", withSchool(semesterForm)), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["semesters"] }); setOpenModal(false); showToast("Semester berhasil dibuat", "success"); }, onError: () => showToast("Gagal membuat semester", "error") });
  const updateSemester = useMutation({ mutationFn: () => api.put(`/semesters/${editingId}`, withSchool(semesterForm)), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["semesters"] }); setOpenModal(false); setEditingId(null); showToast("Semester berhasil diupdate", "success"); }, onError: () => showToast("Gagal update semester", "error") });
  const deleteSemester = useMutation({ mutationFn: (id: number) => api.delete(`/semesters/${id}`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["semesters"] }); showToast("Semester berhasil dihapus", "success"); }, onError: (e) => showToast((axios.isAxiosError(e) ? (e.response?.data as { error?: string } | undefined)?.error : undefined) || "Gagal hapus semester", "error") });
  const createCurriculum = useMutation({ mutationFn: () => api.post("/curriculums", withSchool(curriculumForm)), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculums"] }); setOpenModal(false); showToast("Kurikulum berhasil dibuat", "success"); }, onError: () => showToast("Gagal membuat kurikulum", "error") });
  const updateCurriculum = useMutation({ mutationFn: () => api.put(`/curriculums/${editingId}`, withSchool(curriculumForm)), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculums"] }); setOpenModal(false); setEditingId(null); showToast("Kurikulum berhasil diupdate", "success"); }, onError: () => showToast("Gagal update kurikulum", "error") });
  const deleteCurriculum = useMutation({ mutationFn: (id: number) => api.delete(`/curriculums/${id}`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculums"] }); showToast("Kurikulum berhasil dihapus", "success"); }, onError: (e) => showToast((axios.isAxiosError(e) ? (e.response?.data as { error?: string } | undefined)?.error : undefined) || "Gagal hapus kurikulum", "error") });
  const createTeaching = useMutation({ mutationFn: () => api.post("/teachings", withSchool(teachingForm)), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["teachings"] }); setOpenModal(false); showToast("Data pengajaran berhasil dibuat", "success"); }, onError: () => showToast("Gagal membuat data pengajaran", "error") });
  const updateTeaching = useMutation({ mutationFn: () => api.put(`/teachings/${editingId}`, withSchool(teachingForm)), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["teachings"] }); setOpenModal(false); setEditingId(null); showToast("Data pengajaran berhasil diupdate", "success"); }, onError: () => showToast("Gagal update data pengajaran", "error") });
  const deleteTeaching = useMutation({ mutationFn: (id: number) => api.delete(`/teachings/${id}`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["teachings"] }); showToast("Data pengajaran berhasil dihapus", "success"); }, onError: (e) => showToast((axios.isAxiosError(e) ? (e.response?.data as { error?: string } | undefined)?.error : undefined) || "Gagal hapus data pengajaran", "error") });

  const openCreate = () => { setEditingId(null); setOpenModal(true); };

  const runDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "year") deleteYear.mutate(deleteTarget.id);
    if (deleteTarget.kind === "semester") deleteSemester.mutate(deleteTarget.id);
    if (deleteTarget.kind === "curriculum") deleteCurriculum.mutate(deleteTarget.id);
    if (deleteTarget.kind === "teaching") deleteTeaching.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Akademik</h1>
          {isSuperAdmin && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>Sekolah:</span>
              <select
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Pilih sekolah</option>
                {(schoolsQ.data?.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"><Plus className="size-4" /> Tambah Data</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["years", "Tahun Ajaran"],
          ["semesters", "Semester"],
          ["curriculums", "Kurikulum"],
          ["teachings", "Pengajaran"],
        ].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k as typeof tab)} className={`rounded-lg px-3 py-1.5 text-sm ${tab === k ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-700"}`}>{label}</button>
        ))}
      </div>

      {tab === "years" && !!yearsQ.data && (
        <DataTable rows={yearsQ.data.data} total={yearsQ.data.meta.total} offset={0} limit={200} onOffsetChange={() => {}} onLimitChange={() => {}} rowKey={(r) => r.id} columns={[
          { key: "no", header: "No", render: (_r, i) => i + 1 },
          { key: "year", header: "Tahun", render: (r) => r.year },
          { key: "active", header: "Aktif", render: (r) => (r.is_active ? "Ya" : "Tidak") },
          { key: "aksi", header: "Aksi", className: "text-right", render: (r) => <div className="flex justify-end gap-2"><button onClick={() => { setEditingId(r.id); setYearForm({ year: r.year, is_active: !!r.is_active }); setOpenModal(true); }} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs"><Pencil className="size-3" /> Edit</button><button onClick={() => setDeleteTarget({ kind: "year", id: r.id, label: `Tahun Ajaran ${r.year}` })} className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs text-rose-700"><Trash2 className="size-3" /> Hapus</button></div> },
        ]} />
      )}

      {tab === "semesters" && !!semestersQ.data && (
        <DataTable rows={semestersQ.data.data} total={semestersQ.data.meta.total} offset={0} limit={200} onOffsetChange={() => {}} onLimitChange={() => {}} rowKey={(r) => r.id} columns={[
          { key: "no", header: "No", render: (_r, i) => i + 1 },
          { key: "year", header: "Tahun Ajaran", render: (r) => yearsQ.data?.data.find((y) => y.id === r.academic_year_id)?.year ?? "-" },
          { key: "name", header: "Nama Semester", render: (r) => r.name },
          { key: "order", header: "Urutan", render: (r) => r.order_no },
          { key: "aksi", header: "Aksi", className: "text-right", render: (r) => <div className="flex justify-end gap-2"><button onClick={() => { setEditingId(r.id); setSemesterForm({ academic_year_id: r.academic_year_id, name: r.name, order_no: r.order_no, is_active: !!r.is_active }); setOpenModal(true); }} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs"><Pencil className="size-3" /> Edit</button><button onClick={() => setDeleteTarget({ kind: "semester", id: r.id, label: `Semester ${r.name}` })} className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs text-rose-700"><Trash2 className="size-3" /> Hapus</button></div> },
        ]} />
      )}

      {tab === "curriculums" && !!curriculumsQ.data && (
        <DataTable rows={curriculumsQ.data.data} total={curriculumsQ.data.meta.total} offset={0} limit={200} onOffsetChange={() => {}} onLimitChange={() => {}} rowKey={(r) => r.id} columns={[
          { key: "no", header: "No", render: (_r, i) => i + 1 },
          { key: "name", header: "Nama Kurikulum", render: (r) => r.name },
          { key: "year", header: "Tahun", render: (r) => r.year || "-" },
          { key: "desc", header: "Deskripsi", render: (r) => r.description || "-" },
          { key: "aksi", header: "Aksi", className: "text-right", render: (r) => <div className="flex justify-end gap-2"><button onClick={() => { setEditingId(r.id); setCurriculumForm({ name: r.name, year: r.year || "", description: r.description || "" }); setOpenModal(true); }} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs"><Pencil className="size-3" /> Edit</button><button onClick={() => setDeleteTarget({ kind: "curriculum", id: r.id, label: `Kurikulum ${r.name}` })} className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs text-rose-700"><Trash2 className="size-3" /> Hapus</button></div> },
        ]} />
      )}

      {tab === "teachings" && !!teachingsQ.data && (
        <DataTable rows={teachingsQ.data.data} total={teachingsQ.data.meta.total} offset={0} limit={200} onOffsetChange={() => {}} onLimitChange={() => {}} rowKey={(r) => r.id} columns={[
          { key: "no", header: "No", render: (_r, i) => i + 1 },
          {
            key: "guru",
            header: "Guru",
            render: (r) => {
              const t = teachersQ.data?.data.find((t) => t.id === r.teacher_id);
              return teacherDisplayName(t as Teacher) || `ID ${r.teacher_id}`;
            },
          },
          { key: "kelas", header: "Kelas", render: (r) => classesQ.data?.data.find((c) => c.id === r.class_id)?.name ?? `ID ${r.class_id}` },
          { key: "mapel", header: "Mata Pelajaran", render: (r) => (subjectsQ.data?.data.find((s) => s.id === r.subject_id)?.title || subjectsQ.data?.data.find((s) => s.id === r.subject_id)?.name || `ID ${r.subject_id}`) },
          { key: "semester", header: "Semester", render: (r) => semestersQ.data?.data.find((s) => s.id === r.semester_id)?.name ?? "-" },
          { key: "aksi", header: "Aksi", className: "text-right", render: (r) => <div className="flex justify-end gap-2"><button onClick={() => { setEditingId(r.id); setTeachingForm({ teacher_id: r.teacher_id, class_id: r.class_id, subject_id: r.subject_id, semester_id: r.semester_id || 0 }); setOpenModal(true); }} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs"><Pencil className="size-3" /> Edit</button><button onClick={() => setDeleteTarget({ kind: "teaching", id: r.id, label: `Pengajaran #${r.id}` })} className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs text-rose-700"><Trash2 className="size-3" /> Hapus</button></div> },
        ]} />
      )}

      <Modal open={openModal} title={editingId ? "Ubah Data Akademik" : "Tambah Data Akademik"} onClose={() => setOpenModal(false)}>
        {tab === "years" && (
          <form onSubmit={(e) => { e.preventDefault(); if (editingId) updateYear.mutate(); else createYear.mutate(); }} className="grid gap-3">
            <input className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Contoh: 2025/2026" value={yearForm.year} onChange={(e) => setYearForm((p) => ({ ...p, year: e.target.value }))} required />
            <label className="text-sm"><input type="checkbox" checked={yearForm.is_active} onChange={(e) => setYearForm((p) => ({ ...p, is_active: e.target.checked }))} /> Tahun aktif</label>
            <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">Simpan</button>
          </form>
        )}

        {tab === "semesters" && (
          <form onSubmit={(e) => { e.preventDefault(); if (editingId) updateSemester.mutate(); else createSemester.mutate(); }} className="grid gap-3">
            <select className="rounded-xl border border-slate-200 px-3 py-2.5" value={semesterForm.academic_year_id || ""} onChange={(e) => setSemesterForm((p) => ({ ...p, academic_year_id: Number(e.target.value) }))} required>
              <option value="">Pilih tahun ajaran</option>
              {(yearsQ.data?.data ?? []).map((y) => <option key={y.id} value={y.id}>{y.year}</option>)}
            </select>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Nama semester (Ganjil/Genap)" value={semesterForm.name} onChange={(e) => setSemesterForm((p) => ({ ...p, name: e.target.value }))} required />
            <input type="number" min={1} max={2} className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Urutan (1/2)" value={semesterForm.order_no} onChange={(e) => setSemesterForm((p) => ({ ...p, order_no: Number(e.target.value) }))} required />
            <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">Simpan</button>
          </form>
        )}

        {tab === "curriculums" && (
          <form onSubmit={(e) => { e.preventDefault(); if (editingId) updateCurriculum.mutate(); else createCurriculum.mutate(); }} className="grid gap-3">
            <input className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Nama kurikulum" value={curriculumForm.name} onChange={(e) => setCurriculumForm((p) => ({ ...p, name: e.target.value }))} required />
            <input className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Tahun" value={curriculumForm.year} onChange={(e) => setCurriculumForm((p) => ({ ...p, year: e.target.value }))} />
            <textarea className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Deskripsi" value={curriculumForm.description} onChange={(e) => setCurriculumForm((p) => ({ ...p, description: e.target.value }))} />
            <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">Simpan</button>
          </form>
        )}

        {tab === "teachings" && (
          <form onSubmit={(e) => { e.preventDefault(); if (editingId) updateTeaching.mutate(); else createTeaching.mutate(); }} className="grid gap-3">
            <select className="rounded-xl border border-slate-200 px-3 py-2.5" value={teachingForm.teacher_id || ""} onChange={(e) => setTeachingForm((p) => ({ ...p, teacher_id: Number(e.target.value) }))} required>
              <option value="">Pilih guru</option>
              {(teachersQ.data?.data ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {teacherDisplayName(t)}
                </option>
              ))}
            </select>
            <select className="rounded-xl border border-slate-200 px-3 py-2.5" value={teachingForm.class_id || ""} onChange={(e) => setTeachingForm((p) => ({ ...p, class_id: Number(e.target.value) }))} required>
              <option value="">Pilih kelas</option>
              {(classesQ.data?.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name} ({c.level})</option>)}
            </select>
            <select className="rounded-xl border border-slate-200 px-3 py-2.5" value={teachingForm.subject_id || ""} onChange={(e) => setTeachingForm((p) => ({ ...p, subject_id: Number(e.target.value) }))} required>
              <option value="">Pilih mata pelajaran</option>
              {(subjectsQ.data?.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.title || s.name}</option>)}
            </select>
            <select className="rounded-xl border border-slate-200 px-3 py-2.5" value={teachingForm.semester_id || ""} onChange={(e) => setTeachingForm((p) => ({ ...p, semester_id: Number(e.target.value) }))} required>
              <option value="">Pilih semester</option>
              {(semestersQ.data?.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">Simpan</button>
          </form>
        )}
      </Modal>

      <Modal open={!!deleteTarget} title="Konfirmasi Hapus" onClose={() => setDeleteTarget(null)}>
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">Yakin ingin menghapus <span className="font-semibold">{deleteTarget.label}</span>? Aksi ini tidak bisa dibatalkan.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Batal</button>
              <button onClick={runDelete} className="rounded-xl bg-rose-600 px-4 py-2 text-sm text-white">Hapus</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
