import pino from "pino";
import { ENV } from "../config/env.js";

let logger;

export function getLogger() {
  if (!logger) {
    logger = pino({
      name: ENV.serviceName,
      level: ENV.logLevel,
      transport:
        ENV.nodeEnv === "development"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    });
  }
  return logger;
}

export const log = getLogger();
