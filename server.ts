import http from "http";
import { Server } from "socket.io";
import { Config } from "./src/config";
import logger from "./src/config/logger";
import { createMessageBroker } from "./src/factories/broker-factory";
import { createMessageHandler } from "./src/config/messageHandler";
import { MessageBroker } from "./src/types/broker";

const startServer = async () => {
  let broker: MessageBroker | null = null;

  try {
    const server = http.createServer();
    const io = new Server(server, {
      cors: {
        origin: Config.CORS_ORIGIN,
      },
    });

    io.on("connection", (socket) => {
      logger.info("Client connected:", { id: socket.id });

      socket.on("join", (tenantId: string) => {
        socket.join(tenantId);
        logger.info("Client joined room:", { id: socket.id, tenantId });
      });

      socket.on("disconnect", () => {
        logger.info("Client disconnected:", { id: socket.id });
      });
    });

    // Connect Kafka consumer
    broker = createMessageBroker();
    await broker.connectConsumer();
    logger.info("Kafka consumer connected");

    await broker.consumeMessage(["order"], false, createMessageHandler(io));
    logger.info("Consuming order topic");

    server.listen(Config.PORT, () => {
      logger.info(`WebSocket server running on port ${Config.PORT}`);
    });
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
