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
      cors: Config.CORS,
    });

    io.on("connection", (socket) => {
      logger.info("Client connected:", { id: socket.id });

      socket.on("join", (room: string) => {
        socket.join(room);
        // Log all rooms and connected sockets
        const rooms = io.sockets.adapter.rooms;
        const roomDetails: Record<string, string[]> = {};
        rooms.forEach((sids, roomName) => {
          // Skip per-socket rooms (each socket auto-joins a room with its own id)
          if (!io.sockets.sockets.has(roomName)) {
            roomDetails[roomName] = Array.from(sids);
          }
        });
        logger.info("Client joined room:", { id: socket.id, room, rooms: roomDetails });
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
