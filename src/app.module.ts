import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DepartmentsModule } from './departments/departments.module';
import { ShiftModule } from './shifts/shifts.module';
import { LogsModule } from './logs/logs.module';
import { DeviceModule } from './devices/devices.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { SharedModule } from './shared/shared.module';
import { ConfigModule } from '@nestjs/config';

import { ZktecoModule } from './zkteco/zkteco.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { EmailModule } from './email/email.module';
import { LogCreatedListener } from './logs/LogCreatedListener';
import { NewLogSchema } from './logs/schemas/new-log.schema';
import { ShiftSchema } from './shifts/schemas/shift.schema';
import { UserSchema } from './users/schemas/user.schema';
import { CustomLogger } from './logger/custom-logger.service';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'NewLog', schema: NewLogSchema }]),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    MongooseModule.forFeature([{ name: 'Shift', schema: ShiftSchema }]),

    EventEmitterModule.forRoot({
      global: true,
    }),
    MongooseModule.forRoot(
      'mongodb+srv://classifysoft:1Qd1juj4drdMJjnK@cluster0.owbnf.mongodb.net/attendify-server?retryWrites=true&w=majority&appName=Cluster0',
    ),
    DepartmentsModule,
    ShiftModule,
    LogsModule,
    DeviceModule,
    AuthModule,
    RolesModule,
    UsersModule,
    SharedModule,
    ConfigModule.forRoot({
      isGlobal: true, // <-- makes ConfigService available app-wide
    }),
    ZktecoModule,
    EmailModule,
    // LoggerModule,
  ],
  controllers: [AppController],
  providers: [AppService, LogCreatedListener, CustomLogger],
})
export class AppModule {}
