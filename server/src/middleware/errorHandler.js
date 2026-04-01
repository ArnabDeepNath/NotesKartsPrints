const errorHandler = (err, req, res, next) => {
  console.error("[Error]", err.stack || err.message);

  // Prisma errors
  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] || "field";
    return res.status(409).json({ message: `${field} already exists` });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ message: "Record not found" });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token" });
  }
  if (err.name === "TokenExpiredError") {
    return res
      .status(401)
      .json({ message: "Token expired", code: "TOKEN_EXPIRED" });
  }

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(400)
      .json({ message: "File too large. Max 5MB allowed." });
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message, errors: err.errors });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode < 500 ? err.message : "Internal server error";
  res.status(statusCode).json({ message });
};

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

module.exports = { errorHandler, AppError };
