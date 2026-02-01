import config from "config";

export const Config = {
  PORT: config.get<number>("server.port"),
  CORS: config.get<{ origin: string[]; credentials: boolean }>("cors"),
  KAFKA_CLIENT_ID: config.get<string>("kafka.clientId"),
  KAFKA_BROKERS: config.get<string[]>("kafka.brokers"),
  KAFKA_SASL: config.has("kafka.sasl")
    ? config.get<{
          mechanism: "plain" | "scram-sha-256" | "scram-sha-512";
          username: string;
          password: string;
      }>("kafka.sasl")
    : null,
  KAFKA_SSL: config.has("kafka.ssl")
    ? config.get<boolean>("kafka.ssl")
    : false,
  LOGGING_SILENT: config.get<boolean>("logging.silent"),
};
