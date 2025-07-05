import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Connection } from 'mongoose';
import { Model } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { DeviceService } from 'src/devices/devices.service';
import { User } from 'src/users/schemas/user.schema';
import { formatMongoDbStats } from 'src/utils';
import ZKSDK from 'zkteco-terminal';

interface ConnectedClient {
  id: string;
  userId?: string;
  username?: string;
}

@WebSocketGateway({ cors: true })
export class ZktecoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // ✅ Store connected clients by socket ID
  private connectedClients = new Map<string, ConnectedClient>();

  private zkInstance: ZKSDK;
  private deviceStatus;

  // private connectionStatus: false;

  private connectionStatus: boolean;

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectConnection() private readonly connection: Connection,
    private readonly deviceService: DeviceService,
    private eventEmitter: EventEmitter2,
  ) {
    this.connectDevice();
  }

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    // const username = client.handshake.query.username as string;

    const connectedClient: ConnectedClient = {
      id: client.id,
      userId,
      // username,
    };

    this.connectedClients.set(client.id, connectedClient);
    console.log('[Socket] Client connected:', connectedClient);
    this.broadcastConnectedClients();

    this.deviceInfo();

    if (this.deviceStatus) {
      const time = await this.zkInstance.getTime();
      await this.sendDeviceTime(time);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'getDatabaseStats',
  })
  async getDatabaseStats() {
    if (this.connection && this.connection.db) {
      const stats = await this.connection.db.stats();
      this.server.emit('database-stats', formatMongoDbStats(stats));
    } else {
      return null;
    }
  }
  async connectDevice() {
    console.log('[ZK] Initializing connection to biometric device..');

    let currentDeviceInfo: { ip: string; port: any } | null = null;

    const reconnectWithDeviceIp = async (ip: string, port: any) => {
      let connectionPayload = { ip, devicePort: port };
      try {
        if (this.connectionStatus) {
          console.log('socket closed');
          await this.zkInstance.disconnect(); // Optional cleanup if needed
          this.connectionStatus = false;
        }

        this.zkInstance = new ZKSDK(connectionPayload);

        await this.zkInstance.createSocket(async (status) => {
          this.connectionStatus = status;
          try {
            this.deviceStatus = status;

            if (status) {
              const users = await this.userModel.find();

              if (users) {
                const usersFromDevice = await this.zkInstance.getUsers();

                if (usersFromDevice) {
                  const ids = usersFromDevice.map((user) => user.userId);

                  const notExistUsers: any = users.filter(
                    (user: User) => !ids.includes(user.userId),
                  );

                  if (notExistUsers && notExistUsers.length > 0) {
                    const userMapped = notExistUsers.map((user: User) => ({
                      uid: user.userId,
                      userid: user.userId,
                      name: user.firstname,
                      password: '1234567',
                      cardno: user.cardNo || 0,
                    }));

                    for (const user of userMapped) {
                      await this.zkInstance.setUser(
                        user.uid,
                        user.userid,
                        user.name,
                        '1234567',
                        user.cardno,
                      );
                    }
                  }
                } else {
                  const userMapped = users.map((user: User) => ({
                    uid: user.userId,
                    userid: user.userId,
                    name: user.firstname,
                    password: '1234567',
                    cardno: user.cardNo || 0,
                  }));
                  for (const user of userMapped) {
                    await this.zkInstance.setUser(
                      user.uid,
                      user.userid,
                      user.name,
                      '1234567',
                      user.cardno,
                    );
                  }
                }
              }

              this.eventEmitter.emit('device.update', {
                updates: { status: 'ONLINE', lastConnectedAt: new Date() },
              });
              this.sendRealtimeDeviceInfo({
                status: 'ONLINE',
                lastConnectedAt: new Date(),
              });

              await this.zkInstance.enableDevice();

              await this.zkInstance.getRealTimeLogs(async (data) => {
                console.log('data', data);
                this.eventEmitter.emit('log.created', { data, server: this.server });
              });
            } else {
              this.eventEmitter.emit('device.update', {
                updates: { status: 'OFFLINE', lastConnectedAt: new Date() },
              });

              await this.sendRealtimeDeviceInfo({ status: 'OFFLINE' });
            }
          } catch (error) {
            console.log('Error in device status handler:', error);
          }
        });
      } catch (error) {
        console.error('[ZK] Failed to connect to device:', error);
      }
    };

    const checkDeviceChanges = async () => {
      const device = await this.deviceService.findOne();

      // console.log('device', device);
      if (!device) {
        console.warn('[ZK] No device found in DB.');
        return;
      }

      const ip = device.deviceIp;
      const port = device.devicePort;

      if (!currentDeviceInfo || currentDeviceInfo.ip !== ip || currentDeviceInfo.port !== port) {
        console.log(`[ZK] Detected device config change. Reconnecting...`);
        currentDeviceInfo = { ip, port };
        await reconnectWithDeviceIp(ip, port);
      }
    };

    // Initial connect
    await checkDeviceChanges();

    // 🔁 Check every 10 seconds for IP/port change
    setInterval(checkDeviceChanges, 10000); // 10s
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    console.log('[Socket] Client disconnected:', client.id);
    this.broadcastConnectedClients();
  }

  // ✅ Emit current connected clients list
  broadcastConnectedClients() {
    const clients = Array.from(this.connectedClients.values());
    this.server.emit('connected-clients', clients);
  }

  async deviceInfo() {
    const device = await this.deviceService.findOne();

    this.server.emit('device-info', device);
  }

  async sendRealtimeLog(log: any) {
    this.server.emit('realtime-log', log);
  }

  async sendDeviceTime(time: any) {
    this.server.emit('device-time', time);
  }

  async sendRealtimeDeviceInfo(device: any) {
    this.server.emit('realtime-device', device);
    const newDevice = await this.deviceService.findOne();

    // console.log('newDevice', newDevice);
    if (newDevice) {
      this.server.emit('device-details', newDevice);
    }
  }

  @SubscribeMessage('setTime')
  async setTime(@MessageBody() data: any) {
    if (!data.dateTime) return null;

    const formatedDate = new Date(data.dateTime);

    if (this.connectionStatus) {
      await this.zkInstance.setTime(formatedDate);
    }
  }

  @SubscribeMessage('restartDevice')
  async restartDevice(@MessageBody() data: any) {
    console.log('data', data);
    if (this.connectionStatus) {
      await this.zkInstance.shutdown();
    }
  }

  notifyUserAdded(user: any) {
    this.server.emit('user-added', user);
  }

  notifyUserDeleted(userId: string) {
    this.server.emit('user-deleted', userId);
  }
}
