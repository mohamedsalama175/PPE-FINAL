export interface PaginationOptions {
  page: number;
  limit: number;
}

export function parsePagination(query: any): PaginationOptions {
  let page = parseInt(query.page as string, 10);
  let limit = parseInt(query.limit as string, 10);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 20;
  if (limit > 100) limit = 100;
  return { page, limit };
}

export function paginateMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}
