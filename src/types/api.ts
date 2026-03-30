export type EntityId = string;

export type PaginationMeta = {
  offset: number;
  limit: number;
  total: number;
  count: number;
};

export type ListResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type ApiErrorResponse = {
  error: string;
};

export type WithIdentifier = {
  id?: EntityId;
  uuid?: EntityId;
};

export function getEntityId(entity: WithIdentifier): EntityId {
  return entity.uuid ?? entity.id ?? "";
}
