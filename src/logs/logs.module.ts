import { Module } from '@nestjs/common';
import { LogsService } from './logs.service';
import { MongooseModule } from '@nestjs/mongoose';
import { NewLogSchema } from './schemas/new-log.schema';

import { ShiftSchema } from 'src/shifts/schemas/shift.schema';
import { BullModule } from '@nestjs/bull';
import { UserSchema } from 'src/users/schemas/user.schema';
import { LoggerModule } from 'src/logger/logger.module';
import { LogCreatedListener } from './LogCreatedListener';

// ok
@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'NewLog', schema: NewLogSchema }]),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    MongooseModule.forFeature([{ name: 'Shift', schema: ShiftSchema }]),
    LoggerModule,
  ],

  providers: [LogsService],
})
export class LogsModule {}
