/**
 * Pagination request parameters for API endpoints
 */
export type PaginationParams = {
  page?: number
  limit?: number
  orderBy?: string
  order?: "asc" | "desc"
}

/**
 * Pagination metadata included in API responses
 */
export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

/**
 * Paginated API response structure
 */
export type PaginatedResponse<T> = {
  data: T[]
  meta: PaginationMeta
}

/**
 * Parse and validate pagination parameters from URL
 * Applies defaults and enforces limits
 */
export function parsePaginationParams(url: URL): Required<PaginationParams> {
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)))
  const orderBy = url.searchParams.get("orderBy") || "updatedAt"
  const order = (url.searchParams.get("order") || "desc") as "asc" | "desc"

  return {
    page: isNaN(page) ? 1 : page,
    limit: isNaN(limit) ? 20 : limit,
    orderBy,
    order: order === "asc" ? "asc" : "desc",
  }
}

/**
 * Build pagination metadata from query results
 */
export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit)
  const hasMore = page < totalPages

  return {
    page,
    limit,
    total,
    totalPages,
    hasMore,
  }
}
