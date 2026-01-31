import config from "config";

export const Config = {
  PORT: config.get<number>("server.port"),
  CORS_ORIGIN: config.get<string>("server.corsOrigin"),
  KAFKA_CLIENT_ID: config.get<string>("kafka.clientId"),
  KAFKA_BROKER: config.get<string>("kafka.broker"),
  LOGGING_SILENT: config.get<boolean>("logging.silent"),
};
