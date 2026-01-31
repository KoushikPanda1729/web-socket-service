import winston from "winston";
import { Config } from "./index";

const logger = winston.createLogger({
  level: "info",
  defaultMeta: {
    serviceName: "web-socket-service",
  },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({
      dirname: "logs",
      filename: "combined.log",
      level: "info",
      silent: Config.LOGGING_SILENT,
    }),
    new winston.transports.File({
      dirname: "logs",
      filename: "error.log",
      level: "error",
      silent: Config.LOGGING_SILENT,
    }),
    new winston.transports.Console({
      level: "info",
      silent: Config.LOGGING_SILENT,
    }),
  ],
});

export default logger;
