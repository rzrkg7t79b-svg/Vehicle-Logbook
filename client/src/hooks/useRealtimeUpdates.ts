import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";

type UpdateType = 
  | "flow-tasks"
  | "todos"
  | "vehicles"
  | "quality-checks"
  | "driver-tasks"
  | "module-status"
  | "users"
  | "timedriver-checks"
  | "upgrade-vehicles"
  | "future-planning";

const resourceToQueryKeys: Record<UpdateType, string[]> = {
  "flow-tasks": ["/api/flow-tasks"],
  "todos": ["/api/todos"],
  "vehicles": ["/api/vehicles", "/api/vehicles/"],
  "quality-checks": ["/api/quality-checks"],
  "driver-tasks": ["/api/driver-tasks"],
  "module-status": ["/api/module-status", "/api/dashboard/status"],
  "users": ["/api/users"],
  "timedriver-checks": ["/api/timedriver-checks"],
  "upgrade-vehicles": ["/api/upgrade-vehicles", "/api/upgrade-vehicles/date", "/api/dashboard/status"],
  "future-planning": ["/api/future-planning", "/api/dashboard/status"],
};

export function useRealtimeUpdates() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function connect() {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "update" && data.resource) {
            const queryKeys = resourceToQueryKeys[data.resource as UpdateType];
            if (queryKeys) {
              queryKeys.forEach((key) => {
                queryClient.invalidateQueries({ 
                  predicate: (query) => {
                    const queryKey = query.queryKey;
                    if (Array.isArray(queryKey) && queryKey.length > 0) {
                      return queryKey[0] === key || (typeof queryKey[0] === 'string' && queryKey[0].startsWith(key));
                    }
                    return false;
                  }
                });
              });
              console.log(`[WS] Refreshed: ${data.resource}`);
            }
          }
        } catch (err) {
          console.error("[WS] Failed to parse message:", err);
        }
      };

      ws.onclose = () => {
        console.log("[WS] Disconnected, reconnecting in 3s...");
        wsRef.current = null;
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error("[WS] Error:", error);
        ws.close();
      };
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
}
