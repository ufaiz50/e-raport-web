"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/lib/api/client";
import { auth } from "@/lib/auth";
import type { EntityId, ListResponse } from "@/types/api";
import { getEntityId } from "@/types/api";
import type { Student } from "@/types/student";
import type { ClassItem } from "@/types/class";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast-provider";
import { Check, Eye, Layers, Mail, Pencil, Plus, School, Trash2, UserRound, Users } from "lucide-react";

const DEFAULT_LIMIT = 10;

type SchoolOption = { id?: EntityId; uuid?: EntityId; name: string };

type StudentPayload = {
  nama: string;
  nama_panggilan?: string;
  email?: string;
  nis?: string;
  nisn?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  agama?: string;
  anak_ke?: number;
  jenis_kelamin?: string;
  nama_ayah?: string;
  pekerjaan_ayah?: string;
  nama_ibu?: string;
  pekerjaan_ibu?: string;
  no_hp_orangtua?: string;
  alamat_orangtua_jalan?: string;
  alamat_orangtua_kecamatan?: string;
  alamat_orangtua_kabupaten?: string;
  alamat_orangtua_provinsi?: string;
  nama_wali?: string;
  pekerjaan_wali?: string;
  no_hp_wali?: string;
  alamat_wali_jalan?: string;
  alamat_wali_kecamatan?: string;
  alamat_wali_kabupaten?: string;
  alamat_wali_provinsi?: string;
  tanggal_diterima?: string;
  catatan_guru?: string;
  status?: string;
  class_id: EntityId | undefined;
  school_id?: EntityId;
};

const emptyForm: StudentPayload = {
  nama: "",
  nama_panggilan: "",
  email: "",
  nis: "",
  nisn: "",
  tempat_lahir: "",
  tanggal_lahir: "",
  agama: "",
  anak_ke: undefined,
  jenis_kelamin: "",
  nama_ayah: "",
  pekerjaan_ayah: "",
  nama_ibu: "",
  pekerjaan_ibu: "",
  no_hp_orangtua: "",
  alamat_orangtua_jalan: "",
  alamat_orangtua_kecamatan: "",
  alamat_orangtua_kabupaten: "",
  alamat_orangtua_provinsi: "",
  nama_wali: "",
  pekerjaan_wali: "",
  no_hp_wali: "",
  alamat_wali_jalan: "",
  alamat_wali_kecamatan: "",
  alamat_wali_kabupaten: "",
  alamat_wali_provinsi: "",
  tanggal_diterima: "",
  catatan_guru: "",
  status: "active",
  class_id: undefined,
  school_id: undefined,
};

const studentSteps = [
  { key: "identity", title: "Identitas", description: "Data utama siswa" },
  { key: "family", title: "Orang Tua", description: "Ayah, ibu, dan alamat" },
  { key: "guardian", title: "Wali", description: "Opsional bila ada wali" },
  { key: "academic", title: "Akademik", description: "Kelas, status, dan catatan" },
] as const;

type StudentStepKey = (typeof studentSteps)[number]["key"];

