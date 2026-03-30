import type { EntityId } from "@/types/api";

export type School = {
  id?: EntityId;
  uuid?: EntityId;
  name: string;
  address?: string;
  npsn?: string;
};
