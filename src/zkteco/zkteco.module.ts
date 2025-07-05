import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ZktecoService } from './zkteco.service';
import { ZktecoGateway } from './zkteco.gateway';
import { DeviceSchema } from 'src/devices/schemas/device.schema';
import { LogsService } from 'src/logs/logs.service';
import { NewLogSchema } from 'src/logs/schemas/new-log.schema';

import { ShiftSchema } from 'src/shifts/schemas/shift.schema';

import { BullModule } from '@nestjs/bull';
import { UserSchema } from 'src/users/schemas/user.schema';
import { CustomLogger } from 'src/logger/custom-logger.service';
import { LoggerModule } from 'src/logger/logger.module';
import { LogCreatedListener } from 'src/logs/LogCreatedListener';
import { DeviceService } from 'src/devices/devices.service';
import { ZktecoController } from './zkteco.controller';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'logs' }), // ✅ REQUIRED here

    MongooseModule.forFeature([{ name: 'Device', schema: DeviceSchema }]),
    MongooseModule.forFeature([{ name: 'NewLog', schema: NewLogSchema }]),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    MongooseModule.forFeature([{ name: 'Shift', schema: ShiftSchema }]),
    LoggerModule,
  ],
  providers: [ZktecoService, ZktecoGateway, LogsService, DeviceService],
  controllers: [ZktecoController],
})
export class ZktecoModule {}
