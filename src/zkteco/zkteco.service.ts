// zkteco/zkteco.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import ZKSDK from 'attendify';

import { Device } from '../devices/schemas/device.schema';
import { ZktecoGateway } from './zkteco.gateway';
import { LogsService } from 'src/logs/logs.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class ZktecoService implements OnModuleInit {
  private zkInstance: ZKSDK;
  constructor(
    @InjectModel('Device') private readonly deviceModel: Model<Device>,
    @InjectQueue('logs') private readonly logQueue: Queue,

    private readonly zktecoGateway: ZktecoGateway,
    private readonly logsService: LogsService,
  ) {}

  async onModuleInit() {
    console.log('[ZK] Initializing connection to biometric device..');

    const device = await this.deviceModel.findOne();
    console.log('device', device);
    if (!device) {
      console.error('[ZK] No device found in database.');
      return;
    }

    const { deviceIp, devicePort } = device;

    try {
      this.zkInstance = new ZKSDK({ ip: deviceIp, devicePort });

      await this.zkInstance.createSocket();

      console.log(`[ZK] Connected to device at ${deviceIp}:${devicePort}`);

      await this.zkInstance.enableDevice();

      // ✅ Listen for real-time attendance logs
      await this.zkInstance.getRealTimeLogs(async (data) => {
        console.log('[ZK] Realtime Attendance:', data);
        // await this.logQueue.add('storeLog', data);
        await this.logsService.processAndStoreLog(data);

        // this.zktecoGateway.sendRealtimeLog(data); // ✅ emit to frontend
      });

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
