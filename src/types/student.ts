import type { EntityId } from "@/types/api";

export type Student = {
  id?: EntityId;
  uuid?: EntityId;
  first_name: string;
  last_name: string;
  email: string;
  nis?: string;
  nisn?: string;
  gender?: string;
  birth_place?: string;
  birth_date?: string;
  address?: string;
  phone?: string;
  religion?: string;
  parent_name?: string;
  parent_phone?: string;
  status?: string;
  class_id?: EntityId;
  school_id?: EntityId;
};
