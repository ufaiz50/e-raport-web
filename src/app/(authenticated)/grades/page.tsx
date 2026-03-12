"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ListResponse } from "@/types/api";
import type { Student } from "@/types/student";
import type { ClassItem } from "@/types/class";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast-provider";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";

type Enrollment = {
  id: number;
  student_id: number;
  class_id: number;
  academic_year: string;
  semester: number;
  is_active: boolean;
};

type BookItem = { id: number; title: string; author: string };

type GradeItem = {
  id: number;
  enrollment_id?: number;
  student_id: number;
  book_id: number;
  semester: number;
  academic_year: string;
  knowledge_score: number;
  skill_score: number;
  final_score: number;
  notes?: string;
};

type AttendanceItem = {
  id: number;
  enrollment_id?: number;
  student_id: number;
  semester: number;
  academic_year: string;
  sick_days: number;
  permission_days: number;
  absent_days: number;
};

type ReportNoteItem = {
  id: number;
  enrollment_id?: number;
  student_id: number;
  semester: number;
  academic_year: string;
  homeroom_comment: string;
};

type GradePayload = {
  enrollment_id?: number;
  student_id: number;
  book_id: number;
  semester: number;
  academic_year: string;
  knowledge_score: number;
  skill_score: number;
  notes?: string;
};

type AttendancePayload = {
  enrollment_id?: number;
  student_id: number;
  semester: number;
  academic_year: string;
  sick_days: number;
  permission_days: number;
  absent_days: number;
};

type ReportNotePayload = {
  enrollment_id?: number;
  student_id: number;
  semester: number;
  academic_year: string;
  homeroom_comment: string;
};

const DEFAULT_LIMIT = 10;

