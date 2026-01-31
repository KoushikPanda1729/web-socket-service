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
      data: Record<string, unknown> | null;
    };

    if (!payload.data) {
      logger.warn("Empty event data:", { event: payload.event });
      return;
    }

    const tenantId = payload.data.tenantId as string;
    const customerId = payload.data.customerId as string | undefined;

    // Emit to tenant room (managers), admin room (admins), and customer room (customers)
    const emitToRooms = (event: string, data: Record<string, unknown>) => {
      let emitter = io.to(tenantId).to("admin");
      if (customerId) {
        emitter = emitter.to(`customer_${customerId}`);
      }
      emitter.emit(event, data);
    };

    switch (payload.event) {
      case "order-created":
        logger.info("Order created:", { id: payload.data._id });
        emitToRooms(payload.event, payload.data);
        break;
      case "order-status-updated":
        logger.info("Order status updated:", { id: payload.data._id });
        emitToRooms(payload.event, payload.data);
        break;
      case "order-payment-completed":
        logger.info("Order payment completed:", { id: payload.data._id });
        emitToRooms(payload.event, payload.data);
        break;
      case "order-payment-refunded":
        logger.info("Order payment refunded:", { id: payload.data._id });
        emitToRooms(payload.event, payload.data);
        break;
      case "order-deleted":
        logger.info("Order deleted:", { id: payload.data._id });
        emitToRooms(payload.event, payload.data);
        break;
      default:
        logger.warn("Unknown event:", { event: payload.event });
    }
  };
};
