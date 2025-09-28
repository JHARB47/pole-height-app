export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}

export class ValidationError extends HttpError {
  constructor(message = 'Invalid request', details) {
    super(400, message, details);
  }
}

export function isHttpError(error) {
  return error instanceof HttpError || (error && typeof error.status === 'number');
}
