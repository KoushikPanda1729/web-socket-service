import logger from "./logger";
import { ConsumedMessage } from "../types/broker";

export const handleMessage = async (message: ConsumedMessage) => {
  logger.info("Received message:", {
    topic: message.topic,
    partition: message.partition,
    offset: message.offset,
    key: message.key,
  });

  if (!message.value) {
    logger.warn("Empty message value");
    return;
  }

  const payload = JSON.parse(message.value) as {
    event: string;
    data: Record<string, unknown>;
  };

  switch (payload.event) {
    case "order-created":
      logger.info("Order created:", { id: payload.data._id });
      // TODO: Emit to WebSocket clients
      break;
    case "order-status-updated":
      logger.info("Order status updated:", { id: payload.data._id });
      // TODO: Emit to WebSocket clients
      break;
    case "order-payment-completed":
      logger.info("Order payment completed:", { id: payload.data._id });
      // TODO: Emit to WebSocket clients
      break;
    case "order-payment-refunded":
      logger.info("Order payment refunded:", { id: payload.data._id });
      // TODO: Emit to WebSocket clients
      break;
    case "order-deleted":
      logger.info("Order deleted:", { id: payload.data._id });
      // TODO: Emit to WebSocket clients
      break;
    default:
      logger.warn("Unknown event:", { event: payload.event });
  }
};
