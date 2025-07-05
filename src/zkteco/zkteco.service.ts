// zkteco/zkteco.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import ZKSDK from 'zkteco-terminal';

import { Device } from '../devices/schemas/device.schema';
import { ZktecoGateway } from './zkteco.gateway';
import { LogsService } from 'src/logs/logs.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from 'src/users/schemas/user.schema';
import { Connection } from 'mongoose';
import { formatMongoDbStats } from 'src/utils';

@Injectable()
export class ZktecoService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async getDatabaseStats() {
    if (this.connection && this.connection.db) {
      const stats = await this.connection.db.stats();
      return formatMongoDbStats(stats);
    } else {
      return null;
    }
  }
}
