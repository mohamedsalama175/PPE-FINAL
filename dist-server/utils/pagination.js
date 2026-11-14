export function parsePagination(query) {
    let page = parseInt(query.page, 10);
    let limit = parseInt(query.limit, 10);
    if (isNaN(page) || page < 1)
        page = 1;
    if (isNaN(limit) || limit < 1)
        limit = 20;
    if (limit > 100)
        limit = 100;
    return { page, limit };
}
export function paginateMeta(total, page, limit) {
    return {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
    };
}
