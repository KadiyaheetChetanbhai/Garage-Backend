export const paginationHelper = (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || null;
    const sortField = query.sortField || 'createdAt';
    const sortOrder = query.sortOrder == 1 ? 1 : -1;

    return {
        page,
        limit,
        skip,
        searchTerm,
        sortField,
        sortOrder,
    };
};

export const generateNavigations = (page, limit, total) => {
    const totalPages = Math.ceil(total / limit);
    const nextPage = page < totalPages ? page + 1 : null;
    const previousPage = page > 1 ? page - 1 : null;

    return {
        totalPages,
        nextPage,
        previousPage,
    };
};
