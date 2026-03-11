"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ListResponse } from "@/types/api";
import {
  AlertTriangle,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

type StudentItem = {
  id: number;
  name: string;
  type: "junior" | "senior";
  email: string;
  class_id?: number;
};

type ClassItem = {
  id: number;
  name: string;
  level: string;
  academic_year: string;
};

type GradeItem = {
  id: number;
  student_id: number;
  semester: number;
  academic_year: string;
  final_score: number;
};

type AttendanceItem = {
  id: number;
  student_id: number;
};

type ReportNoteItem = {
  id: number;
  student_id: number;
};

const PREVIEW_LIMIT = 5;
const ANALYTIC_LIMIT = 200;

export default function DashboardPage() {
  const studentsQuery = useQuery({
    queryKey: ["dashboard", "students"],
    queryFn: async () => {
      const res = await api.get<ListResponse<StudentItem>>(`/students?offset=0&limit=${ANALYTIC_LIMIT}`);
      return res.data;
    },
  });

  const classesQuery = useQuery({
    queryKey: ["dashboard", "classes"],
    queryFn: async () => {
      const res = await api.get<ListResponse<ClassItem>>(`/classes?offset=0&limit=${ANALYTIC_LIMIT}`);
      return res.data;
    },
  });

  const gradesQuery = useQuery({
    queryKey: ["dashboard", "grades"],
    queryFn: async () => {
      const res = await api.get<ListResponse<GradeItem>>(`/grades?offset=0&limit=${ANALYTIC_LIMIT}`);
      return res.data;
    },
  });

  const attendancesQuery = useQuery({
    queryKey: ["dashboard", "attendances"],
    queryFn: async () => {
      const res = await api.get<ListResponse<AttendanceItem>>(`/attendances?offset=0&limit=${ANALYTIC_LIMIT}`);
      return res.data;
    },
  });

  const reportNotesQuery = useQuery({
    queryKey: ["dashboard", "report-notes"],
    queryFn: async () => {
      const res = await api.get<ListResponse<ReportNoteItem>>(`/report-notes?offset=0&limit=${ANALYTIC_LIMIT}`);
      return res.data;
    },
  });

  const loading =
    studentsQuery.isLoading ||
    classesQuery.isLoading ||
    gradesQuery.isLoading ||
    attendancesQuery.isLoading ||
    reportNotesQuery.isLoading;

  const totals = useMemo(
    () => ({
      students: studentsQuery.data?.meta.total ?? 0,
      classes: classesQuery.data?.meta.total ?? 0,
      grades: gradesQuery.data?.meta.total ?? 0,
      attendances: attendancesQuery.data?.meta.total ?? 0,
      reportNotes: reportNotesQuery.data?.meta.total ?? 0,
    }),
    [
      studentsQuery.data?.meta.total,
      classesQuery.data?.meta.total,
      gradesQuery.data?.meta.total,
      attendancesQuery.data?.meta.total,
      reportNotesQuery.data?.meta.total,
    ],
  );

  const semesterTrend = useMemo(() => {
    const map = new Map<string, { label: string; totalScore: number; count: number }>();

    for (const g of gradesQuery.data?.data ?? []) {
      const key = `${g.academic_year} • S${g.semester}`;
      const existing = map.get(key) ?? { label: key, totalScore: 0, count: 0 };
      existing.totalScore += Number(g.final_score ?? 0);
      existing.count += 1;
      map.set(key, existing);
    }

    return Array.from(map.values())
      .map((item) => ({
        label: item.label,
        avg: item.count > 0 ? Number((item.totalScore / item.count).toFixed(1)) : 0,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-6);
  }, [gradesQuery.data?.data]);

  const classCompleteness = useMemo(() => {
    const students = studentsQuery.data?.data ?? [];
    const classes = classesQuery.data?.data ?? [];

    const gradeStudents = new Set((gradesQuery.data?.data ?? []).map((g) => g.student_id));
    const attendanceStudents = new Set((attendancesQuery.data?.data ?? []).map((a) => a.student_id));
    const noteStudents = new Set((reportNotesQuery.data?.data ?? []).map((n) => n.student_id));

    const rows = classes
      .map((cls) => {
        const classStudents = students.filter((s) => s.class_id === cls.id);
        const totalStudents = classStudents.length;

        if (totalStudents === 0) {
          return {
            classId: cls.id,
            className: `${cls.name} (${cls.level})`,
            completeness: 0,
            gradePct: 0,
            attendancePct: 0,
            notePct: 0,
            totalStudents,
          };
        }

        const hasGrades = classStudents.filter((s) => gradeStudents.has(s.id)).length;
        const hasAttendance = classStudents.filter((s) => attendanceStudents.has(s.id)).length;
        const hasNotes = classStudents.filter((s) => noteStudents.has(s.id)).length;

        const gradePct = Math.round((hasGrades / totalStudents) * 100);
        const attendancePct = Math.round((hasAttendance / totalStudents) * 100);
        const notePct = Math.round((hasNotes / totalStudents) * 100);
        const completeness = Math.round((gradePct + attendancePct + notePct) / 3);

        return {
          classId: cls.id,
          className: `${cls.name} (${cls.level})`,
          completeness,
          gradePct,
          attendancePct,
          notePct,
          totalStudents,
        };
      })
      .sort((a, b) => a.completeness - b.completeness)
      .slice(0, 6);

    return rows;
  }, [
    studentsQuery.data?.data,
    classesQuery.data?.data,
    gradesQuery.data?.data,
    attendancesQuery.data?.data,
    reportNotesQuery.data?.data,
  ]);

  const recommendation = useMemo(() => {
    const tips: string[] = [];

    if (totals.students === 0) tips.push("Mulai dari input data siswa agar proses akademik bisa berjalan.");
    if (totals.classes === 0) tips.push("Tambahkan kelas dan tahun ajaran agar struktur rapor siap dipakai.");
    if (totals.grades < totals.students) tips.push("Fokus input nilai terlebih dahulu karena coverage nilai masih rendah.");
    if (totals.attendances < totals.students) tips.push("Lengkapi absensi agar ringkasan performa siswa lebih akurat.");
    if (totals.reportNotes < totals.students) tips.push("Isi catatan wali kelas untuk memperkaya evaluasi rapor.");

    const weakestClass = classCompleteness[0];
    if (weakestClass && weakestClass.totalStudents > 0 && weakestClass.completeness < 70) {
      tips.push(`Prioritaskan kelas ${weakestClass.className} (kelengkapan ${weakestClass.completeness}%).`);
    }

    if (tips.length === 0) {
      tips.push("Data utama sudah terisi rapi. Lanjutkan quality check dan persiapan cetak rapor.");
    }

    return tips.slice(0, 4);
  }, [totals, classCompleteness]);

  const dataSamplingWarning =
    (studentsQuery.data?.meta.total ?? 0) > ANALYTIC_LIMIT ||
    (classesQuery.data?.meta.total ?? 0) > ANALYTIC_LIMIT ||
    (gradesQuery.data?.meta.total ?? 0) > ANALYTIC_LIMIT;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-700 p-6 text-white">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
          <Sparkles className="size-3.5" /> Executive Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-bold">Dashboard E-Raport</h1>
        <p className="mt-1 text-sm text-white/90">Ringkasan eksekutif untuk memantau progres akademik dan kelengkapan data sekolah.</p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-500">Memuat statistik dashboard...</p>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard title="Students" value={totals.students} icon={<Users className="size-5" />} color="sky" />
            <StatCard title="Classes" value={totals.classes} icon={<Building2 className="size-5" />} color="indigo" />
            <StatCard title="Grades" value={totals.grades} icon={<BookOpenCheck className="size-5" />} color="emerald" />
            <StatCard title="Attendances" value={totals.attendances} icon={<ClipboardList className="size-5" />} color="amber" />
            <StatCard title="Report Notes" value={totals.reportNotes} icon={<FileText className="size-5" />} color="rose" />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
                <TrendingUp className="size-5 text-indigo-600" /> Tren rata-rata nilai per semester
              </h2>
              {semesterTrend.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada data nilai untuk ditampilkan sebagai tren.</p>
              ) : (
                <div className="space-y-3">
                  {semesterTrend.map((item) => (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                        <span>{item.label}</span>
                        <span className="font-semibold text-slate-800">{item.avg}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600" style={{ width: `${Math.min(item.avg, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
                <CheckCircle2 className="size-5 text-emerald-600" /> Progress kelengkapan per kelas
              </h2>
              {classCompleteness.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada data kelas/siswa untuk menghitung progress.</p>
              ) : (
                <div className="space-y-3">
                  {classCompleteness.map((row) => (
                    <div key={row.classId} className="rounded-xl bg-slate-50 p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <div className="text-sm font-medium text-slate-800">{row.className}</div>
                        <div className="text-xs font-semibold text-slate-700">{row.completeness}%</div>
                      </div>
                      <div className="mb-2 h-2 rounded-full bg-white">
                        <div
                          className={`h-2 rounded-full ${row.completeness >= 80 ? "bg-emerald-500" : row.completeness >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                          style={{ width: `${row.completeness}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
                        <span>Nilai: {row.gradePct}%</span>
                        <span>Absensi: {row.attendancePct}%</span>
                        <span>Catatan: {row.notePct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Siswa terbaru</h2>
              <div className="space-y-2">
                {(studentsQuery.data?.data ?? []).slice(0, PREVIEW_LIMIT).map((s) => (
                  <div key={s.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <div className="font-medium text-slate-800">{s.name}</div>
                    <div className="text-xs text-slate-500">
                      {s.email} • {s.type}
                    </div>
                  </div>
                ))}
                {!studentsQuery.data?.data?.length && <p className="text-sm text-slate-500">Belum ada data siswa.</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">
              <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold text-indigo-900">
                <AlertTriangle className="size-5" /> Prioritas rekomendasi
              </h2>
              <ul className="list-disc space-y-1 pl-5 text-sm text-indigo-900/90">
                {recommendation.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
              {dataSamplingWarning && (
                <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs text-indigo-800">
                  Analitik ditampilkan dari sampel {ANALYTIC_LIMIT} data terbaru per endpoint. Untuk dataset besar, bisa ditingkatkan pakai endpoint agregasi khusus.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "sky" | "indigo" | "emerald" | "amber" | "rose";
}) {
  const colorMap: Record<typeof color, string> = {
    sky: "from-sky-500 to-sky-600",
    indigo: "from-indigo-500 to-indigo-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    rose: "from-rose-500 to-rose-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-3 inline-flex rounded-lg bg-gradient-to-r p-2 text-white ${colorMap[color]}`}>{icon}</div>
      <div className="mb-1 text-sm text-slate-500">{title}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
