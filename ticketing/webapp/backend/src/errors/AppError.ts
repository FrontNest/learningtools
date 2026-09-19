// Centralized application error type so controllers can throw
// with an explicit HTTP status instead of leaking internal errors.
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly expose: boolean;

  constructor(message: string, statusCode = 400, expose = true) {
    super(message);
    this.statusCode = statusCode;
    this.expose = expose;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string) {
    return new AppError(message, 400);
  }

  static unauthorized(message = "Authentication required") {
    return new AppError(message, 401);
  }

  static forbidden(message = "Not authorized to perform this action") {
    return new AppError(message, 403);
  }

  static notFound(message = "Resource not found") {
    return new AppError(message, 404);
  }

  static conflict(message: string) {
    return new AppError(message, 409);
  }
}
