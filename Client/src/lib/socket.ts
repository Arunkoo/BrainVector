import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function createSocket(
  url: string,
  query: Record<string, string | undefined>
) {
  if (socket) return socket;
  socket = io(url, {
    transports: ["websocket"],
    withCredentials: true,
    query,
    autoConnect: true,
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}
