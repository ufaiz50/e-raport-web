"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ListResponse } from "@/types/api";
import type { ClassItem } from "@/types/class";
import type { Student } from "@/types/student";
import { useToast } from "@/components/ui/toast-provider";

type AcademicYearItem = { id: number; year: string };
type SemesterItem = { id: number; academic_year_id: number; name: string; order_no: number };
type ReportSummary = {
  academic_year: string;
  semester: number;
  totals: {
    students: number;
    ready_students: number;
    finalized_students: number;
    classes: number;
  };
  classes: Array<{
    class_id: number;
    class_name: string;
    level: string;
    total_students: number;
    ready_students: number;
    finalized_students: number;
    completeness_pct: number;
  }>;
  students: Array<{
    student_id: number;
    student_name: string;
    class_id: number;
    class_name: string;
    has_grades: boolean;
    has_attendance: boolean;
    has_report_note: boolean;
    finalized: boolean;
    completeness_pct: number;
  }>;
};

export default function ReportsPage() {
  const { showToast } = useToast();

  const [mode, setMode] = useState<"student" | "class">("student");
  const [academicYearID, setAcademicYearID] = useState<number | "">("");
  const [semesterID, setSemesterID] = useState<number | "">("");
  const [classID, setClassID] = useState<number | "">("");
  const [studentID, setStudentID] = useState<number | "">("");

  const yearsQ = useQuery({
    queryKey: ["academic-years-lookup"],
    queryFn: async () => (await api.get<ListResponse<AcademicYearItem>>("/academic-years?offset=0&limit=200")).data,
  });

  const semestersQ = useQuery({
    queryKey: ["semesters-lookup"],
    queryFn: async () => (await api.get<ListResponse<SemesterItem>>("/semesters?offset=0&limit=200")).data,
  });

  const classesQ = useQuery({
    queryKey: ["classes-lookup"],
    queryFn: async () => (await api.get<ListResponse<ClassItem>>("/classes?offset=0&limit=200")).data,
  });

  const studentsQ = useQuery({
    queryKey: ["students-lookup"],
    queryFn: async () => (await api.get<ListResponse<Student>>("/students?offset=0&limit=500")).data,
  });

  // NOTE: reports endpoint tidak butuh lookup guru langsung di FE untuk sekarang,
  // jadi kita tidak perlu query teachers/enrollments di sini.

  const selectedYear = yearsQ.data?.data.find((y) => y.id === academicYearID);
  const selectedSemester = semestersQ.data?.data.find((s) => s.id === semesterID);
  const semesterNumber = selectedSemester?.order_no;
  const academicYearValue = selectedYear?.year;

  const filteredClasses = classesQ.data?.data ?? [];

  const filteredStudents = (studentsQ.data?.data ?? []).filter((s) => {
    if (classID && s.class_id !== classID) return false;
    return true;
  });

  const selectedClass = filteredClasses.find((c) => c.id === classID);

  const reportSummaryQ = useQuery({
    queryKey: ["reports-summary", academicYearValue, semesterNumber],
    enabled: !!academicYearValue && !!semesterNumber,
    queryFn: async () => {
      const res = await api.get<{ data: ReportSummary }>("/reports/summary", {
        params: { academic_year: academicYearValue, semester: semesterNumber },
      });
      return res.data.data;
    },
  });

  const classSummary = (reportSummaryQ.data?.classes ?? []).filter((row) => !classID || row.class_id === classID);
  const studentSummary = (reportSummaryQ.data?.students ?? []).filter((row) => {
    if (classID && row.class_id !== classID) return false;
    if (studentID && row.student_id !== studentID) return false;
    return true;
  });

  const canRunStudentReport =
    mode === "student" && !!academicYearValue && !!semesterNumber && !!classID && !!studentID;

  const canRunClassReport = mode === "class" && !!academicYearValue && !!semesterNumber && !!classID;

  const studentReportMutation = useMutation({
    mutationFn: async () => {
      if (!canRunStudentReport || !semesterNumber || !academicYearValue || !studentID) return;
      const res = await api.get(`/reports/students/${studentID}/pdf`, {
        params: { semester: semesterNumber, academic_year: academicYearValue },
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    },
    onSuccess: () => {
      showToast("Berhasil membuka raport siswa", "success");
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { error?: string } } };
      const msg = err.response?.data?.error ?? "Gagal membuka raport siswa";
      showToast(msg, "error");
    },
  });

  const classReportMutation = useMutation({
    mutationFn: async () => {
      if (!canRunClassReport || !semesterNumber || !academicYearValue || !classID) return;
      const res = await api.get(`/reports/classes/${classID}/pdf`, {
        params: { semester: semesterNumber, academic_year: academicYearValue },
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    },
    onSuccess: () => {
      showToast("Berhasil membuka raport satu kelas", "success");
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { error?: string } } };
      const msg = err.response?.data?.error ?? "Gagal membuka raport kelas";
      showToast(msg, "error");
    },
  });

  const finalizeClassReadyMutation = useMutation({
    mutationFn: async () => {
      if (!canRunClassReport || !semesterNumber || !academicYearValue || !classID) return;
      await api.post(`/reports/classes/${classID}/finalize-ready`, null, {
        params: { semester: semesterNumber, academic_year: academicYearValue },
      });
    },
    onSuccess: () => {
      showToast("Berhasil finalisasi raport siap-cetak dalam kelas", "success");
      reportSummaryQ.refetch();
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { error?: string } } };
      const msg = err.response?.data?.error ?? "Gagal finalisasi raport per kelas";
      showToast(msg, "error");
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      if (!canRunStudentReport || !semesterNumber || !academicYearValue || !studentID) return;
      await api.post(`/reports/students/${studentID}/finalize`, null, {
        params: { semester: semesterNumber, academic_year: academicYearValue },
      });
    },
    onSuccess: () => {
      showToast("Raport siswa berhasil difinalisasi", "success");
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { error?: string } } };
      const msg = err.response?.data?.error ?? "Gagal memfinalisasi raport";
      showToast(msg, "error");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Laporan</h1>
        <p className="text-sm text-slate-600">
          Cetak dan finalisasi raport berdasarkan tahun ajaran, semester, kelas, dan siswa.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("student")}
          className={`rounded-lg px-3 py-1.5 text-sm ${mode === "student" ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-700"}`}
        >
          Raport Per Siswa
        </button>
        <button
          type="button"
          onClick={() => setMode("class")}
          className={`rounded-lg px-3 py-1.5 text-sm ${mode === "class" ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-700"}`}
        >
          Raport Satu Kelas
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <select
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          value={academicYearID}
          onChange={(e) => {
            const v = e.target.value ? Number(e.target.value) : "";
            setAcademicYearID(v);
            setSemesterID("");
          }}
        >
          <option value="">Pilih Tahun Ajaran</option>
          {(yearsQ.data?.data ?? []).map((y) => (
            <option key={y.id} value={y.id}>
              {y.year}
            </option>
          ))}
        </select>

        <select
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          value={semesterID}
          onChange={(e) => setSemesterID(e.target.value ? Number(e.target.value) : "")}
          disabled={!academicYearID}
        >
          <option value="">Pilih Semester</option>
          {(semestersQ.data?.data ?? [])
            .filter((s) => !academicYearID || s.academic_year_id === academicYearID)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || `Semester ${s.order_no}`} ({yearsQ.data?.data.find((y) => y.id === s.academic_year_id)?.year ?? "-"})
              </option>
            ))}
        </select>

        <select
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          value={classID}
          onChange={(e) => {
            const v = e.target.value ? Number(e.target.value) : "";
            setClassID(v);
            setStudentID("");
          }}
          disabled={!semesterID}
        >
          <option value="">Pilih Kelas</option>
          {filteredClasses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.level})
            </option>
          ))}
        </select>

        {mode === "student" && (
          <select
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            value={studentID}
            onChange={(e) => setStudentID(e.target.value ? Number(e.target.value) : "")}
            disabled={!classID}
          >
            <option value="">Pilih Siswa</option>
            {filteredStudents.map((s) => {
              const name = `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.email || `Siswa #${s.id}`;
              return (
                <option key={s.id} value={s.id}>
                  {name} {selectedClass ? `• ${selectedClass.name}` : ""}
                </option>
              );
            })}
          </select>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {mode === "student" && (
          <>
            <button
              type="button"
              disabled={!canRunStudentReport || studentReportMutation.isPending}
              onClick={() => studentReportMutation.mutate()}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {studentReportMutation.isPending ? "Membuka..." : "Buka Raport Siswa (PDF)"}
            </button>
            <button
              type="button"
              disabled={!canRunStudentReport || finalizeMutation.isPending}
              onClick={() => finalizeMutation.mutate()}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
            >
              {finalizeMutation.isPending ? "Memproses..." : "Finalisasi Raport Siswa"}
            </button>
          </>
        )}

        {mode === "class" && (
          <>
            <button
              type="button"
              disabled={!canRunClassReport || classReportMutation.isPending}
              onClick={() => classReportMutation.mutate()}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {classReportMutation.isPending ? "Membuka..." : "Buka Raport Satu Kelas (PDF)"}
            </button>
            <button
              type="button"
              disabled={!canRunClassReport || finalizeClassReadyMutation.isPending}
              onClick={() => finalizeClassReadyMutation.mutate()}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
            >
              {finalizeClassReadyMutation.isPending ? "Memproses..." : "Finalisasi Semua yang Siap"}
            </button>
          </>
        )}
      </div>

      {!!reportSummaryQ.data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Ringkasan Progress Raport</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="Total Siswa" value={reportSummaryQ.data.totals.students} />
              <SummaryCard label="Siap Finalisasi" value={reportSummaryQ.data.totals.ready_students} />
              <SummaryCard label="Sudah Final" value={reportSummaryQ.data.totals.finalized_students} />
              <SummaryCard label="Total Kelas" value={reportSummaryQ.data.totals.classes} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Kelas dengan Progress Terendah</h2>
            <div className="space-y-3">
              {classSummary.slice(0, 5).map((row) => (
                <div key={row.class_id} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between text-sm font-medium text-slate-800">
                    <span>{row.class_name} ({row.level})</span>
                    <span>{row.completeness_pct}%</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Siap: {row.ready_students}/{row.total_students} • Final: {row.finalized_students}/{row.total_students}
                  </div>
                </div>
              ))}
              {!classSummary.length && <p className="text-sm text-slate-500">Belum ada ringkasan kelas untuk term ini.</p>}
            </div>
          </div>
        </div>
      )}

      {!!reportSummaryQ.data && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Checklist Siswa</h2>
          <div className="space-y-2">
            {studentSummary.map((row) => (
              <div key={row.student_id} className="rounded-xl border border-slate-200 px-3 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{row.student_name}</div>
                    <div className="text-xs text-slate-500">{row.class_name} • Progress {row.completeness_pct}%</div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge ok={row.has_grades} label="Nilai" />
                    <Badge ok={row.has_attendance} label="Absensi" />
                    <Badge ok={row.has_report_note} label="Catatan" />
                    <Badge ok={row.finalized} label="Final" />
                  </div>
                </div>
              </div>
            ))}
            {!studentSummary.length && <p className="text-sm text-slate-500">Belum ada siswa untuk filter yang dipilih.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return <span className={`rounded-full px-2.5 py-1 font-medium ${ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{label}</span>;
}
