// devices/device.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeviceSchema } from './schemas/device.schema';
import { DeviceController } from './devices.controller';
import { DeviceService } from './devices.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Device', schema: DeviceSchema }])],
  controllers: [DeviceController],
  providers: [DeviceService],
})
export class DeviceModule {}
