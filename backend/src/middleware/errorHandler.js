export const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
