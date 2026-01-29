import logger from "./src/config/logger";
import { createMessageBroker } from "./src/factories/broker-factory";
import { handleMessage } from "./src/config/messageHandler";
import { MessageBroker } from "./src/types/broker";

const startServer = async () => {
  let broker: MessageBroker | null = null;
  try {
    broker = createMessageBroker();
    await broker.connectConsumer();
    logger.info("Kafka consumer connected");

    await broker.consumeMessage(["order"], false, handleMessage);
    logger.info("Consuming order topic");
  } catch (err) {
    logger.error("Error happened: ", err.message);

    if (broker) {
      await broker
        .disconnectConsumer()
        .catch((e) => logger.error("Failed to disconnect consumer:", e));
    }

    process.exit(1);
  }
};

void startServer();
