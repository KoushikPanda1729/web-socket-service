import config from "config";

export const Config = {
  KAFKA_CLIENT_ID: config.get<string>("kafka.clientId"),
  KAFKA_BROKER: config.get<string>("kafka.broker"),
};
