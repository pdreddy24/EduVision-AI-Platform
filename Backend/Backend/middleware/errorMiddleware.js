import multer from "multer";

export function notFoundHandler(req, res) {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "File too large. Maximum size is 20 MB." });
    }

    return res.status(400).json({ message: "Invalid file upload", code: error.code });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;

  if (status >= 500) {
    req.log.error({ err: error, method: req.method, path: req.originalUrl }, "unhandled request error");
  }

  return res.status(status).json({
    message: status >= 500 ? "Internal server error" : error.message,
    ...(process.env.NODE_ENV !== "production" && { detail: error.message }),
  });
}
