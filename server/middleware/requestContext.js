import crypto from 'node:crypto';
import { log } from '../utils/logger.js';

export function requestContext(req, res, next) {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  req.logger = log.child({ requestId });
  next();
}
