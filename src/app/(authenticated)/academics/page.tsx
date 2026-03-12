"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ListResponse } from "@/types/api";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast-provider";
import { Plus } from "lucide-react";

type AcademicYear = { id: number; year: string; is_active?: boolean };
type Semester = { id: number; academic_year_id: number; name: string; order_no: number; is_active?: boolean };
type Curriculum = { id: number; name: string; year?: string; description?: string };
type Teaching = { id: number; teacher_id: number; class_id: number; subject_id: number; semester_id?: number };
type Teacher = { id: number; username: string };
type ClassItem = { id: number; name: string; level: string };
type Subject = { id: number; title?: string; name?: string };

export default function AcademicsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [tab, setTab] = useState<"years" | "semesters" | "curriculums" | "teachings">("years");
  const [openModal, setOpenModal] = useState(false);

  const [yearForm, setYearForm] = useState({ year: "", is_active: false });
  const [semesterForm, setSemesterForm] = useState({ academic_year_id: 0, name: "", order_no: 1, is_active: false });
  const [curriculumForm, setCurriculumForm] = useState({ name: "", year: "", description: "" });
  const [teachingForm, setTeachingForm] = useState({ teacher_id: 0, class_id: 0, subject_id: 0, semester_id: 0 });

  const yearsQ = useQuery({ queryKey: ["academic-years"], queryFn: async () => (await api.get<ListResponse<AcademicYear>>("/academic-years?offset=0&limit=200")).data });
  const semestersQ = useQuery({ queryKey: ["semesters"], queryFn: async () => (await api.get<ListResponse<Semester>>("/semesters?offset=0&limit=200")).data });
  const curriculumsQ = useQuery({ queryKey: ["curriculums"], queryFn: async () => (await api.get<ListResponse<Curriculum>>("/curriculums?offset=0&limit=200")).data });
  const teachingsQ = useQuery({ queryKey: ["teachings"], queryFn: async () => (await api.get<ListResponse<Teaching>>("/teachings?offset=0&limit=200")).data });

  const teachersQ = useQuery({ queryKey: ["teachers-lookup"], queryFn: async () => (await api.get<ListResponse<Teacher>>("/teachers?offset=0&limit=200")).data });
  const classesQ = useQuery({ queryKey: ["classes-lookup"], queryFn: async () => (await api.get<ListResponse<ClassItem>>("/classes?offset=0&limit=200")).data });
  const subjectsQ = useQuery({ queryKey: ["subjects-lookup"], queryFn: async () => (await api.get<ListResponse<Subject>>("/subjects?offset=0&limit=200")).data });

  const createYear = useMutation({ mutationFn: () => api.post("/academic-years", yearForm), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["academic-years"] }); setOpenModal(false); showToast("Tahun ajaran berhasil dibuat", "success"); }, onError: () => showToast("Gagal membuat tahun ajaran", "error") });
  const createSemester = useMutation({ mutationFn: () => api.post("/semesters", semesterForm), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["semesters"] }); setOpenModal(false); showToast("Semester berhasil dibuat", "success"); }, onError: () => showToast("Gagal membuat semester", "error") });
  const createCurriculum = useMutation({ mutationFn: () => api.post("/curriculums", curriculumForm), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculums"] }); setOpenModal(false); showToast("Kurikulum berhasil dibuat", "success"); }, onError: () => showToast("Gagal membuat kurikulum", "error") });
  const createTeaching = useMutation({ mutationFn: () => api.post("/teachings", teachingForm), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["teachings"] }); setOpenModal(false); showToast("Data pengajaran berhasil dibuat", "success"); }, onError: () => showToast("Gagal membuat data pengajaran", "error") });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Akademik</h1>
        <button onClick={() => setOpenModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"><Plus className="size-4" /> Tambah Data</button>
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
        ]} />
      )}

      {tab === "semesters" && !!semestersQ.data && (
        <DataTable rows={semestersQ.data.data} total={semestersQ.data.meta.total} offset={0} limit={200} onOffsetChange={() => {}} onLimitChange={() => {}} rowKey={(r) => r.id} columns={[
          { key: "no", header: "No", render: (_r, i) => i + 1 },
          { key: "year", header: "Tahun Ajaran", render: (r) => yearsQ.data?.data.find((y) => y.id === r.academic_year_id)?.year ?? "-" },
          { key: "name", header: "Nama Semester", render: (r) => r.name },
          { key: "order", header: "Urutan", render: (r) => r.order_no },
        ]} />
      )}

      {tab === "curriculums" && !!curriculumsQ.data && (
        <DataTable rows={curriculumsQ.data.data} total={curriculumsQ.data.meta.total} offset={0} limit={200} onOffsetChange={() => {}} onLimitChange={() => {}} rowKey={(r) => r.id} columns={[
          { key: "no", header: "No", render: (_r, i) => i + 1 },
          { key: "name", header: "Nama Kurikulum", render: (r) => r.name },
          { key: "year", header: "Tahun", render: (r) => r.year || "-" },
          { key: "desc", header: "Deskripsi", render: (r) => r.description || "-" },
        ]} />
      )}

      {tab === "teachings" && !!teachingsQ.data && (
        <DataTable rows={teachingsQ.data.data} total={teachingsQ.data.meta.total} offset={0} limit={200} onOffsetChange={() => {}} onLimitChange={() => {}} rowKey={(r) => r.id} columns={[
          { key: "no", header: "No", render: (_r, i) => i + 1 },
          { key: "guru", header: "Guru", render: (r) => teachersQ.data?.data.find((t) => t.id === r.teacher_id)?.username ?? `ID ${r.teacher_id}` },
          { key: "kelas", header: "Kelas", render: (r) => classesQ.data?.data.find((c) => c.id === r.class_id)?.name ?? `ID ${r.class_id}` },
          { key: "mapel", header: "Mata Pelajaran", render: (r) => (subjectsQ.data?.data.find((s) => s.id === r.subject_id)?.title || subjectsQ.data?.data.find((s) => s.id === r.subject_id)?.name || `ID ${r.subject_id}`) },
          { key: "semester", header: "Semester", render: (r) => semestersQ.data?.data.find((s) => s.id === r.semester_id)?.name ?? "-" },
        ]} />
      )}

      <Modal open={openModal} title="Tambah Data Akademik" onClose={() => setOpenModal(false)}>
        {tab === "years" && (
          <form onSubmit={(e) => { e.preventDefault(); createYear.mutate(); }} className="grid gap-3">
            <input className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Contoh: 2025/2026" value={yearForm.year} onChange={(e) => setYearForm((p) => ({ ...p, year: e.target.value }))} required />
            <label className="text-sm"><input type="checkbox" checked={yearForm.is_active} onChange={(e) => setYearForm((p) => ({ ...p, is_active: e.target.checked }))} /> Tahun aktif</label>
            <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">Simpan</button>
          </form>
        )}

        {tab === "semesters" && (
          <form onSubmit={(e) => { e.preventDefault(); createSemester.mutate(); }} className="grid gap-3">
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
          <form onSubmit={(e) => { e.preventDefault(); createCurriculum.mutate(); }} className="grid gap-3">
            <input className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Nama kurikulum" value={curriculumForm.name} onChange={(e) => setCurriculumForm((p) => ({ ...p, name: e.target.value }))} required />
            <input className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Tahun" value={curriculumForm.year} onChange={(e) => setCurriculumForm((p) => ({ ...p, year: e.target.value }))} />
            <textarea className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Deskripsi" value={curriculumForm.description} onChange={(e) => setCurriculumForm((p) => ({ ...p, description: e.target.value }))} />
            <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">Simpan</button>
          </form>
        )}

        {tab === "teachings" && (
          <form onSubmit={(e) => { e.preventDefault(); createTeaching.mutate(); }} className="grid gap-3">
            <select className="rounded-xl border border-slate-200 px-3 py-2.5" value={teachingForm.teacher_id || ""} onChange={(e) => setTeachingForm((p) => ({ ...p, teacher_id: Number(e.target.value) }))} required>
              <option value="">Pilih guru</option>
              {(teachersQ.data?.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.username}</option>)}
            </select>
            <select className="rounded-xl border border-slate-200 px-3 py-2.5" value={teachingForm.class_id || ""} onChange={(e) => setTeachingForm((p) => ({ ...p, class_id: Number(e.target.value) }))} required>
              <option value="">Pilih kelas</option>
              {(classesQ.data?.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name} ({c.level})</option>)}
            </select>
            <select className="rounded-xl border border-slate-200 px-3 py-2.5" value={teachingForm.subject_id || ""} onChange={(e) => setTeachingForm((p) => ({ ...p, subject_id: Number(e.target.value) }))} required>
              <option value="">Pilih mata pelajaran</option>
              {(subjectsQ.data?.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.title || s.name}</option>)}
            </select>
            <select className="rounded-xl border border-slate-200 px-3 py-2.5" value={teachingForm.semester_id || ""} onChange={(e) => setTeachingForm((p) => ({ ...p, semester_id: Number(e.target.value) }))}>
              <option value="">Pilih semester</option>
              {(semestersQ.data?.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">Simpan</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
