// zkteco/zkteco.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class ZktecoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    console.log('[Socket] Client connected:', client.id);
  }

  handleDisconnect(client: any) {
    console.log('[Socket] Client disconnected:', client.id);
  }

  // Called by ZktecoService
  sendRealtimeLog(log: any) {
    this.server.emit('realtime-log', log);
  }
}
