import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { log } from "./index";

let wss: WebSocketServer;

export function setupWebSocket(httpServer: Server) {
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    log("WebSocket client connected", "ws");

    ws.on("close", () => {
      log("WebSocket client disconnected", "ws");
    });

    ws.on("error", (error) => {
      log(`WebSocket error: ${error.message}`, "ws");
    });
  });

  log("WebSocket server initialized", "ws");
}

export type UpdateType = 
  | "flow-tasks"
  | "todos"
  | "vehicles"
  | "quality-checks"
  | "driver-tasks"
  | "module-status"
  | "users"
  | "timedriver-checks"
  | "timedriver-calculation"
  | "dashboard";

export function broadcastUpdate(type: UpdateType) {
  if (!wss) return;

  const message = JSON.stringify({ type: "update", resource: type });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  log(`Broadcast update: ${type}`, "ws");
}
