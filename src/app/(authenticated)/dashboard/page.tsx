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
  first_name: string;
  last_name: string;
  email: string;
};

type DashboardSummary = {
  totals: {
    students: number;
    classes: number;
    grades: number;
    attendances: number;
    report_notes: number;
    subjects_without_teacher: number;
    incomplete_students: number;
  };
  semester_trends: Array<{
    academic_year: string;
    semester: number;
    avg_final: number;
    count: number;
  }>;
  class_completeness: Array<{
    class_id: number;
    class_name: string;
    level: string;
    total_students: number;
    grade_pct: number;
    attendance_pct: number;
    report_note_pct: number;
    completeness_pct: number;
  }>;
  recommendations: string[];
};

const PREVIEW_LIMIT = 5;

export default function DashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      const res = await api.get<{ data: DashboardSummary }>("/dashboard/summary");
      return res.data.data;
    },
  });

  const studentsPreviewQuery = useQuery({
    queryKey: ["dashboard", "students-preview"],
    queryFn: async () => {
      const res = await api.get<ListResponse<StudentItem>>(`/students?offset=0&limit=${PREVIEW_LIMIT}`);
      return res.data;
    },
  });

  const loading = summaryQuery.isLoading || studentsPreviewQuery.isLoading;

  const totals = summaryQuery.data?.totals ?? {
    students: 0,
    classes: 0,
    grades: 0,
    attendances: 0,
    report_notes: 0,
    subjects_without_teacher: 0,
    incomplete_students: 0,
  };

  const recommendation = useMemo(() => summaryQuery.data?.recommendations ?? [], [summaryQuery.data?.recommendations]);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-700 p-6 text-white">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
          <Sparkles className="size-3.5" /> Dasbor Eksekutif
        </p>
        <h1 className="mt-3 text-3xl font-bold">Dashboard E-Raport</h1>
        <p className="mt-1 text-sm text-white/90">Ringkasan eksekutif untuk memantau progres akademik dan kelengkapan data sekolah.</p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-500">Memuat statistik dashboard...</p>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
            <StatCard title="Siswa" value={totals.students} icon={<Users className="size-5" />} color="sky" />
            <StatCard title="Kelas" value={totals.classes} icon={<Building2 className="size-5" />} color="indigo" />
            <StatCard title="Nilai" value={totals.grades} icon={<BookOpenCheck className="size-5" />} color="emerald" />
            <StatCard title="Absensi" value={totals.attendances} icon={<ClipboardList className="size-5" />} color="amber" />
            <StatCard title="Catatan Rapor" value={totals.report_notes} icon={<FileText className="size-5" />} color="rose" />
            <StatCard title="Mapel Tanpa Guru" value={totals.subjects_without_teacher} icon={<AlertTriangle className="size-5" />} color="amber" />
            <StatCard title="Siswa Belum Lengkap" value={totals.incomplete_students} icon={<AlertTriangle className="size-5" />} color="rose" />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
                <TrendingUp className="size-5 text-indigo-600" /> Tren rata-rata nilai per semester
              </h2>
              {summaryQuery.data?.semester_trends.length ? (
                <div className="space-y-3">
                  {summaryQuery.data.semester_trends.slice(-6).map((item) => (
                    <div key={`${item.academic_year}-${item.semester}`}>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                        <span>
                          {item.academic_year} • S{item.semester}
                        </span>
                        <span className="font-semibold text-slate-800">{item.avg_final.toFixed(1)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600" style={{ width: `${Math.min(item.avg_final, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Belum ada data nilai untuk ditampilkan sebagai tren.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
                <CheckCircle2 className="size-5 text-emerald-600" /> Progress kelengkapan per kelas
              </h2>
              {summaryQuery.data?.class_completeness.length ? (
                <div className="space-y-3">
                  {summaryQuery.data.class_completeness.slice(0, 6).map((row) => (
                    <div key={row.class_id} className="rounded-xl bg-slate-50 p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <div className="text-sm font-medium text-slate-800">
                          {row.class_name} ({row.level})
                        </div>
                        <div className="text-xs font-semibold text-slate-700">{row.completeness_pct}%</div>
                      </div>
                      <div className="mb-2 h-2 rounded-full bg-white">
                        <div
                          className={`h-2 rounded-full ${row.completeness_pct >= 80 ? "bg-emerald-500" : row.completeness_pct >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                          style={{ width: `${row.completeness_pct}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
                        <span>Nilai: {row.grade_pct}%</span>
                        <span>Absensi: {row.attendance_pct}%</span>
                        <span>Catatan: {row.report_note_pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Belum ada data kelas/siswa untuk menghitung progress.</p>
              )}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Siswa terbaru</h2>
              <div className="space-y-2">
                {(studentsPreviewQuery.data?.data ?? []).slice(0, PREVIEW_LIMIT).map((s) => (
                  <div key={s.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <div className="font-medium text-slate-800">{s.first_name} {s.last_name}</div>
                    <div className="text-xs text-slate-500">
                      {s.email}
                    </div>
                  </div>
                ))}
                {!studentsPreviewQuery.data?.data?.length && <p className="text-sm text-slate-500">Belum ada data siswa.</p>}
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
