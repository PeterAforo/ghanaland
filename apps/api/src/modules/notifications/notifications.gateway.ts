import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || 
                    client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });

      const userId = payload.sub as string;
      client.userId = userId;

      // Add socket to user's socket set
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)?.add(client.id);

      // Join user-specific room
      client.join(`user:${userId}`);

      this.logger.log(`Client ${client.id} connected for user ${userId}`);
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSocketSet = this.userSockets.get(client.userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
    }
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channels: string[] },
  ) {
    if (!client.userId) return;

    data.channels?.forEach((channel) => {
      // Only allow subscribing to own channels or public channels
      if (channel.startsWith(`user:${client.userId}`) || channel.startsWith('public:')) {
        client.join(channel);
        this.logger.log(`Client ${client.id} subscribed to ${channel}`);
      }
    });

    return { success: true, subscribed: data.channels };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channels: string[] },
  ) {
    data.channels?.forEach((channel) => {
      client.leave(channel);
    });

    return { success: true, unsubscribed: data.channels };
  }

  // Send notification to a specific user
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
    this.logger.log(`Sent ${event} to user ${userId}`);
  }

  // Send notification to multiple users
  sendToUsers(userIds: string[], event: string, data: any) {
    userIds.forEach((userId) => {
      this.sendToUser(userId, event, data);
    });
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Send to a specific room/channel
  sendToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && (this.userSockets.get(userId)?.size || 0) > 0;
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }
}
