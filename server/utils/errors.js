export class HttpError extends Error {
  /**
   * @param {any} status
   * @param {string | undefined} message
   * @param {any} details
   */
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message, undefined);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden') {
    super(403, message, undefined);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not Found') {
    super(404, message, undefined);
  }
}

export class ValidationError extends HttpError {
  /**
   * @param {any} details
   */
  constructor(message = 'Invalid request', details) {
    super(400, message, details);
  }
}

/**
 * @param {{ status: any; }} error
 */
export function isHttpError(error) {
  return error instanceof HttpError || (error && typeof error.status === 'number');
}
