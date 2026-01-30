import { Server } from "socket.io";
import logger from "./logger";
import { ConsumedMessage, MessageHandler } from "../types/broker";

export const createMessageHandler = (io: Server): MessageHandler => {
  return async (message: ConsumedMessage) => {
    logger.info("Received message:", {
      topic: message.topic,
      partition: message.partition,
      offset: message.offset,
      key: message.key,
      value: message.value,
    });

    if (!message.value) {
      logger.warn("Empty message value");
      return;
    }

    const payload = JSON.parse(message.value) as {
      event: string;
      data: Record<string, unknown>;
    };

    const tenantId = payload.data.tenantId as string;

    switch (payload.event) {
      case "order-created":
        logger.info("Order created:", { id: payload.data._id });
        io.to(tenantId).emit(payload.event, payload.data);
        break;
      case "order-status-updated":
        logger.info("Order status updated:", { id: payload.data._id });
        io.to(tenantId).emit(payload.event, payload.data);
        break;
      case "order-payment-completed":
        logger.info("Order payment completed:", { id: payload.data._id });
        io.to(tenantId).emit(payload.event, payload.data);
        break;
      case "order-payment-refunded":
        logger.info("Order payment refunded:", { id: payload.data._id });
        io.to(tenantId).emit(payload.event, payload.data);
        break;
      case "order-deleted":
        logger.info("Order deleted:", { id: payload.data._id });
        io.to(tenantId).emit(payload.event, payload.data);
        break;
      default:
        logger.warn("Unknown event:", { event: payload.event });
    }
  };
};
