import type { EntityId } from "@/types/api";

export type ClassItem = {
  id?: EntityId;
  uuid?: EntityId;
  name: string;
  level: string;
  homeroom?: string;
  academic_year: string;
  school_id?: EntityId;
};
