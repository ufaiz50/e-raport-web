"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ListResponse } from "@/types/api";
import { BookOpenCheck, Building2, ClipboardList, FileText, Sparkles, Users } from "lucide-react";

type StudentItem = { id: number; name: string; type: "junior" | "senior"; email: string };
type ClassItem = { id: number; name: string; level: string; academic_year: string };

const tinyLimit = 5;

export default function DashboardPage() {
  const studentsQuery = useQuery({
    queryKey: ["dashboard", "students"],
    queryFn: async () => {
      const res = await api.get<ListResponse<StudentItem>>(`/students?offset=0&limit=${tinyLimit}`);
      return res.data;
    },
  });

  const classesQuery = useQuery({
    queryKey: ["dashboard", "classes"],
    queryFn: async () => {
      const res = await api.get<ListResponse<ClassItem>>(`/classes?offset=0&limit=${tinyLimit}`);
      return res.data;
    },
  });

  const gradesQuery = useQuery({
    queryKey: ["dashboard", "grades"],
    queryFn: async () => {
      const res = await api.get<ListResponse<unknown>>(`/grades?offset=0&limit=1`);
      return res.data;
    },
  });

  const attendancesQuery = useQuery({
    queryKey: ["dashboard", "attendances"],
    queryFn: async () => {
      const res = await api.get<ListResponse<unknown>>(`/attendances?offset=0&limit=1`);
      return res.data;
    },
  });

  const reportNotesQuery = useQuery({
    queryKey: ["dashboard", "report-notes"],
    queryFn: async () => {
      const res = await api.get<ListResponse<unknown>>(`/report-notes?offset=0&limit=1`);
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

  const recommendation = useMemo(() => {
    const tips: string[] = [];

    if (totals.students === 0) tips.push("Mulai dari input data siswa agar proses nilai & laporan bisa berjalan.");
    if (totals.classes === 0) tips.push("Tambahkan data kelas dan tahun ajaran untuk struktur akademik.");
    if (totals.grades < totals.students) tips.push("Lengkapi nilai siswa agar rapor semester lebih siap.");
    if (totals.attendances < totals.students) tips.push("Update data kehadiran supaya ringkasan rapor lebih akurat.");
    if (totals.reportNotes < totals.students) tips.push("Isi catatan wali kelas untuk personalisasi rapor tiap siswa.");

    if (tips.length === 0) {
      tips.push("Data utama sudah terisi rapi. Lanjutkan validasi akhir dan persiapan cetak rapor.");
    }

    return tips.slice(0, 3);
  }, [totals]);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-700 p-6 text-white">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
          <Sparkles className="size-3.5" /> Insight Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-bold">Dashboard E-Raport</h1>
        <p className="mt-1 text-sm text-white/90">Ringkasan data akademik sekolah yang cepat dibaca dan siap dieksekusi.</p>
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

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Siswa terbaru</h2>
              <div className="space-y-2">
                {(studentsQuery.data?.data ?? []).map((s) => (
                  <div key={s.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <div className="font-medium text-slate-800">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.email} • {s.type}</div>
                  </div>
                ))}
                {!studentsQuery.data?.data?.length && <p className="text-sm text-slate-500">Belum ada data siswa.</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Kelas terbaru</h2>
              <div className="space-y-2">
                {(classesQuery.data?.data ?? []).map((c) => (
                  <div key={c.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <div className="font-medium text-slate-800">{c.name} ({c.level})</div>
                    <div className="text-xs text-slate-500">Tahun Ajaran: {c.academic_year}</div>
                  </div>
                ))}
                {!classesQuery.data?.data?.length && <p className="text-sm text-slate-500">Belum ada data kelas.</p>}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">
            <h2 className="mb-3 text-lg font-semibold text-indigo-900">Rekomendasi untuk dashboard sekolah</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-indigo-900/90">
              {recommendation.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
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
