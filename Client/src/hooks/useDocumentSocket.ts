import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ContentChangePayload,
  CursorChangePayload,
  PresencePayload,
} from "../types/realtime";
import { createSocket, disconnectSocket, getSocket } from "../lib/socket";

export function useDocumentSocket(options: {
  workspaceId?: string | null;
  documentId?: string | undefined;
  onRemoteContent: (payload: ContentChangePayload) => void;
  onRemoteCursor?: (payload: CursorChangePayload) => void;
}) {
  const { workspaceId, documentId, onRemoteContent, onRemoteCursor } = options;

  //maintaing a list of online user....
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const socketRef = useRef<any>(null);

  // throttle state  to 200ms....
  const lastSentAt = useRef<number>(0);
  const pendingContent = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const THROTTLE_MS = 200;

  //connect and attach lstners..
  useEffect(() => {
    if (!workspaceId || !documentId) return;

    const WS_URL = import.meta.env.VITE_API_URL
      ? (import.meta.env.VITE_API_URL as string).replace(/\/api.*$/, "")
      : "http://localhost:3000";

    const socket = createSocket(WS_URL, { workspaceId, documentId });
    socketRef.current = socket;

    //connection logs....

    socket.on("connect", () => {
      console.log("[socket] connected", socket.id);
    });
    socket.on("connect_error", (err) => {
      console.warn("[socket] connect_error", err?.message ?? err);
    });
    socket.on("disconnect", (reason) => {
      console.log("[socket] disconnected", reason);
    });

    socket.on("contentChange", (payload: ContentChangePayload) => {
      if (!payload || typeof payload.content !== "string") return;
      onRemoteContent(payload);
    });

    socket.on("cursorChange", (payload: CursorChangePayload) => {
      if (!payload) return;
      onRemoteCursor?.(payload);
    });

    socket.on("userJoined", (payload: PresencePayload) => {
      if (!payload?.userId) return;
      setOnlineUsers((prev) => {
        if (prev.includes(payload.userId)) return prev;
        return [...prev, payload.userId];
      });
    });

    socket.on("userLeft", (payload: PresencePayload) => {
      if (!payload?.userId) return;
      setOnlineUsers((prev) => prev.filter((u) => u !== payload.userId));
    });

    return () => {
      // cleanup: stop listeners and disconnect if this was the only usage
      socket.off("contentChange");
      socket.off("cursorChange");
      socket.off("userJoined");
      socket.off("userLeft");
    };
  }, [workspaceId, documentId, onRemoteContent, onRemoteCursor]);

  const safeDisconnect = useCallback(() => {
    // remove all listeners and disconnect
    const s = getSocket();
    if (s) {
      s.off("contentChange");
      s.off("cursorChange");
      s.off("userJoined");
      s.off("userLeft");
    }
    disconnectSocket();
    socketRef.current = null;
    setOnlineUsers([]);
  }, []);

  // Throttled document update: coalesce updates and send at most once/200ms
  const sendDocumentUpdate = useCallback(
    (newContent: string) => {
      const s = getSocket();
      if (!s) return;

      const now = Date.now();
      const since = now - (lastSentAt.current || 0);

      if (since >= THROTTLE_MS) {
        lastSentAt.current = now;
        s.emit("documentUpdate", { documentId, newContent });
        // clear pending
        if (timerRef.current) {
          window.clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        pendingContent.current = null;
        return;
      }

      // otherwise schedule latest content to be sent later
      pendingContent.current = newContent;
      if (timerRef.current) return;

      const wait = THROTTLE_MS - since;
      timerRef.current = window.setTimeout(() => {
        const latest = pendingContent.current;
        if (latest != null) {
          const sock = getSocket();
          sock?.emit("documentUpdate", { documentId, newContent: latest });
          lastSentAt.current = Date.now();
        }
        pendingContent.current = null;
        timerRef.current = null;
      }, wait) as unknown as number;
    },
    [documentId]
  );

  const sendCursorUpdate = useCallback(
    (position: number) => {
      const s = getSocket();
      if (!s) return;
      s.emit("cursorUpdate", { documentId, position });
    },
    [documentId]
  );

  return {
    sendDocumentUpdate,
    sendCursorUpdate,
    onlineUsers,
    safeDisconnect,
  };
}
