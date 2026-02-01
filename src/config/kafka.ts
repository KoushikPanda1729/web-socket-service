import { Consumer, EachMessagePayload, Kafka, type KafkaConfig, type SASLOptions } from "kafkajs";
import { MessageBroker, MessageHandler } from "../types/broker";

export class KafkaBroker implements MessageBroker {
  private consumer: Consumer;

  constructor(
    clientId: string,
    brokers: string[],
    sasl?: { mechanism: string; username: string; password: string } | null,
  ) {
    let kafkaConfig: KafkaConfig = { clientId, brokers };

    if (sasl) {
      kafkaConfig = {
        ...kafkaConfig,
        ssl: {
          rejectUnauthorized: true,
        },
        sasl: {
          mechanism: sasl.mechanism,
          username: sasl.username,
          password: sasl.password,
        } as SASLOptions,
      };
    }

    const kafka = new Kafka(kafkaConfig);

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
