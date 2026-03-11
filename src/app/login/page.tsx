"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, GraduationCap, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api/client";
import { auth } from "@/lib/auth";

const schema = z.object({
  username: z.string().min(1, "Username wajib"),
  password: z.string().min(1, "Password wajib"),
});

type FormValues = z.infer<typeof schema>;

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

export default function LoginPage() {
  const router = useRouter();
  const [toast, setToast] = useState<ToastState>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const onSubmit = async (values: FormValues) => {
    setToast(null);
    try {
      const res = await api.post<{ token: string }>("/login", values);
      auth.setToken(res.data.token);
      setToast({ message: "Login berhasil, mengarahkan ke dashboard...", type: "success" });
      router.push("/students");
    } catch {
      setToast({ message: "Login gagal. Cek kredensial/API key.", type: "error" });
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-100 via-white to-indigo-100 px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.24),transparent_36%),radial-gradient(circle_at_85%_15%,rgba(99,102,241,0.24),transparent_32%)]" />

      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 flex w-[min(92vw,420px)] items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur animate-in fade-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          ) : (
            <ShieldAlert className="mt-0.5 size-5 shrink-0" />
          )}
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      <section className="relative mx-auto grid w-full max-w-5xl gap-6 rounded-3xl border border-white/60 bg-white/80 p-4 shadow-2xl backdrop-blur-md md:grid-cols-2 md:p-6">
        <div className="rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 p-6 text-white md:p-8">
          <div className="mb-6 inline-flex rounded-xl bg-white/20 p-3">
            <GraduationCap className="size-8" />
          </div>
          <h1 className="text-2xl font-bold leading-tight md:text-3xl">E-Raport Sekolah</h1>
          <p className="mt-3 text-sm text-white/90 md:text-base">
            Selamat datang. Kelola data siswa, nilai, kelas, dan laporan dengan tampilan yang lebih nyaman dan profesional.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 ring-1 ring-black/5 md:p-8">
          <h2 className="text-2xl font-semibold text-slate-900">Masuk</h2>
          <p className="mt-1 text-sm text-slate-500">Gunakan akun sekolah untuk melanjutkan.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="contoh: wali_kelas_a"
                {...register("username")}
              />
              {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <button
              disabled={isSubmitting}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
