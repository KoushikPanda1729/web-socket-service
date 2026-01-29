export interface ConsumedMessage {
  topic: string;
  partition: number;
  offset: string;
  key: string | null;
  value: string | null;
  headers?: Record<string, string | undefined>;
}

export type MessageHandler = (message: ConsumedMessage) => Promise<void>;

export interface MessageBroker {
  connectConsumer: () => Promise<void>;
  disconnectConsumer: () => Promise<void>;
  consumeMessage: (
    topics: string[],
    fromBeginning: boolean,
    handler: MessageHandler,
  ) => Promise<void>;
}
