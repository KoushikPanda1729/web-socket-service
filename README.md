# Web Socket Service

A real-time event delivery service that bridges **Apache Kafka** and **Socket.IO**. It consumes order events from Kafka topics and pushes them to connected WebSocket clients based on tenant, admin, and customer room membership.

## Architecture

```
                         +-----------------------+
                         |   Kafka Cluster       |
                         |   (order topic)       |
                         +----------+------------+
                                    |
                                    | consume
                                    v
+----------------+      +----------+------------+      +------------------+
|                |      |                       |      |                  |
|  Order Service +----->+  Web Socket Service   +----->+  Browser Client  |
|  (Producer)    | kafka|                       | ws   |  (Socket.IO)     |
|                |      |  +------------------+ |      +------------------+
+----------------+      |  | Message Handler  | |      +------------------+
                        |  |                  | |      |                  |
                        |  | Kafka Consumer   | +----->+  Admin Dashboard |
                        |  | Socket.IO Server | | ws   |  (Socket.IO)     |
                        |  +------------------+ |      +------------------+
                        +-----------------------+
```

### Message Flow

```
Kafka Topic ("order")
        |
        v
  KafkaBroker.consumeMessage()
        |
        v
  createMessageHandler(io)
        |
        |  parse JSON payload { event, data }
        |  extract tenantId, customerId
        v
  emitToRooms()
        |
        +---> io.to(tenantId)              --> Tenant managers
        +---> io.to("admin")               --> All admins
        +---> io.to("customer_<id>")       --> Specific customer
```

### Room Model

```
+-------------------------------------------+
|              Socket.IO Rooms               |
+-------------------------------------------+
|                                           |
|  "admin"          -- all admin users      |
|                                           |
|  "<tenantId>"     -- tenant managers      |
|   e.g. "3"          for tenant 3          |
|                                           |
|  "customer_<id>" -- individual customer  |
|   e.g. "customer_17"                      |
|                                           |
+-------------------------------------------+

Client joins a room by emitting:
  socket.emit("join", "admin")
  socket.emit("join", "3")
  socket.emit("join", "customer_17")
```

## Project Structure

```
web-socket-service/
  server.ts                        # Entry point - HTTP server, Socket.IO, Kafka bootstrap
  config/
    development.yaml               # Environment configuration
  src/
    config/
      index.ts                     # Config loader
      kafka.ts                     # KafkaBroker class (consumer)
      logger.ts                    # Winston logger
      messageHandler.ts            # Kafka message -> Socket.IO event routing
    factories/
      broker-factory.ts            # Singleton message broker factory
    types/
      broker.ts                    # TypeScript interfaces (MessageBroker, ConsumedMessage)
```

## Supported Events

| Kafka Event               | Socket.IO Event           | Rooms Notified                         |
| ------------------------- | ------------------------- | -------------------------------------- |
| `order-created`           | `order-created`           | tenant, admin, customer (if present)   |
| `order-status-updated`    | `order-status-updated`    | tenant, admin, customer (if present)   |
| `order-payment-completed` | `order-payment-completed` | tenant, admin, customer (if present)   |
| `order-payment-refunded`  | `order-payment-refunded`  | tenant, admin, customer (if present)   |
| `order-deleted`           | `order-deleted`           | tenant, admin, customer (if present)   |

### Kafka Message Format

```json
{
  "event": "order-created",
  "data": {
    "_id": "abc123",
    "tenantId": "3",
    "customerId": "17",
    "...": "other order fields"
  }
}
```

## Getting Started

### Prerequisites

- Node.js >= 18
- A running Kafka broker (default: `localhost:9092`)

### Install

```bash
npm install
```

### Run (development)

```bash
npm run dev
```

The server starts on port **5504** by default.

### Build

```bash
npm run build
```

### Configuration

Edit `config/development.yaml`:

```yaml
server:
  port: 5504
  corsOrigin: "*"

kafka:
  clientId: "web-socket-service"
  broker: "localhost:9092"
```

Override any value at runtime with the `NODE_CONFIG` environment variable:

```bash
NODE_CONFIG='{"server":{"port":6000}}' npm run dev
```

## Client Usage

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5504");

// Join rooms
socket.emit("join", "admin");         // receive all events
socket.emit("join", "3");             // receive events for tenant 3
socket.emit("join", "customer_17");   // receive events for customer 17

// Listen for events
socket.on("order-created", (data) => {
  console.log("New order:", data);
});

socket.on("order-status-updated", (data) => {
  console.log("Status changed:", data);
});
```

## Scaling

The current deployment is single-instance. Below is the target architecture for horizontal scaling.

### Scaled Architecture

```
                        +-------------------+
                        |  Kafka Cluster    |
                        |  (N partitions)   |
                        +--------+----------+
                                 |
              +------------------+------------------+
              |                  |                  |
              v                  v                  v
     +--------+------+  +-------+-------+  +-------+-------+
     |  Instance 1   |  |  Instance 2   |  |  Instance 3   |
     |               |  |               |  |               |
     | Socket.IO     |  | Socket.IO     |  | Socket.IO     |
     | Kafka Consumer|  | Kafka Consumer|  | Kafka Consumer|
     +-------+-------+  +-------+-------+  +-------+-------+
             |                   |                  |
             +--------+  +------+    +-------------+
                      |  |           |
                      v  v           v
               +------+--+----------+------+
               |       Redis Pub/Sub       |
               |    (adapter sync layer)   |
               +---------------------------+
                      |  |           |
             +--------+  +------+   +-------------+
             |                  |                  |
             v                  v                  v
        [ Clients ]        [ Clients ]        [ Clients ]
```

### What You Need to Scale

| Component | Purpose |
| --- | --- |
| **Redis Adapter** (`@socket.io/redis-adapter`) | Syncs Socket.IO events across instances via Redis Pub/Sub |
| **Kafka Partitions** | Multiple partitions on the `order` topic let each instance consume a subset |
| **Load Balancer** | NGINX or cloud LB to distribute WebSocket connections (sticky sessions or WS-only transport) |
| **Health Endpoint** | `/health` route for LB liveness checks |
| **Graceful Shutdown** | Disconnect Kafka consumer and close sockets on `SIGTERM` |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start with nodemon (hot reload) |
| `npm run build` | Lint + compile TypeScript to `dist/` |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **WebSocket**: Socket.IO 4.x
- **Message Broker**: Apache Kafka (KafkaJS)
- **Logging**: Winston
- **Config**: node-config (YAML)

## License

ISC
