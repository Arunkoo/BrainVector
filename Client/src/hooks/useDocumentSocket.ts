import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
/* eslint-disable @typescript-eslint/no-explicit-any */
interface UseDocumentSocketParams {
  workspaceId: string;
  documentId: string;
  onContentChange: (content: string) => void;
  onCursorChange: (cursor: any) => void;
}

export const useDocumentSocket = ({
  workspaceId,
  documentId,
  onContentChange,
  onCursorChange,
}: UseDocumentSocketParams) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!workspaceId || !documentId) return;
    const socket = io("http://localhost:3000", {
      transports: ["websocket"],
      withCredentials: true,
      query: {
        workspaceId,
        documentId,
      },
    });

    socketRef.current = socket;

    //listning to the sockets....
    socket.on("contentChange", (data) => {
      onContentChange(data.content);
    });
    socket.on("cursorChange", (data) => {
      onCursorChange?.(data);
    });
    socket.on("userJoined", (data) => {
      console.log("User Joined:", data);
    });
    socket.on("userLeft", (data) => {
      console.log("User Left:", data);
    });
    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, documentId]);

  //send updates ..
  const sendDocumentUpdate = (newContent: string) => {
    socketRef.current?.emit("documentUpdate", {
      documentId,
      newContent,
    });
  };

  const sendCursorUpdate = (position: number) => {
    socketRef.current?.emit("cursorUpdate", {
      documentId,
      position,
    });
  };

  return { sendDocumentUpdate, sendCursorUpdate };
};