const defaultStep: StudentStepKey = "identity";

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
  const [currentStep, setCurrentStep] = useState<StudentStepKey>(defaultStep);

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

  const visibleClasses = (classesQuery.data?.data ?? []).filter((k) => !isSuperAdmin || !form.school_id || k.school_id === form.school_id);

  const schoolsQuery = useQuery({
    queryKey: ["student-form", "schools", isSuperAdmin],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const res = await api.get<ListResponse<SchoolOption>>("/schools?offset=0&limit=100");
      return res.data;
    },
  });

  const stepIndex = studentSteps.findIndex((step) => step.key === currentStep);
  const currentStepMeta = studentSteps[stepIndex] ?? studentSteps[0];

  const stepCompletion = useMemo<Record<StudentStepKey, boolean>>(() => ({
    identity: Boolean(form.nama && (!isSuperAdmin || form.school_id)),
    family: Boolean(form.nama_ayah || form.nama_ibu || form.no_hp_orangtua || form.alamat_orangtua_jalan),
    guardian: Boolean(form.nama_wali || form.no_hp_wali || form.alamat_wali_jalan),
    academic: Boolean(form.class_id && form.status),
  }), [form, isSuperAdmin]);

  const createMutation = useMutation({
    mutationFn: (payload: StudentPayload) => api.post("/students", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setForm(emptyForm);
      setCurrentStep(defaultStep);
      setOpenModal(false);
      showToast("Siswa berhasil dibuat", "success");
    },
    onError: (error) => {
      const message = axios.isAxiosError(error) ? (error.response?.data as { error?: string } | undefined)?.error : undefined;
      showToast(message || "Gagal membuat siswa", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: EntityId; payload: StudentPayload }) => api.put(`/students/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setEditing(null);
      setForm(emptyForm);
      setCurrentStep(defaultStep);
      setOpenModal(false);
      showToast("Siswa berhasil diupdate", "success");
    },
    onError: (error) => {
      const message = axios.isAxiosError(error) ? (error.response?.data as { error?: string } | undefined)?.error : undefined;
      showToast(message || "Gagal update siswa", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: EntityId) => api.delete(`/students/${id}`),
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
      setCurrentStep("identity");
      return;
    }

    if (!form.class_id) {
      showToast("Kelas wajib dipilih", "error");
      setCurrentStep("academic");
      return;
    }

    const payload: StudentPayload = {
      ...form,
      tanggal_lahir: form.tanggal_lahir ? `${form.tanggal_lahir}T00:00:00Z` : undefined,
      tanggal_diterima: form.tanggal_diterima ? `${form.tanggal_diterima}T00:00:00Z` : undefined,
      anak_ke: form.anak_ke ? Number(form.anak_ke) : undefined,
      email: form.email || undefined,
    };

    if (editing) {
      updateMutation.mutate({ id: getEntityId(editing), payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const onEdit = (s: Student) => {
    setEditing(s);
    setForm({
      nama: s.nama ?? "",
      nama_panggilan: s.nama_panggilan ?? "",
      email: s.email ?? "",
      nis: s.nis ?? "",
      nisn: s.nisn ?? "",
      tempat_lahir: s.tempat_lahir ?? "",
      tanggal_lahir: (s.tanggal_lahir ?? "").slice(0, 10),
      agama: s.agama ?? "",
      anak_ke: s.anak_ke,
      jenis_kelamin: s.jenis_kelamin ?? "",
      nama_ayah: s.nama_ayah ?? "",
      pekerjaan_ayah: s.pekerjaan_ayah ?? "",
      nama_ibu: s.nama_ibu ?? "",
      pekerjaan_ibu: s.pekerjaan_ibu ?? "",
      no_hp_orangtua: s.no_hp_orangtua ?? "",
      alamat_orangtua_jalan: s.alamat_orangtua_jalan ?? "",
      alamat_orangtua_kecamatan: s.alamat_orangtua_kecamatan ?? "",
      alamat_orangtua_kabupaten: s.alamat_orangtua_kabupaten ?? "",
      alamat_orangtua_provinsi: s.alamat_orangtua_provinsi ?? "",
      nama_wali: s.nama_wali ?? "",
      pekerjaan_wali: s.pekerjaan_wali ?? "",
      no_hp_wali: s.no_hp_wali ?? "",
      alamat_wali_jalan: s.alamat_wali_jalan ?? "",
      alamat_wali_kecamatan: s.alamat_wali_kecamatan ?? "",
      alamat_wali_kabupaten: s.alamat_wali_kabupaten ?? "",
      alamat_wali_provinsi: s.alamat_wali_provinsi ?? "",
      tanggal_diterima: (s.tanggal_diterima ?? "").slice(0, 10),
      catatan_guru: s.catatan_guru ?? "",
      status: s.status ?? "active",
      class_id: s.class_id,
      school_id: s.school_id,
    });
    setCurrentStep("identity");
    setOpenModal(true);
  };

  const openCreateModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setCurrentStep(defaultStep);
    setOpenModal(true);
  };

  const goToStep = (step: StudentStepKey) => setCurrentStep(step);
  const goNext = () => setCurrentStep(studentSteps[Math.min(stepIndex + 1, studentSteps.length - 1)].key);
  const goPrev = () => setCurrentStep(studentSteps[Math.max(stepIndex - 1, 0)].key);

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
          rowKey={(row) => getEntityId(row)}
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
                  <div className="font-medium text-slate-900">{s.nama || "-"}</div>
                  <div className="text-xs text-slate-500">{s.nama_panggilan || s.email || "-"}</div>
                </>
              ),
            },
            {
              key: "nis",
              header: "NIS / NISN",
              render: (s) => <span className="text-sm text-slate-700">{s.nis ?? "-"} / {s.nisn ?? "-"}</span>,
            },
            {
              key: "ortu",
              header: "Orang Tua",
              render: (s) => <span className="text-sm text-slate-700">{s.nama_ayah || s.nama_ibu || "-"}</span>,
            },
            {
              key: "kelas",
              header: "Kelas",
              render: (s) => {
                const kelas = classesQuery.data?.data.find((k) => getEntityId(k) === s.class_id);
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
                  <button onClick={() => deleteMutation.mutate(getEntityId(s))} className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100">
                    <Trash2 className="size-3" /> Hapus
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal open={openModal} title={editing ? "Ubah Siswa" : "Tambah Siswa"} onClose={() => setOpenModal(false)}>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-sky-50 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Wizard data siswa</h3>
                <p className="text-xs text-slate-600">Isi per langkah supaya form lebih ringan, cepat dipahami, dan tidak melelahkan.</p>
              </div>
              <div className="rounded-xl bg-white/80 px-3 py-2 text-xs text-slate-600 shadow-sm ring-1 ring-indigo-100">
                Langkah {stepIndex + 1} dari {studentSteps.length}: <span className="font-semibold text-slate-900">{currentStepMeta.title}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Progress Form</div>
              <div className="space-y-2">
                {studentSteps.map((step, index) => {
                  const active = step.key === currentStep;
                  const done = stepCompletion[step.key];
                  return (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => goToStep(step.key)}
                      className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${active ? "border-indigo-300 bg-white shadow-sm" : "border-transparent bg-transparent hover:border-slate-200 hover:bg-white"}`}
                    >
                      <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${done ? "bg-emerald-100 text-emerald-700" : active ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600"}`}>
                        {done ? <Check className="size-3.5" /> : index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900">{step.title}</div>
                        <div className="text-xs text-slate-500">{step.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-start gap-3 border-b border-slate-100 pb-4">
                <div className="rounded-xl bg-indigo-50 p-2 text-indigo-700">
                  {currentStep === "identity" && <UserRound className="size-5" />}
                  {currentStep === "family" && <Users className="size-5" />}
                  {currentStep === "guardian" && <School className="size-5" />}
                  {currentStep === "academic" && <Layers className="size-5" />}
                </div>
                <div>
                  <h4 className="text-base font-semibold text-slate-900">{currentStepMeta.title}</h4>
                  <p className="text-sm text-slate-500">{currentStepMeta.description}</p>
                </div>
              </div>

              {currentStep === "identity" && (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {isSuperAdmin && (
                    <Field label="Sekolah" required icon={School}>
                      <select
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        value={form.school_id ?? ""}
                        onChange={(e) => setForm((p) => ({ ...p, school_id: e.target.value || undefined, class_id: undefined }))}
                        required
                      >
                        <option value="">Pilih sekolah</option>
                        {(schoolsQuery.data?.data ?? []).map((s) => (
                          <option key={getEntityId(s)} value={getEntityId(s)}>{s.name}</option>
                        ))}
                      </select>
                    </Field>
                  )}
                  <Field label="Nama" required icon={UserRound}>
                    <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Nama lengkap" value={form.nama} onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))} required />
                  </Field>
                  <Field label="Nama Panggilan" icon={UserRound}>
                    <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Nama panggilan" value={form.nama_panggilan ?? ""} onChange={(e) => setForm((p) => ({ ...p, nama_panggilan: e.target.value }))} />
                  </Field>
                  <Field label="Email" icon={Mail}>
                    <input type="email" className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="email@contoh.com" value={form.email ?? ""} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                  </Field>
                  <Field label="NIS" icon={Layers}>
                    <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="NIS" value={form.nis ?? ""} onChange={(e) => setForm((p) => ({ ...p, nis: e.target.value }))} />
                  </Field>
                  <Field label="NISN" icon={Layers}>
                    <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="NISN" value={form.nisn ?? ""} onChange={(e) => setForm((p) => ({ ...p, nisn: e.target.value }))} />
                  </Field>
                  <Field label="Jenis Kelamin" icon={UserRound}>
                    <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.jenis_kelamin ?? ""} onChange={(e) => setForm((p) => ({ ...p, jenis_kelamin: e.target.value }))}>
                      <option value="">Pilih</option>
                      <option value="male">Laki-laki</option>
                      <option value="female">Perempuan</option>
                    </select>
                  </Field>
                  <Field label="Tempat Lahir" icon={UserRound}>
                    <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Tempat lahir" value={form.tempat_lahir ?? ""} onChange={(e) => setForm((p) => ({ ...p, tempat_lahir: e.target.value }))} />
                  </Field>
                  <Field label="Tanggal Lahir" icon={UserRound}>
                    <input type="date" className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.tanggal_lahir ?? ""} onChange={(e) => setForm((p) => ({ ...p, tanggal_lahir: e.target.value }))} />
                  </Field>
                  <Field label="Agama" icon={UserRound}>
                    <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Agama" value={form.agama ?? ""} onChange={(e) => setForm((p) => ({ ...p, agama: e.target.value }))} />
                  </Field>
                  <Field label="Anak Ke" icon={UserRound}>
                    <input type="number" className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Anak ke" value={form.anak_ke ?? ""} onChange={(e) => setForm((p) => ({ ...p, anak_ke: e.target.value ? Number(e.target.value) : undefined }))} />
                  </Field>
                </div>
              )}

              {currentStep === "family" && (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <Field label="Nama Ayah" icon={UserRound}>
                    <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Nama ayah" value={form.nama_ayah ?? ""} onChange={(e) => setForm((p) => ({ ...p, nama_ayah: e.target.value }))} />
                  </Field>
                  <Field label="Pekerjaan Ayah" icon={UserRound}>
                    <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Pekerjaan ayah" value={form.pekerjaan_ayah ?? ""} onChange={(e) => setForm((p) => ({ ...p, pekerjaan_ayah: e.target.value }))} />
                  </Field>
                  <Field label="Nama Ibu" icon={UserRound}>
                    <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Nama ibu" value={form.nama_ibu ?? ""} onChange={(e) => setForm((p) => ({ ...p, nama_ibu: e.target.value }))} />
                  </Field>
                  <Field label="Pekerjaan Ibu" icon={UserRound}>
                    <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Pekerjaan ibu" value={form.pekerjaan_ibu ?? ""} onChange={(e) => setForm((p) => ({ ...p, pekerjaan_ibu: e.target.value }))} />
                  </Field>
                  <Field label="No HP Orang Tua" icon={UserRound}>
                    <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="No HP orang tua" value={form.no_hp_orangtua ?? ""} onChange={(e) => setForm((p) => ({ ...p, no_hp_orangtua: e.target.value }))} />
                  </Field>
                  <div className="hidden lg:block" />
                  <Field label="Alamat Orang Tua - Jalan" icon={School}>
                    <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Jalan" value={form.alamat_orangtua_jalan ?? ""} onChange={(e) => setForm((p) => ({ ...p, alamat_orangtua_jalan: e.target.value }))} />
                  </Field>
                  <Field label="Alamat Orang Tua - Kecamatan" icon={School}>
                    <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Kecamatan" value={form.alamat_orangtua_kecamatan ?? ""} onChange={(e) => setForm((p) => ({ ...p, alamat_orangtua_kecamatan: e.target.value }))} />
                  </Field>
                  <Field label="Alamat Orang Tua - Kabupaten" icon={School}>
                    <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Kabupaten" value={form.alamat_orangtua_kabupaten ?? ""} onChange={(e) => setForm((p) => ({ ...p, alamat_orangtua_kabupaten: e.target.value }))} />
                  </Field>
                  <Field label="Alamat Orang Tua - Provinsi" icon={School}>
                    <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Provinsi" value={form.alamat_orangtua_provinsi ?? ""} onChange={(e) => setForm((p) => ({ ...p, alamat_orangtua_provinsi: e.target.value }))} />
                  </Field>
                </div>
              )}

              {currentStep === "guardian" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Bagian ini opsional. Lewati jika siswa tidak memiliki wali selain orang tua.
                  </div>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <Field label="Nama Wali" icon={UserRound}>
                      <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Nama wali" value={form.nama_wali ?? ""} onChange={(e) => setForm((p) => ({ ...p, nama_wali: e.target.value }))} />
                    </Field>
                    <Field label="Pekerjaan Wali" icon={UserRound}>
                      <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Pekerjaan wali" value={form.pekerjaan_wali ?? ""} onChange={(e) => setForm((p) => ({ ...p, pekerjaan_wali: e.target.value }))} />
                    </Field>
                    <Field label="No HP Wali" icon={UserRound}>
                      <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="No HP wali" value={form.no_hp_wali ?? ""} onChange={(e) => setForm((p) => ({ ...p, no_hp_wali: e.target.value }))} />
                    </Field>
                    <div className="hidden lg:block" />
                    <Field label="Alamat Wali - Jalan" icon={School}>
                      <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Jalan" value={form.alamat_wali_jalan ?? ""} onChange={(e) => setForm((p) => ({ ...p, alamat_wali_jalan: e.target.value }))} />
                    </Field>
                    <Field label="Alamat Wali - Kecamatan" icon={School}>
                      <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Kecamatan" value={form.alamat_wali_kecamatan ?? ""} onChange={(e) => setForm((p) => ({ ...p, alamat_wali_kecamatan: e.target.value }))} />
                    </Field>
                    <Field label="Alamat Wali - Kabupaten" icon={School}>
                      <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Kabupaten" value={form.alamat_wali_kabupaten ?? ""} onChange={(e) => setForm((p) => ({ ...p, alamat_wali_kabupaten: e.target.value }))} />
                    </Field>
                    <Field label="Alamat Wali - Provinsi" icon={School}>
                      <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Provinsi" value={form.alamat_wali_provinsi ?? ""} onChange={(e) => setForm((p) => ({ ...p, alamat_wali_provinsi: e.target.value }))} />
                    </Field>
                  </div>
                </div>
              )}

              {currentStep === "academic" && (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <Field label="Tanggal Diterima" icon={School}>
                    <input type="date" className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.tanggal_diterima ?? ""} onChange={(e) => setForm((p) => ({ ...p, tanggal_diterima: e.target.value }))} />
                  </Field>
                  <Field label="Status" icon={UserRound}>
                    <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.status ?? "active"} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                      <option value="active">Aktif</option>
                      <option value="graduated">Lulus</option>
                      <option value="transferred">Pindah</option>
                    </select>
                  </Field>
                  <Field label="Kelas" required icon={School}>
                    <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.class_id ?? ""} onChange={(e) => setForm((p) => ({ ...p, class_id: e.target.value || undefined }))} required>
                      <option value="">Pilih kelas</option>
                      {visibleClasses.map((k) => (
                        <option key={getEntityId(k)} value={getEntityId(k)}>{k.name} ({k.level})</option>
                      ))}
                    </select>
                  </Field>
                  <div className="lg:col-span-2">
                    <Field label="Catatan Guru" icon={UserRound}>
                      <textarea className="min-h-24 rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Catatan guru" value={form.catatan_guru ?? ""} onChange={(e) => setForm((p) => ({ ...p, catatan_guru: e.target.value }))} />
                    </Field>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500">
              Wajib diisi: nama{isSuperAdmin ? ", sekolah" : ""}, dan kelas.
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button type="button" onClick={() => setOpenModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
              <button type="button" onClick={goPrev} disabled={stepIndex === 0} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50">Sebelumnya</button>
              {stepIndex < studentSteps.length - 1 ? (
                <button type="button" onClick={goNext} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">Lanjut</button>
              ) : (
                <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700" type="submit">
                  {editing ? "Simpan Perubahan" : "Buat Siswa"}
                </button>
              )}
            </div>
          </div>
        </form>
      </Modal>

      <Modal open={!!detailStudent} title="Detail Siswa" onClose={() => setDetailStudent(null)}>
        {detailStudent && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <DetailItem label="Nama" value={detailStudent.nama} />
            <DetailItem label="Nama Panggilan" value={detailStudent.nama_panggilan} />
            <DetailItem label="Email" value={detailStudent.email} />
            <DetailItem label="NIS" value={detailStudent.nis} />
            <DetailItem label="NISN" value={detailStudent.nisn} />
            <DetailItem label="Tempat Lahir" value={detailStudent.tempat_lahir} />
            <DetailItem label="Tanggal Lahir" value={detailStudent.tanggal_lahir} />
            <DetailItem label="Agama" value={detailStudent.agama} />
            <DetailItem label="Anak Ke" value={detailStudent.anak_ke?.toString()} />
            <DetailItem label="Nama Ayah" value={detailStudent.nama_ayah} />
            <DetailItem label="Pekerjaan Ayah" value={detailStudent.pekerjaan_ayah} />
            <DetailItem label="Nama Ibu" value={detailStudent.nama_ibu} />
            <DetailItem label="Pekerjaan Ibu" value={detailStudent.pekerjaan_ibu} />
            <DetailItem label="No HP Orang Tua" value={detailStudent.no_hp_orangtua} />
            <DetailItem label="Alamat Orang Tua" value={[detailStudent.alamat_orangtua_jalan, detailStudent.alamat_orangtua_kecamatan, detailStudent.alamat_orangtua_kabupaten, detailStudent.alamat_orangtua_provinsi].filter(Boolean).join(", ")} />
            <DetailItem label="Nama Wali" value={detailStudent.nama_wali} />
            <DetailItem label="Pekerjaan Wali" value={detailStudent.pekerjaan_wali} />
            <DetailItem label="No HP Wali" value={detailStudent.no_hp_wali} />
            <DetailItem label="Alamat Wali" value={[detailStudent.alamat_wali_jalan, detailStudent.alamat_wali_kecamatan, detailStudent.alamat_wali_kabupaten, detailStudent.alamat_wali_provinsi].filter(Boolean).join(", ")} />
            <DetailItem label="Tanggal Diterima" value={detailStudent.tanggal_diterima} />
            <DetailItem label="Status" value={detailStudent.status} />
            <DetailItem label="Kelas" value={classesQuery.data?.data.find((k) => getEntityId(k) === detailStudent.class_id)?.name} />
            <DetailItem label="Catatan Guru" value={detailStudent.catatan_guru} />
            {isSuperAdmin && (
              <DetailItem label="Sekolah" value={schoolsQuery.data?.data.find((s) => getEntityId(s) === detailStudent.school_id)?.name} />
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
      <div className="mt-1 break-all text-sm text-slate-800">{value || "-"}</div>
    </div>
  );
}
