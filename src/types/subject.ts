import type { EntityId } from "@/types/api";

export type SubjectItem = {
  id?: EntityId;
  uuid?: EntityId;
  title?: string;
  name?: string;
  author?: string;
  school_id?: EntityId;
  teacher_id?: EntityId;
};

export function subjectLabel(subject?: Pick<SubjectItem, "title" | "name"> | null): string {
  if (!subject) return "-";
  return subject.title || subject.name || "-";
}
