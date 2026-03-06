"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api/client";
import { auth } from "@/lib/auth";

const schema = z.object({
  username: z.string().min(1, "Username wajib"),
  password: z.string().min(1, "Password wajib"),
  school_id: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError("");
    try {
      const res = await api.post<{ token: string }>("/login", values);
      auth.setToken(res.data.token);
      router.push("/students");
    } catch {
      setError("Login gagal. Cek kredensial/API key.");
    }
  };

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-semibold">Login E-Raport</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm">Username</label>
          <input className="w-full rounded border px-3 py-2" {...register("username")} />
          {errors.username && <p className="text-sm text-red-600">{errors.username.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm">Password</label>
          <input type="password" className="w-full rounded border px-3 py-2" {...register("password")} />
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm">School ID (optional untuk login tenant)</label>
          <input type="number" className="w-full rounded border px-3 py-2" {...register("school_id")} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button disabled={isSubmitting} className="rounded bg-black px-4 py-2 text-white disabled:opacity-60">
          {isSubmitting ? "Loading..." : "Login"}
        </button>
      </form>
    </main>
  );
}
