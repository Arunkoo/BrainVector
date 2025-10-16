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

//interface for authenticated user in socket...
interface JwtPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}
interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

//define the port
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

  //map to store which user is in which document room..
  private userToDocumentMap = new Map<string, string>(); //socket id----> documentId;
  private socketToUserMap = new Map<string, string>();
  private documentToWorkspaceMap = new Map<string, string>();
  constructor(
    private authService: AuthService,
    private documentService: DocumentService,
  ) {}

  //authentication check...
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
      (client as AuthenticatedSocket).user = payload; //attaaching the user data to the socket object...
      const documentId = client.handshake.query.documentId as string;
      const workspaceId = client.handshake.query.workspaceId as string;

      if (!documentId || !workspaceId) {
        this.logger.warn(
          `Connection denied: Missing documentId or workspaceId in query for socket ${client.id}`,
        );
        return client.disconnect(true);
      }

      //checking if a user is a member of the document's workspace...
      await this.documentService.findOne(
        payload.userId,
        workspaceId,
        documentId,
      );

      //join room:  if authorized, add the socket to document room..
      await client.join(documentId);
      this.userToDocumentMap.set(client.id, documentId);
      this.socketToUserMap.set(client.id, payload.userId);
      this.documentToWorkspaceMap.set(documentId, workspaceId);
      this.logger.log(`User ${payload.userId} connect to room: ${documentId}`);

      client.to(documentId).emit('userJoined', {
        userId: payload.userId,
        message: `${payload.userId} joined the document.`,
      });
    } catch (error) {
      this.logger.error(
        `Authentication/Authorization error for socket ${client.id}`,
        error,
      );
      client.disconnect(true);
    }
  }

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
      this.logger.log(
        `User ${user?.userId || client.id} disconneted from room: ${documentId}`,
      );
    }
  }

  //real Time collaboration logic....

  //main logic to handle the text update...  amybe a cursor upfdate also...
  @SubscribeMessage('documentUpdate')
  async handleDocumentUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { documentId: string; newContent: string },
  ) {
    const { documentId, newContent } = payload;
    const user = (client as AuthenticatedSocket).user;

    if (!user || this.userToDocumentMap.get(client.id) !== documentId) {
      return this.logger.warn(
        `Unauthorized update attempt by socket ${client.id}`,
      );
    }

    const workspaceId = this.documentToWorkspaceMap.get(documentId);
    if (!workspaceId) {
      return this.logger.warn(
        `Workspace not found for the user with ${documentId}`,
      );
    }

    //Broadcast the changes to all other connected client in the rooms...
    client.to(documentId).emit('contentChange', {
      userId: user.userId,
      content: newContent,
      timestamp: new Date().toISOString(),
    });

    //save the changes in docs..
    await this.documentService.UpdateDocument(
      user.userId,
      workspaceId,
      documentId,
      {
        content: newContent,
      },
    );
    this.logger.verbose(`User ${user.userId} updated document ${documentId}`);
  }
}
