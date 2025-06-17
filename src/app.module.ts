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
import { ZktecoGateway } from './zkteco/zkteco.gateway';
import { ZktecoService } from './zkteco/zkteco.service';
import { ZktecoModule } from './zkteco/zkteco.module';
import { BullModule } from '@nestjs/bull';
import { LogsProcessor } from './logs/logs.processor';
import { LoggerModule } from './logger/logger.module';
@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),

    MongooseModule.forRoot(
      'mongodb+srv://shahadatjaman16:shahadatjaman16@cluster0.vuvjeip.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
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
    // LoggerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
