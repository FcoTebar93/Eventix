export interface PaginationParams {
    page?: number | string;
    limit?: number | string;
}

export interface PaginationResult {
    skip: number;
    take: number;
    page: number;
}

export function parsePagination(params: PaginationParams): PaginationResult {
    const page = typeof params.page === 'string' ? parseInt(params.page, 10) : (params.page ?? 1);
    const limit = typeof params.limit === 'string' ? parseInt(params.limit, 10) : (params.limit ?? 10);
    
    const validLimit = Math.min(Math.max(limit, 1), 100);
    const validPage = Math.max(page, 1);
    const skip = (validPage - 1) * validLimit;

    return { skip, take: validLimit, page: validPage };
}