export default function GradesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeItem | null>(null);
  const [detailGrade, setDetailGrade] = useState<GradeItem | null>(null);
  const [gradeForm, setGradeForm] = useState<GradePayload>({
    enrollment_id: undefined,
    student_id: 0,
    book_id: 0,
    semester: 1,
    academic_year: "",
    knowledge_score: 0,
    skill_score: 0,
    notes: "",
  });

  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState<AttendancePayload>({
    enrollment_id: undefined,
    student_id: 0,
    semester: 1,
    academic_year: "",
    sick_days: 0,
    permission_days: 0,
    absent_days: 0,
  });

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteForm, setNoteForm] = useState<ReportNotePayload>({
    enrollment_id: undefined,
    student_id: 0,
    semester: 1,
    academic_year: "",
    homeroom_comment: "",
  });

  const gradesQuery = useQuery({
    queryKey: ["grades", offset, limit],
    queryFn: async () => {
      const res = await api.get<ListResponse<GradeItem>>(`/grades?offset=${offset}&limit=${limit}`);
      return res.data;
    },
  });

  const attendancesQuery = useQuery({
    queryKey: ["attendances"],
    queryFn: async () => {
      const res = await api.get<ListResponse<AttendanceItem>>(`/attendances?offset=0&limit=100`);
      return res.data;
    },
  });

  const notesQuery = useQuery({
    queryKey: ["report-notes"],
    queryFn: async () => {
      const res = await api.get<ListResponse<ReportNoteItem>>(`/report-notes?offset=0&limit=100`);
      return res.data;
    },
  });

  const enrollmentsQuery = useQuery({
    queryKey: ["enrollments-active"],
    queryFn: async () => {
      const res = await api.get<ListResponse<Enrollment>>(`/enrollments?offset=0&limit=300&is_active=true`);
      return res.data;
    },
  });

  const studentsQuery = useQuery({
    queryKey: ["students-lookup"],
    queryFn: async () => {
      const res = await api.get<ListResponse<Student>>(`/students?offset=0&limit=500`);
      return res.data;
    },
  });

  const classesQuery = useQuery({
    queryKey: ["classes-lookup"],
    queryFn: async () => {
      const res = await api.get<ListResponse<ClassItem>>(`/classes?offset=0&limit=200`);
      return res.data;
    },
  });

  const booksQuery = useQuery({
    queryKey: ["subjects-lookup"],
    queryFn: async () => {
      const res = await api.get<ListResponse<BookItem>>(`/subjects?offset=0&limit=200`);
      return res.data;
    },
  });

  const enrollmentLabel = (enrollmentId?: number) => {
    const e = enrollmentsQuery.data?.data.find((x) => x.id === enrollmentId);
    if (!e) return "-";
    const student = studentsQuery.data?.data.find((s) => s.id === e.student_id);
    const cls = classesQuery.data?.data.find((c) => c.id === e.class_id);
    const studentName = `${student?.first_name ?? ""} ${student?.last_name ?? ""}`.trim();
    return `${studentName || `Siswa ${e.student_id}`} • ${cls?.name ?? `Kelas ${e.class_id}`} • ${e.academic_year} S${e.semester}`;
  };

  const gradeCreate = useMutation({
    mutationFn: (payload: GradePayload) => api.post("/grades", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      setGradeModalOpen(false);
      setEditingGrade(null);
      showToast("Nilai berhasil disimpan", "success");
    },
    onError: () => showToast("Gagal menyimpan nilai", "error"),
  });

  const gradeUpdate = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<GradePayload> }) => api.put(`/grades/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      setGradeModalOpen(false);
      setEditingGrade(null);
      showToast("Nilai berhasil diupdate", "success");
    },
    onError: () => showToast("Gagal update nilai", "error"),
  });

  const gradeDelete = useMutation({
    mutationFn: (id: number) => api.delete(`/grades/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      showToast("Nilai berhasil dihapus", "success");
    },
    onError: () => showToast("Gagal hapus nilai", "error"),
  });

  const attendanceUpsert = useMutation({
    mutationFn: (payload: AttendancePayload) => api.put("/attendances", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      setAttendanceModalOpen(false);
      showToast("Absensi berhasil disimpan", "success");
    },
    onError: () => showToast("Gagal simpan absensi", "error"),
  });

  const noteUpsert = useMutation({
    mutationFn: (payload: ReportNotePayload) => api.put("/report-notes", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-notes"] });
      setNoteModalOpen(false);
      showToast("Catatan berhasil disimpan", "success");
    },
    onError: () => showToast("Gagal simpan catatan", "error"),
  });

  const openCreateGrade = () => {
    setEditingGrade(null);
    setGradeForm({
      enrollment_id: undefined,
      student_id: 0,
      book_id: 0,
      semester: 1,
      academic_year: "",
      knowledge_score: 0,
      skill_score: 0,
      notes: "",
    });
    setGradeModalOpen(true);
  };

  const onSelectEnrollment = (enrollmentId: number, target: "grade" | "attendance" | "note") => {
    const e = enrollmentsQuery.data?.data.find((x) => x.id === enrollmentId);
    if (!e) return;

    if (target === "grade") {
      setGradeForm((p) => ({ ...p, enrollment_id: e.id, student_id: e.student_id, semester: e.semester, academic_year: e.academic_year }));
    }
    if (target === "attendance") {
      setAttendanceForm((p) => ({ ...p, enrollment_id: e.id, student_id: e.student_id, semester: e.semester, academic_year: e.academic_year }));
    }
    if (target === "note") {
      setNoteForm((p) => ({ ...p, enrollment_id: e.id, student_id: e.student_id, semester: e.semester, academic_year: e.academic_year }));
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Nilai</h1>
          <button onClick={openCreateGrade} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700">
            <Plus className="size-4" /> Tambah Nilai
          </button>
        </div>

        {!!gradesQuery.data && (
          <DataTable
            rows={gradesQuery.data.data}
            total={gradesQuery.data.meta.total}
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
              { key: "enroll", header: "Enrollment", render: (g) => <span className="text-sm text-slate-700">{enrollmentLabel(g.enrollment_id)}</span> },
              {
                key: "mapel",
                header: "Mata Pelajaran",
                render: (g) => <span className="text-sm text-slate-700">{booksQuery.data?.data.find((b) => b.id === g.book_id)?.title ?? `ID ${g.book_id}`}</span>,
              },
              { key: "akhir", header: "Nilai Akhir", render: (g) => <span className="font-semibold text-slate-900">{g.final_score.toFixed(1)}</span> },
              {
                key: "aksi",
                header: "Aksi",
                className: "text-right",
                render: (g) => (
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setDetailGrade(g)} className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"><Eye className="size-3" /> Detail</button>
                    <button
                      onClick={() => {
                        setEditingGrade(g);
                        setGradeForm({
                          enrollment_id: g.enrollment_id,
                          student_id: g.student_id,
                          book_id: g.book_id,
                          semester: g.semester,
                          academic_year: g.academic_year,
                          knowledge_score: g.knowledge_score,
                          skill_score: g.skill_score,
                          notes: g.notes ?? "",
                        });
                        setGradeModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    ><Pencil className="size-3" /> Edit</button>
                    <button onClick={() => gradeDelete.mutate(g.id)} className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"><Trash2 className="size-3" /> Hapus</button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Absensi</h2>
            <button onClick={() => setAttendanceModalOpen(true)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"><Plus className="size-3" /> Upsert</button>
          </div>
          <div className="space-y-2">
            {(attendancesQuery.data?.data ?? []).slice(0, 8).map((a) => (
              <div key={a.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                <div className="font-medium text-slate-800">{enrollmentLabel(a.enrollment_id)}</div>
                <div className="text-xs text-slate-600">Sakit {a.sick_days} • Izin {a.permission_days} • Alfa {a.absent_days}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Catatan Wali Kelas</h2>
            <button onClick={() => setNoteModalOpen(true)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"><Plus className="size-3" /> Upsert</button>
          </div>
          <div className="space-y-2">
            {(notesQuery.data?.data ?? []).slice(0, 8).map((n) => (
              <div key={n.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                <div className="font-medium text-slate-800">{enrollmentLabel(n.enrollment_id)}</div>
                <div className="text-xs text-slate-600 line-clamp-2">{n.homeroom_comment}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Modal open={gradeModalOpen} title={editingGrade ? "Ubah Nilai" : "Tambah Nilai"} onClose={() => setGradeModalOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!gradeForm.enrollment_id || !gradeForm.book_id) {
              showToast("Enrollment dan mata pelajaran wajib dipilih", "error");
              return;
            }
            if (editingGrade) {
              gradeUpdate.mutate({ id: editingGrade.id, payload: gradeForm });
            } else {
              gradeCreate.mutate(gradeForm);
            }
          }}
          className="grid grid-cols-1 gap-3 lg:grid-cols-2"
        >
          <label className="grid gap-1 text-sm lg:col-span-2">
            <span className="font-medium">Enrollment</span>
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5" value={gradeForm.enrollment_id ?? ""} onChange={(e) => onSelectEnrollment(Number(e.target.value), "grade")} required>
              <option value="">Pilih enrollment</option>
              {(enrollmentsQuery.data?.data ?? []).map((x) => (
                <option key={x.id} value={x.id}>{enrollmentLabel(x.id)}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Mata Pelajaran</span>
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5" value={gradeForm.book_id || ""} onChange={(e) => setGradeForm((p) => ({ ...p, book_id: Number(e.target.value) }))} required>
              <option value="">Pilih mata pelajaran</option>
              {(booksQuery.data?.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Tahun Ajaran</span>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5" value={gradeForm.academic_year} readOnly />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Nilai Pengetahuan</span>
            <input type="number" min={0} max={100} className="rounded-xl border border-slate-200 px-3 py-2.5" value={gradeForm.knowledge_score} onChange={(e) => setGradeForm((p) => ({ ...p, knowledge_score: Number(e.target.value) }))} />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Nilai Keterampilan</span>
            <input type="number" min={0} max={100} className="rounded-xl border border-slate-200 px-3 py-2.5" value={gradeForm.skill_score} onChange={(e) => setGradeForm((p) => ({ ...p, skill_score: Number(e.target.value) }))} />
          </label>

          <label className="grid gap-1 text-sm lg:col-span-2">
            <span className="font-medium">Catatan</span>
            <textarea className="rounded-xl border border-slate-200 px-3 py-2.5" value={gradeForm.notes ?? ""} onChange={(e) => setGradeForm((p) => ({ ...p, notes: e.target.value }))} />
          </label>

          <div className="lg:col-span-2 flex justify-end gap-2">
            <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm" onClick={() => setGradeModalOpen(false)}>Batal</button>
            <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">Simpan</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detailGrade} title="Detail Nilai" onClose={() => setDetailGrade(null)}>
        {detailGrade && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
            <DetailItem label="Enrollment" value={enrollmentLabel(detailGrade.enrollment_id)} />
            <DetailItem label="Mata Pelajaran" value={booksQuery.data?.data.find((b) => b.id === detailGrade.book_id)?.title} />
            <DetailItem label="Pengetahuan" value={String(detailGrade.knowledge_score)} />
            <DetailItem label="Keterampilan" value={String(detailGrade.skill_score)} />
            <DetailItem label="Nilai Akhir" value={String(detailGrade.final_score)} />
            <DetailItem label="Catatan" value={detailGrade.notes} />
          </div>
        )}
      </Modal>

      <Modal open={attendanceModalOpen} title="Upsert Absensi" onClose={() => setAttendanceModalOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!attendanceForm.enrollment_id) {
              showToast("Enrollment wajib dipilih", "error");
              return;
            }
            attendanceUpsert.mutate(attendanceForm);
          }}
          className="grid grid-cols-1 gap-3"
        >
          <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5" value={attendanceForm.enrollment_id ?? ""} onChange={(e) => onSelectEnrollment(Number(e.target.value), "attendance")} required>
            <option value="">Pilih enrollment</option>
            {(enrollmentsQuery.data?.data ?? []).map((x) => (
              <option key={x.id} value={x.id}>{enrollmentLabel(x.id)}</option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <input type="number" min={0} className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Sakit" value={attendanceForm.sick_days} onChange={(e) => setAttendanceForm((p) => ({ ...p, sick_days: Number(e.target.value) }))} />
            <input type="number" min={0} className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Izin" value={attendanceForm.permission_days} onChange={(e) => setAttendanceForm((p) => ({ ...p, permission_days: Number(e.target.value) }))} />
            <input type="number" min={0} className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Alfa" value={attendanceForm.absent_days} onChange={(e) => setAttendanceForm((p) => ({ ...p, absent_days: Number(e.target.value) }))} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm" onClick={() => setAttendanceModalOpen(false)}>Batal</button>
            <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">Simpan</button>
          </div>
        </form>
      </Modal>

      <Modal open={noteModalOpen} title="Upsert Catatan Wali Kelas" onClose={() => setNoteModalOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!noteForm.enrollment_id || !noteForm.homeroom_comment.trim()) {
              showToast("Enrollment dan catatan wajib diisi", "error");
              return;
            }
            noteUpsert.mutate(noteForm);
          }}
          className="grid grid-cols-1 gap-3"
        >
          <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5" value={noteForm.enrollment_id ?? ""} onChange={(e) => onSelectEnrollment(Number(e.target.value), "note")} required>
            <option value="">Pilih enrollment</option>
            {(enrollmentsQuery.data?.data ?? []).map((x) => (
              <option key={x.id} value={x.id}>{enrollmentLabel(x.id)}</option>
            ))}
          </select>
          <textarea className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Tulis catatan wali kelas" value={noteForm.homeroom_comment} onChange={(e) => setNoteForm((p) => ({ ...p, homeroom_comment: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm" onClick={() => setNoteModalOpen(false)}>Batal</button>
            <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">Simpan</button>
          </div>
        </form>
      </Modal>
    </div>
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
