import "server-only";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }

  static notFound(resource: string) {
    return new ApiError("NOT_FOUND", `${resource} not found`, 404);
  }

  static validation(details: unknown) {
    return new ApiError("VALIDATION_ERROR", "Validation failed", 400, details);
  }

  static conflict(message: string, details?: unknown) {
    return new ApiError("CONFLICT", message, 409, details);
  }

  static methodNotAllowed(message: string) {
    return new ApiError("METHOD_NOT_ALLOWED", message, 405);
  }
}
