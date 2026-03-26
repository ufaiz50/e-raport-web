export type Teacher = {
  id: number;
  uuid?: string;
  username: string;
  // Prefer using one of these for display when available
  full_name?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  school_id?: number;
};

export function teacherDisplayName(t: Teacher): string {
  if (!t) return "-";
  if (t.full_name && t.full_name.trim()) return t.full_name.trim();
  if (t.name && t.name.trim()) return t.name.trim();
  const combined = `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim();
  if (combined) return combined;
  return t.username;
}
