export const notFound = (req, res, next) => {
  res.status(404).json({ status: 'error', message: 'API route not found', data: null });
};

export const errorHandler = (error, req, res, next) => {
  console.error('[API Error]', error);

  const statusCode = error.name === 'ValidationError' ? 400 : error.status || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({ status: 'error', message, data: null });
};
