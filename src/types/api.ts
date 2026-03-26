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

export type WithLegacyId = {
  id: number;
  uuid?: string;
};
