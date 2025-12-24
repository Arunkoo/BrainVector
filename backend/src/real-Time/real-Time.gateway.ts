import { Logger, UseFilters } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { DocumentService } from 'src/documents/document.service';
import { WsExceptionFilter } from 'src/common/filters/ws-exception.filter';

// interface for authenticated user in socket
interface JwtPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
@UseFilters(new WsExceptionFilter())
export class RealTimeGateWay
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RealTimeGateWay.name);

  private userToDocumentMap = new Map<string, string>(); // socketId -> documentId
  private socketToUserMap = new Map<string, string>(); // socketId -> userId
  private documentToWorkspaceMap = new Map<string, string>(); // documentId -> workspaceId
  private onlineUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private authService: AuthService,
    private documentService: DocumentService,
  ) {}

  /** Handle connection with JWT authentication */
  async handleConnection(client: Socket) {
    try {
      const jwtCookie = client.handshake.headers.cookie
        ?.split(';')
        .find((cookie) => cookie.startsWith('jwt='))
        ?.split('=')[1];

      if (!jwtCookie) {
        this.logger.warn(`Connection denied: No JWT cookie for ${client.id}`);
        return client.disconnect(true);
      }

      const payload = this.authService.verifyJwt(jwtCookie);
      (client as AuthenticatedSocket).user = payload;

      // Join personal room for workspace notifications
      await client.join(payload.userId);
      this.onlineUsers.set(payload.userId, client.id);

      const documentId = client.handshake.query.documentId as string;
      const workspaceId = client.handshake.query.workspaceId as string;

      if (documentId && workspaceId) {
        // Verify membership
        await this.documentService.findOne(
          payload.userId,
          workspaceId,
          documentId,
        );

        await client.join(documentId);
        this.userToDocumentMap.set(client.id, documentId);
        this.socketToUserMap.set(client.id, payload.userId);
        this.documentToWorkspaceMap.set(documentId, workspaceId);

        client.to(documentId).emit('userJoined', {
          userId: payload.userId,
          message: `${payload.userId} joined the document.`,
        });

        this.logger.log(
          `User ${payload.userId} connected to document room: ${documentId}`,
        );
      } else {
        this.logger.log(`User ${payload.userId} connected (dashboard only)`);
      }
    } catch (error) {
      this.logger.error(`Auth error for socket ${client.id}`, error);
      client.disconnect(true);
    }
  }

  /** Handle disconnect */
  async handleDisconnect(client: Socket) {
    const documentId = this.userToDocumentMap.get(client.id);
    const user = (client as AuthenticatedSocket).user;

    if (documentId) {
      client.to(documentId).emit('userLeft', {
        userId: user?.userId,
        message: `${user?.userId || client.id} left the document.`,
      });
      await client.leave(documentId);
      this.userToDocumentMap.delete(client.id);
      this.socketToUserMap.delete(client.id);
      this.documentToWorkspaceMap.delete(documentId);
      this.logger.log(
        `User ${user?.userId || client.id} disconnected from document ${documentId}`,
      );
    }

    if (user?.userId) {
      this.onlineUsers.delete(user.userId);
      await client.leave(user.userId);
    }
  }

  /** Notify a specific user about workspace updates */
  notifyUserWorkspaceUpdate(userId: string) {
    this.server.to(userId).emit('workspaceUpdated', {
      message: 'Your workspace list has been updated.',
      timestamp: new Date().toISOString(),
    });
  }

  /** Handle document content updates */
  @SubscribeMessage('documentUpdate')
  async handleDocumentUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { documentId: string; newContent: string },
  ) {
    const { documentId, newContent } = payload;
    const user = (client as AuthenticatedSocket).user;

    if (!user || this.userToDocumentMap.get(client.id) !== documentId) {
      return this.logger.warn(`Unauthorized update by socket ${client.id}`);
    }

    const workspaceId = this.documentToWorkspaceMap.get(documentId);
    if (!workspaceId) return;

    // Broadcast changes to other users in room
    client.to(documentId).emit('contentChange', {
      userId: user.userId,
      content: newContent,
      timestamp: new Date().toISOString(),
    });

    // Save changes in DB
    await this.documentService.UpdateDocument(
      user.userId,
      workspaceId,
      documentId,
      { content: newContent },
    );

    this.logger.verbose(`User ${user.userId} updated document ${documentId}`);
  }

  /** Handle cursor movements */
  @SubscribeMessage('cursorUpdate')
  handleCursorUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { documentId: string; position: number },
  ) {
    const user = (client as AuthenticatedSocket).user;

    if (!user || this.userToDocumentMap.get(client.id) !== payload.documentId) {
      return this.logger.warn(`Unauthorized cursor update by ${client.id}`);
    }

    client.to(payload.documentId).emit('cursorChange', {
      userId: user.userId,
      position: payload.position,
      timeStamp: new Date().toISOString(),
    });

    this.logger.verbose(
      `User ${user.userId} moved cursor in document ${payload.documentId}`,
    );
  }

  /** Check if a user is online */
  isUserOnline(userId: string) {
    return this.onlineUsers.has(userId);
  }
}
