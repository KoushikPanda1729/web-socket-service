import { Consumer, EachMessagePayload, Kafka } from "kafkajs";
import { MessageBroker, MessageHandler } from "../types/broker";

export class KafkaBroker implements MessageBroker {
  private consumer: Consumer;

  constructor(clientId: string, brokers: string[]) {
    const kafka = new Kafka({ clientId, brokers });

    this.consumer = kafka.consumer({ groupId: clientId });
  }

  async connectConsumer() {
    await this.consumer.connect();
  }

  async disconnectConsumer() {
    await this.consumer.disconnect();
  }

  async consumeMessage(
    topics: string[],
    fromBeginning: boolean = false,
    handler: MessageHandler,
  ) {
    await this.consumer.subscribe({ topics, fromBeginning });

    await this.consumer.run({
      eachMessage: async ({
        topic,
        partition,
        message,
      }: EachMessagePayload) => {
        await handler({
          topic,
          partition,
          offset: message.offset,
          key: message.key?.toString() ?? null,
          value: message.value?.toString() ?? null,
          headers: message.headers as Record<string, string | undefined>,
        });
      },
    });
  }
}
