"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { auth } from "@/lib/auth";
import type { ListResponse } from "@/types/api";
import { Modal } from "@/components/ui/modal";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/components/ui/toast-provider";
import { BookText, Eye, Hash, ImageIcon, MapPin, Pencil, Plus, School, Signature, Trash2, UserRound } from "lucide-react";

const DEFAULT_LIMIT = 10;

type School = {
  id: number;
  name: string;
  code: string;
  address?: string;
  npsn?: string;
  principal_name?: string;
  principal_nip?: string;
  headmaster_sign?: string;
  school_stamp?: string;
};

type SchoolPayload = Omit<School, "id">;

const emptyForm: SchoolPayload = {
  name: "",
  code: "",
  address: "",
  npsn: "",
  principal_name: "",
  principal_nip: "",
  headmaster_sign: "",
  school_stamp: "",
};

export default function SchoolsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [form, setForm] = useState<SchoolPayload>(emptyForm);
  const [editing, setEditing] = useState<School | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [detailSchool, setDetailSchool] = useState<School | null>(null);

  useEffect(() => {
    const role = auth.getRole();
    if (role && role !== "super_admin") {
      router.replace("/dashboard");
    }
  }, [router]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["schools", offset, limit],
    queryFn: async () => {
      const res = await api.get<ListResponse<School>>(`/schools?offset=${offset}&limit=${limit}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: SchoolPayload) => api.post("/schools", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      setForm(emptyForm);
      setOpenModal(false);
      showToast("School berhasil dibuat", "success");
    },
    onError: () => showToast("Gagal membuat school", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SchoolPayload }) => api.put(`/schools/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      setEditing(null);
      setForm(emptyForm);
      setOpenModal(false);
      showToast("School berhasil diupdate", "success");
    },
    onError: () => showToast("Gagal update school", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/schools/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      showToast("School berhasil dihapus", "success");
    },
    onError: () => showToast("Gagal hapus school", "error"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const onEdit = (row: School) => {
    setEditing(row);
    setForm({
      name: row.name,
      code: row.code,
      address: row.address ?? "",
      npsn: row.npsn ?? "",
      principal_name: row.principal_name ?? "",
      principal_nip: row.principal_nip ?? "",
      headmaster_sign: row.headmaster_sign ?? "",
      school_stamp: row.school_stamp ?? "",
    });
    setOpenModal(true);
  };

  const openCreateModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpenModal(true);
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sekolah (Super Admin)</h1>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <Plus className="size-4" /> Tambah Sekolah
        </button>
      </div>

      {isLoading && <p>Memuat...</p>}
      {isError && <p className="text-red-600">Gagal ambil data schools.</p>}

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
          rowKey={(row) => row.id}
          columns={[
            {
              key: "no",
              header: "No",
              render: (_row, idx) => <span className="text-sm font-medium text-slate-700">{offset + idx + 1}</span>,
            },
            {
              key: "school",
              header: "Sekolah",
              render: (s) => (
                <>
                  <div className="font-medium text-slate-900">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.address || "Alamat belum diisi"}</div>
                </>
              ),
            },
            {
              key: "code",
              header: "Kode",
              render: (s) => <span className="text-sm text-slate-700">{s.code}</span>,
            },
            {
              key: "npsn",
              header: "NPSN",
              render: (s) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{s.npsn ?? "-"}</span>,
            },
            {
              key: "principal",
              header: "Kepala Sekolah",
              render: (s) => <span className="text-sm text-slate-700">{s.principal_name ?? "-"}</span>,
            },
            {
              key: "action",
              header: "Aksi",
              className: "text-right",
              render: (s) => (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setDetailSchool(s)}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                  >
                    <Eye className="size-3" /> Detail
                  </button>
                  <button
                    onClick={() => onEdit(s)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    <Pencil className="size-3" /> Edit
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(s.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                  >
                    <Trash2 className="size-3" /> Hapus
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal open={openModal} title={editing ? "Ubah Sekolah" : "Tambah Sekolah"} onClose={() => setOpenModal(false)}>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Field label="Nama Sekolah" required icon={School}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Nama Sekolah" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          </Field>
          <Field label="Kode" required icon={BookText}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Kode" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required />
          </Field>
          <Field label="Alamat" icon={MapPin}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Alamat" value={form.address ?? ""} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
          </Field>
          <Field label="NPSN" icon={Hash}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="NPSN" value={form.npsn ?? ""} onChange={(e) => setForm((p) => ({ ...p, npsn: e.target.value }))} />
          </Field>
          <Field label="Nama Kepala Sekolah" icon={UserRound}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Nama Kepala Sekolah" value={form.principal_name ?? ""} onChange={(e) => setForm((p) => ({ ...p, principal_name: e.target.value }))} />
          </Field>
          <Field label="NIP Kepala Sekolah" icon={Signature}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="NIP Kepala Sekolah" value={form.principal_nip ?? ""} onChange={(e) => setForm((p) => ({ ...p, principal_nip: e.target.value }))} />
          </Field>
          <Field label="URL Tanda Tangan Kepala Sekolah" icon={ImageIcon}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="URL Tanda Tangan Kepala Sekolah" value={form.headmaster_sign ?? ""} onChange={(e) => setForm((p) => ({ ...p, headmaster_sign: e.target.value }))} />
          </Field>
          <Field label="URL Stempel Sekolah" icon={ImageIcon}>
            <input className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="URL Stempel Sekolah" value={form.school_stamp ?? ""} onChange={(e) => setForm((p) => ({ ...p, school_stamp: e.target.value }))} />
          </Field>
          <div className="lg:col-span-2 flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setOpenModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
            <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700" type="submit">
              {editing ? "Simpan Perubahan" : "Buat Sekolah"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detailSchool} title="Detail Sekolah" onClose={() => setDetailSchool(null)}>
        {detailSchool && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <DetailItem label="Nama Sekolah" value={detailSchool.name} />
            <DetailItem label="Kode" value={detailSchool.code} />
            <DetailItem label="Alamat" value={detailSchool.address} />
            <DetailItem label="NPSN" value={detailSchool.npsn} />
            <DetailItem label="Nama Kepala Sekolah" value={detailSchool.principal_name} />
            <DetailItem label="NIP Kepala Sekolah" value={detailSchool.principal_nip} />
            <DetailItem label="URL Tanda Tangan Kepala Sekolah" value={detailSchool.headmaster_sign} />
            <DetailItem label="URL Stempel Sekolah" value={detailSchool.school_stamp} />
          </div>
        )}
      </Modal>
    </>
  );
}

function Field({
  label,
  required,
  icon: Icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
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
      <div className="mt-1 text-sm text-slate-800 break-all">{value || "-"}</div>
    </div>
  );
}
