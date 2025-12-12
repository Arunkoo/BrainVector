import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseDocumentSocketProps {
  workspaceId?: string;
  documentId?: string;
  onContentChange?: (data: { content: string; userId: string }) => void;
  onCursorChange?: (data: { position: number; userId: string }) => void;
  onUserJoined?: (data: { userId: string; onlineUsers: string[] }) => void;
  onUserLeft?: (data: { userId: string; onlineUsers: string[] }) => void;
}

export const useDocumentSocket = ({
  workspaceId,
  documentId,
  onContentChange,
  onCursorChange,
  onUserJoined,
  onUserLeft,
}: UseDocumentSocketProps = {}) => {
  const socketRef = useRef<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    if (!token) {
      setConnectionError("No authentication token found");
      return;
    }

    // Create socket connection
    const socket = io("http://localhost:3000", {
      auth: { token },
      query: {
        workspaceId: workspaceId || "",
        documentId: documentId || "",
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      console.log("Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      setIsConnected(false);
      setConnectionError(error.message);
      console.error("Socket connection error:", error);
    });

    socket.on("connected", (data) => {
      console.log("Authenticated with server:", data);
    });

    // Presence events
    socket.on("workspacePresence", (data: { onlineUsers: string[] }) => {
      setOnlineUsers(data.onlineUsers);
      console.log("Workspace presence:", data.onlineUsers);
    });

    socket.on("documentPresence", (data: { onlineUsers: string[] }) => {
      setOnlineUsers(data.onlineUsers);
      console.log("Document presence:", data.onlineUsers);
    });

    socket.on(
      "userJoinedWorkspace",
      (data: { userId: string; onlineUsers: string[] }) => {
        setOnlineUsers(data.onlineUsers);
        onUserJoined?.(data);
        console.log(`User ${data.userId} joined workspace`);
      }
    );

    socket.on(
      "userLeftWorkspace",
      (data: { userId: string; onlineUsers: string[] }) => {
        setOnlineUsers(data.onlineUsers);
        onUserLeft?.(data);
        console.log(`User ${data.userId} left workspace`);
      }
    );

    socket.on(
      "userJoinedDocument",
      (data: { userId: string; onlineUsers: string[] }) => {
        setOnlineUsers(data.onlineUsers);
        onUserJoined?.(data);
        console.log(`User ${data.userId} joined document`);
      }
    );

    socket.on(
      "userLeftDocument",
      (data: { userId: string; onlineUsers: string[] }) => {
        setOnlineUsers(data.onlineUsers);
        onUserLeft?.(data);
        console.log(`User ${data.userId} left document`);
      }
    );

    // Collaboration events
    socket.on("contentChange", (data: { content: string; userId: string }) => {
      onContentChange?.(data);
    });

    socket.on("cursorChange", (data: { position: number; userId: string }) => {
      onCursorChange?.(data);
    });

    socket.on("error", (data: { message: string }) => {
      console.error("Socket error:", data.message);
      setConnectionError(data.message);
    });

    // Heartbeat
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit("heartbeat");
      }
    }, 30000);

    // Cleanup
    return () => {
      clearInterval(heartbeatInterval);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Join workspace when workspaceId changes
  useEffect(() => {
    if (socketRef.current?.connected && workspaceId) {
      socketRef.current.emit("joinWorkspace", { workspaceId });
    }
  }, [workspaceId, isConnected]);

  // Join document when documentId changes
  useEffect(() => {
    if (socketRef.current?.connected && documentId && workspaceId) {
      socketRef.current.emit("joinDocument", { documentId, workspaceId });
    }
  }, [documentId, workspaceId, isConnected]);

  // Send document update
  const sendDocumentUpdate = useCallback(
    (content: string) => {
      if (socketRef.current?.connected && documentId) {
        socketRef.current.emit("documentUpdate", {
          documentId,
          newContent: content,
        });
      }
    },
    [documentId]
  );

  // Send cursor update
  const sendCursorUpdate = useCallback(
    (position: number) => {
      if (socketRef.current?.connected && documentId) {
        socketRef.current.emit("cursorUpdate", {
          documentId,
          position,
        });
      }
    },
    [documentId]
  );

  // Join workspace explicitly
  const joinWorkspace = useCallback((wsId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("joinWorkspace", { workspaceId: wsId });
    }
  }, []);

  // Leave workspace
  const leaveWorkspace = useCallback((wsId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leaveWorkspace", { workspaceId: wsId });
    }
  }, []);

  // Join document explicitly
  const joinDocument = useCallback((docId: string, wsId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("joinDocument", {
        documentId: docId,
        workspaceId: wsId,
      });
    }
  }, []);

  // Leave document
  const leaveDocument = useCallback((docId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leaveDocument", { documentId: docId });
    }
  }, []);

  // Request online users
  const getOnlineUsers = useCallback(() => {
    if (socketRef.current?.connected) {
      if (workspaceId) {
        socketRef.current.emit("getOnlineUsers", { workspaceId });
      } else if (documentId) {
        socketRef.current.emit("getOnlineUsers", { documentId });
      }
    }
  }, [workspaceId, documentId]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  // Reconnect
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  }, []);

  return {
    // State
    onlineUsers,
    isConnected,
    connectionError,

    // Actions
    sendDocumentUpdate,
    sendCursorUpdate,
    joinWorkspace,
    leaveWorkspace,
    joinDocument,
    leaveDocument,
    getOnlineUsers,
    disconnect,
    reconnect,

    // Socket instance
    socket: socketRef.current,
  };
};
