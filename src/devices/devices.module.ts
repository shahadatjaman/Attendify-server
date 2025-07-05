// devices/device.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeviceSchema } from './schemas/device.schema';
import { DeviceController } from './devices.controller';
import { DeviceService } from './devices.service';
import { UserService } from 'src/users/users.service';
import { User, UserSchema } from 'src/users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Device', schema: DeviceSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [DeviceController],
  providers: [DeviceService],
})
export class DeviceModule {}
