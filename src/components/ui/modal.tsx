"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({ open, title, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]" onClick={onClose} aria-label="Close modal" />

      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/70 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}
