"use client";

import { useMemo } from "react";

type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T, index: number) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  total: number;
  offset: number;
  limit: number;
  onOffsetChange: (offset: number) => void;
  onLimitChange: (limit: number) => void;
  pageSizeOptions?: number[];
  rowKey: (row: T, index: number) => string | number;
};

const defaultSizes = [5, 10, 20, 50];

export function DataTable<T>({
  columns,
  rows,
  total,
  offset,
  limit,
  onOffsetChange,
  onLimitChange,
  pageSizeOptions = defaultSizes,
  rowKey,
}: DataTableProps<T>) {
  const canPrev = offset > 0;
  const canNext = offset + limit < total;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  const pageNumbers = useMemo(() => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    if (totalPages <= 7) return pages;
    if (currentPage <= 4) return [1, 2, 3, 4, 5, -1, totalPages];
    if (currentPage >= totalPages - 3) return [1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
  }, [currentPage, totalPages]);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <div>
          Total: <span className="font-semibold text-slate-800">{total}</span> • Menampilkan: <span className="font-semibold text-slate-800">{rows.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">Data per halaman</label>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-left text-xs uppercase tracking-wide text-slate-500">
                {columns.map((col) => (
                  <th key={col.key} className={`border-b border-slate-200 px-4 py-3 font-semibold ${col.className ?? ""}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={rowKey(row, idx)} className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"} transition hover:bg-indigo-50/50`}>
                  {columns.map((col) => (
                    <td key={col.key} className="border-b border-slate-100 px-4 py-3 align-top">
                      {col.render(row, idx)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button disabled={!canPrev} onClick={() => onOffsetChange(Math.max(0, offset - limit))} className="rounded border px-3 py-2 text-sm disabled:opacity-40">Sebelumnya</button>
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) =>
            p === -1 ? (
              <span key={`dots-${idx}`} className="px-2 text-slate-400">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onOffsetChange((p - 1) * limit)}
                className={`rounded-lg px-3 py-1.5 text-sm ${p === currentPage ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
              >
                {p}
              </button>
            ),
          )}
        </div>
        <button disabled={!canNext} onClick={() => onOffsetChange(offset + limit)} className="rounded border px-3 py-2 text-sm disabled:opacity-40">Berikutnya</button>
      </div>
    </>
  );
}
