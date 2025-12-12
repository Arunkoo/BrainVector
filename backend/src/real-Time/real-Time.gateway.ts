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
import { WsExceptionFilter } from 'src/common/filters/ws-exception.filter';
import { DocumentService } from 'src/documents/document.service';
import { WorkspaceService } from 'src/workspaces/workspaces.service';

// Interface for authenticated user in socket...
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
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: 'collaboration',
})
@UseFilters(new WsExceptionFilter())
export class RealTimeGateWay
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RealTimeGateWay.name);

  // Maps for tracking users and their presence
  private userToDocumentMap = new Map<string, string>(); // socketId -> documentId
  private socketToUserMap = new Map<string, string>(); // socketId -> userId
  private documentToWorkspaceMap = new Map<string, string>(); // documentId -> workspaceId

  // Online presence tracking
  private onlineUsers = new Map<
    string,
    {
      userId: string;
      socketId: string;
      workspaceId?: string;
      documentId?: string;
      lastSeen: Date;
    }
  >();

  private workspaceUsers = new Map<string, Set<string>>(); // workspaceId -> Set<socketId>
  private documentUsers = new Map<string, Set<string>>(); // documentId -> Set<socketId>

  constructor(
    private authService: AuthService,
    private documentService: DocumentService,
    private workspaceService: WorkspaceService,
  ) {}

  // Authentication check...
  async handleConnection(client: Socket) {
    const jwtCookie = client.handshake.headers.cookie
      ?.split(';')
      .find((cookie) => cookie.startsWith('jwt='))
      ?.split('=')[1];

    if (!jwtCookie) {
      this.logger.warn(
        `Connection denied: No JWT cookie provided for socket ${client.id}`,
      );
      return client.disconnect(true);
    }

    try {
      const payload = this.authService.verifyJwt(jwtCookie);
      (client as AuthenticatedSocket).user = payload;

      const documentId = client.handshake.query.documentId as string;
      const workspaceId = client.handshake.query.workspaceId as string;

      // Store user in online users
      this.onlineUsers.set(client.id, {
        userId: payload.userId,
        socketId: client.id,
        lastSeen: new Date(),
      });

      // If workspaceId provided, join workspace room
      if (workspaceId) {
        await this.joinWorkspaceRoom(client, payload.userId, workspaceId);
      }

      // If documentId provided, join document room
      if (documentId && workspaceId) {
        // Check if user is authorized for this document
        await this.documentService.findOne(
          payload.userId,
          workspaceId,
          documentId,
        );

        await this.joinDocumentRoom(
          client,
          payload.userId,
          documentId,
          workspaceId,
        );
      }

      // Send initial connection success
      client.emit('connected', {
        userId: payload.userId,
        socketId: client.id,
        timestamp: new Date(),
      });

      this.logger.log(
        `User ${payload.userId} connected (socket: ${client.id})`,
      );
    } catch (error) {
      this.logger.error(
        `Authentication/Authorization error for socket ${client.id}`,
        error,
      );
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const userPresence = this.onlineUsers.get(client.id);
    const authenticatedSocket = client as AuthenticatedSocket;
    const userId = authenticatedSocket.user?.userId;

    if (userPresence) {
      const { workspaceId, documentId } = userPresence;

      // Leave workspace room if joined
      if (workspaceId) {
        await this.leaveWorkspaceRoom(client, workspaceId);
      }

      // Leave document room if joined
      if (documentId) {
        await this.leaveDocumentRoom(client, documentId);
      }

      // Remove from online users
      this.onlineUsers.delete(client.id);
      this.socketToUserMap.delete(client.id);

      const docId = this.userToDocumentMap.get(client.id);
      if (docId) {
        this.userToDocumentMap.delete(client.id);
      }

      this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
    }
  }

  // Join workspace room
  @SubscribeMessage('joinWorkspace')
  async handleJoinWorkspace(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { workspaceId: string },
  ) {
    const authenticatedSocket = client as AuthenticatedSocket;
    const userId = authenticatedSocket.user?.userId;

    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      // Check if user is member of workspace
      const role = await this.workspaceService.getUserWorkspaceRole(
        userId,
        data.workspaceId,
      );
      if (!role) {
        throw new Error('Not a member of this workspace');
      }

      await this.joinWorkspaceRoom(client, userId, data.workspaceId);

      return {
        event: 'workspaceJoined',
        data: {
          workspaceId: data.workspaceId,
          success: true,
          onlineUsers: this.getUsersInWorkspace(data.workspaceId),
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to join workspace: ${errorMessage}`);
      client.emit('error', { message: 'Failed to join workspace' });
    }
  }

  // Leave workspace room
  @SubscribeMessage('leaveWorkspace')
  async handleLeaveWorkspace(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { workspaceId: string },
  ) {
    await this.leaveWorkspaceRoom(client, data.workspaceId);
  }

  // Join document room
  @SubscribeMessage('joinDocument')
  async handleJoinDocument(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { documentId: string; workspaceId: string },
  ) {
    const authenticatedSocket = client as AuthenticatedSocket;
    const userId = authenticatedSocket.user?.userId;

    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      // Check authorization
      await this.documentService.findOne(
        userId,
        data.workspaceId,
        data.documentId,
      );

      // Join document room
      await this.joinDocumentRoom(
        client,
        userId,
        data.documentId,
        data.workspaceId,
      );

      return {
        event: 'documentJoined',
        data: {
          documentId: data.documentId,
          success: true,
          onlineUsers: this.getUsersInDocument(data.documentId),
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to join document: ${errorMessage}`);
      client.emit('error', { message: 'Failed to join document' });
    }
  }

  // Leave document room
  @SubscribeMessage('leaveDocument')
  async handleLeaveDocument(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { documentId: string },
  ) {
    await this.leaveDocumentRoom(client, data.documentId);
  }

  // Get online users in workspace
  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { workspaceId?: string; documentId?: string },
  ) {
    if (data.workspaceId) {
      const users = this.getUsersInWorkspace(data.workspaceId);
      client.emit('onlineUsers', {
        workspaceId: data.workspaceId,
        users,
        count: users.length,
      });
    } else if (data.documentId) {
      const users = this.getUsersInDocument(data.documentId);
      client.emit('onlineUsers', {
        documentId: data.documentId,
        users,
        count: users.length,
      });
    }
  }

  // Heartbeat to keep connection alive
  @SubscribeMessage('heartbeat')
  handleHeartbeat(@ConnectedSocket() client: Socket) {
    const userPresence = this.onlineUsers.get(client.id);
    if (userPresence) {
      userPresence.lastSeen = new Date();
      client.emit('heartbeatAck', { timestamp: new Date() });
    }
  }

  // Real Time collaboration logic
  @SubscribeMessage('documentUpdate')
  async handleDocumentUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { documentId: string; newContent: string },
  ) {
    const { documentId, newContent } = payload;
    const authenticatedSocket = client as AuthenticatedSocket;
    const userId = authenticatedSocket.user?.userId;

    if (!userId || this.userToDocumentMap.get(client.id) !== documentId) {
      this.logger.warn(`Unauthorized update attempt by socket ${client.id}`);
      return;
    }

    const workspaceId = this.documentToWorkspaceMap.get(documentId);
    if (!workspaceId) {
      this.logger.warn(`Workspace not found for the user with ${documentId}`);
      return;
    }

    // Broadcast the changes to all other connected clients in the room...
    client.to(documentId).emit('contentChange', {
      userId,
      content: newContent,
      timestamp: new Date().toISOString(),
    });

    // Save the changes in docs..
    await this.documentService.UpdateDocument(userId, workspaceId, documentId, {
      content: newContent,
    });

    this.logger.verbose(`User ${userId} updated document ${documentId}`);
    return { status: 'success', message: 'Update broadcasted.' };
  }

  // Handle cursor updates
  @SubscribeMessage('cursorUpdate')
  handleCursorUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { documentId: string; position: number },
  ) {
    const authenticatedSocket = client as AuthenticatedSocket;
    const userId = authenticatedSocket.user?.userId;

    if (
      !userId ||
      this.userToDocumentMap.get(client.id) !== payload.documentId
    ) {
      this.logger.warn(`Unauthorized update attempt by client ${client.id}`);
      return;
    }

    client.to(payload.documentId).emit('cursorChange', {
      userId,
      position: payload.position,
      timeStamp: new Date().toISOString(),
    });

    this.logger.verbose(
      `User ${userId} moved cursor in document ${payload.documentId}`,
    );
  }

  // ========== HELPER METHODS ==========

  private async joinWorkspaceRoom(
    client: Socket,
    userId: string,
    workspaceId: string,
  ) {
    // Leave previous workspace if any
    const userPresence = this.onlineUsers.get(client.id);
    if (userPresence?.workspaceId && userPresence.workspaceId !== workspaceId) {
      await this.leaveWorkspaceRoom(client, userPresence.workspaceId);
    }

    // Join new workspace room
    await client.join(`workspace:${workspaceId}`);

    // Update tracking
    if (!this.workspaceUsers.has(workspaceId)) {
      this.workspaceUsers.set(workspaceId, new Set());
    }
    this.workspaceUsers.get(workspaceId)!.add(client.id);

    // Update user presence
    if (userPresence) {
      userPresence.workspaceId = workspaceId;
    }

    // Get online users
    const onlineUsers = this.getUsersInWorkspace(workspaceId);

    // Notify client
    client.emit('workspacePresence', {
      workspaceId,
      onlineUsers,
      timestamp: new Date(),
    });

    // Notify others in workspace
    client.to(`workspace:${workspaceId}`).emit('userJoinedWorkspace', {
      userId,
      workspaceId,
      onlineUsers,
      timestamp: new Date(),
    });

    this.logger.log(`User ${userId} joined workspace ${workspaceId}`);
  }

  private async leaveWorkspaceRoom(client: Socket, workspaceId: string) {
    // Leave room
    await client.leave(`workspace:${workspaceId}`);

    // Update tracking
    const workspaceSockets = this.workspaceUsers.get(workspaceId);
    if (workspaceSockets) {
      workspaceSockets.delete(client.id);
      if (workspaceSockets.size === 0) {
        this.workspaceUsers.delete(workspaceId);
      }
    }

    // Update user presence
    const userPresence = this.onlineUsers.get(client.id);
    if (userPresence && userPresence.workspaceId === workspaceId) {
      userPresence.workspaceId = undefined;
    }

    // Get updated online users
    const onlineUsers = this.getUsersInWorkspace(workspaceId);

    // Notify others
    client.to(`workspace:${workspaceId}`).emit('userLeftWorkspace', {
      userId: userPresence?.userId,
      workspaceId,
      onlineUsers,
      timestamp: new Date(),
    });

    this.logger.log(
      `User ${userPresence?.userId} left workspace ${workspaceId}`,
    );
  }

  private async joinDocumentRoom(
    client: Socket,
    userId: string,
    documentId: string,
    workspaceId: string,
  ) {
    // Join workspace first if not already joined
    const userPresence = this.onlineUsers.get(client.id);
    if (
      !userPresence?.workspaceId ||
      userPresence.workspaceId !== workspaceId
    ) {
      await this.joinWorkspaceRoom(client, userId, workspaceId);
    }

    // Join document room
    await client.join(documentId);

    // Update tracking
    this.userToDocumentMap.set(client.id, documentId);
    this.documentToWorkspaceMap.set(documentId, workspaceId);

    if (!this.documentUsers.has(documentId)) {
      this.documentUsers.set(documentId, new Set());
    }
    this.documentUsers.get(documentId)!.add(client.id);

    // Update user presence
    if (userPresence) {
      userPresence.documentId = documentId;
    }

    // Get online users
    const onlineUsers = this.getUsersInDocument(documentId);

    // Notify client
    client.emit('documentPresence', {
      documentId,
      onlineUsers,
      timestamp: new Date(),
    });

    // Notify others in document
    client.to(documentId).emit('userJoinedDocument', {
      userId,
      documentId,
      onlineUsers,
      timestamp: new Date(),
    });

    this.logger.log(`User ${userId} joined document ${documentId}`);
  }

  private async leaveDocumentRoom(client: Socket, documentId: string) {
    // Leave room
    await client.leave(documentId);

    // Update tracking
    this.userToDocumentMap.delete(client.id);

    const documentSockets = this.documentUsers.get(documentId);
    if (documentSockets) {
      documentSockets.delete(client.id);
      if (documentSockets.size === 0) {
        this.documentUsers.delete(documentId);
        this.documentToWorkspaceMap.delete(documentId);
      }
    }

    // Update user presence
    const userPresence = this.onlineUsers.get(client.id);
    if (userPresence && userPresence.documentId === documentId) {
      userPresence.documentId = undefined;
    }

    // Get updated online users
    const onlineUsers = this.getUsersInDocument(documentId);

    // Notify others
    client.to(documentId).emit('userLeftDocument', {
      userId: userPresence?.userId,
      documentId,
      onlineUsers,
      timestamp: new Date(),
    });

    this.logger.log(`User ${userPresence?.userId} left document ${documentId}`);
  }

  private getUsersInWorkspace(workspaceId: string): string[] {
    const socketIds = this.workspaceUsers.get(workspaceId);
    if (!socketIds) return [];

    const userIds = new Set<string>();
    for (const socketId of socketIds) {
      const presence = this.onlineUsers.get(socketId);
      if (presence) {
        userIds.add(presence.userId);
      }
    }

    return Array.from(userIds);
  }

  private getUsersInDocument(documentId: string): string[] {
    const socketIds = this.documentUsers.get(documentId);
    if (!socketIds) return [];

    const userIds = new Set<string>();
    for (const socketId of socketIds) {
      const presence = this.onlineUsers.get(socketId);
      if (presence) {
        userIds.add(presence.userId);
      }
    }

    return Array.from(userIds);
  }

  // Public method to get online users count
  getOnlineStats() {
    const workspaceStats = Array.from(this.workspaceUsers.entries()).map(
      ([workspaceId]) => ({
        workspaceId,
        onlineCount: this.getUsersInWorkspace(workspaceId).length,
      }),
    );

    const documentStats = Array.from(this.documentUsers.entries()).map(
      ([documentId]) => ({
        documentId,
        onlineCount: this.getUsersInDocument(documentId).length,
      }),
    );

    return {
      totalOnline: this.onlineUsers.size,
      workspaceStats,
      documentStats,
    };
  }
}
