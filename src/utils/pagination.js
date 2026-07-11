export const getPagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const sendPaginated = async ({ res, query, page, limit, dataKey = 'items' }) => {
  const [items, total] = await Promise.all([
    query.clone().skip((page - 1) * limit).limit(limit),
    query.model.countDocuments(query.getFilter()),
  ]);

  res.json({
    success: true,
    [dataKey]: items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
};
