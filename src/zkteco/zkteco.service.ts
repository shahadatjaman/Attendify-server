// zkteco/zkteco.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import ZKSDK from 'zkteco-terminal';

import { Device } from '../devices/schemas/device.schema';
import { ZktecoGateway } from './zkteco.gateway';
import { LogsService } from 'src/logs/logs.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ZktecoService implements OnModuleInit {
  private zkInstance: ZKSDK;
  constructor(
    @InjectModel('Device') private readonly deviceModel: Model<Device>,
    private eventEmitter: EventEmitter2,
    private readonly zktecoGateway: ZktecoGateway,
    private readonly logsService: LogsService,
  ) {}

  async onModuleInit() {
    console.log('[ZK] Initializing connection to biometric device..');

    const device = await this.deviceModel.findOne();

    if (!device) {
      console.error('[ZK] No device found in database.');
      return;
    }

    const { deviceIp, devicePort } = device;

    try {
      this.zkInstance = new ZKSDK({ ip: '192.168.1.4', devicePort: 4370 });

      await this.zkInstance.createSocket(async (status) => {
        try {
          if (status) {
            await this.zkInstance.enableDevice();

            await this.zkInstance.getRealTimeLogs(async (data) => {
              this.eventEmitter.emit('log.created', data);
            });
          }
        } catch (error) {
          console.log('error', error);
        }
      });

      await this.zkInstance.enableDevice();

      // ✅ Listen for real-time attendance logs
      // await this.zkInstance.getRealTimeLogs(async (data) => {
      //   console.log('[ZK] Realtime Attendance:', data);
      //   await this.logQueue.add('storeLog', data);
      //   // await this.logsService.processAndStoreLog(data);

      //   // this.zktecoGateway.sendRealtimeLog(data); // ✅ emit to frontend
      // });

      // Optional: poll the device logs every 30s if real-time isn't firing
      // setInterval(async () => {
      //   const logs = await this.zkInstance.getAttendances(deviceIp);
      //   console.log('[ZK] Polled logs:', logs);
      // }, 30000);
    } catch (error) {
      console.error('[ZK] Failed to connect to device:', error.message);
    }
  }
}
