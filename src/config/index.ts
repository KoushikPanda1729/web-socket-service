import config from "config";

const getCorsOrigin = (): string[] => {
  const origin = config.get<string | string[]>("cors.origin");
  if (typeof origin === "string") {
    return origin.split(",").map((s) => s.trim());
  }
  return origin;
};

const getKafkaBrokers = (): string[] => {
  const brokers = config.get<string | string[]>("kafka.brokers");
  if (typeof brokers === "string") {
    return brokers.split(",").map((s) => s.trim());
  }
  return brokers;
};

const getKafkaSsl = (): boolean => {
  if (!config.has("kafka.ssl")) return false;
  const ssl = config.get<string | boolean>("kafka.ssl");
  if (typeof ssl === "string") {
    return ssl === "true";
  }
  return ssl;
};

const getLoggingSilent = (): boolean => {
  if (!config.has("logging.silent")) return false;
  const silent = config.get<string | boolean>("logging.silent");
  if (typeof silent === "string") {
    return silent === "true";
  }
  return silent;
};

export const Config = {
  PORT: config.get<number>("server.port"),
  CORS: {
    origin: getCorsOrigin(),
    credentials: config.has("cors.credentials")
      ? config.get<boolean>("cors.credentials")
      : true,
  },
  KAFKA_CLIENT_ID: config.get<string>("kafka.clientId"),
  KAFKA_BROKERS: getKafkaBrokers(),
  KAFKA_SASL: config.has("kafka.sasl")
    ? config.get<{
          mechanism: "plain" | "scram-sha-256" | "scram-sha-512";
          username: string;
          password: string;
      }>("kafka.sasl")
    : null,
  KAFKA_SSL: getKafkaSsl(),
  LOGGING_SILENT: getLoggingSilent(),
};
