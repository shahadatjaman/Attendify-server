import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { LogsService } from './logs.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomLogger } from 'src/logger/custom-logger.service';
import { Shift } from 'src/shifts/schemas/shift.schema';
import { User } from 'src/users/schemas/user.schema';
import { NewLog } from './schemas/new-log.schema';
import { ZktecoGateway } from 'src/zkteco/zkteco.gateway';
const _ = require('lodash');

@Injectable()
export class LogCreatedListener {
  constructor(
    @InjectModel('NewLog') private readonly logModel: Model<NewLog>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Shift') private readonly shiftModel: Model<Shift>,
    private readonly logger: CustomLogger,
    // private zktecoGateway: ZktecoGateway,
  ) {}

  // @OnEvent('log.created')
  handleUserCreatedEvent(payload: any) {
    console.log('Log created:', payload);
    // Do something like send email, log, etc.
  }

  @OnEvent('log.created')
  async processAndStoreLog(payload: any) {
    const { data, server } = payload;
    const { deviceUserId, recordTime, verifyType, verify_state } = data;

    const timestamp = new Date(recordTime);
    const logDate = timestamp.toISOString().split('T')[0];
    const timeStr = timestamp.toTimeString().slice(0, 5); // HH:mm
    // console.log('deviceUserId', deviceUserId);

    const user: any = await this.userModel.findOne({ userId: deviceUserId });
    // console.log('user', user);
    if (!user) return;

    const shifts = await this.shiftModel.find({ employees: { $in: [user._id] } });

    if (!shifts.length) return;

    // ✅ Try to match the current time to a shift
    const matchedShift = shifts.find((shift) => {
      const shiftStart = this._parseMinutes(shift.startAt);
      const shiftEnd = this._parseMinutes(shift.endAt);
      const current = this._parseMinutes(timeStr);

      if (shiftStart < shiftEnd) {
        // regular shift (e.g., 09:00–17:00)
        return current >= shiftStart && current <= shiftEnd;
      } else {
        // overnight shift (e.g., 22:00–01:00)
        return current >= shiftStart || current <= shiftEnd;
      }
    });

    const currentDay = this.getCurrentDayName();

    if (!matchedShift?.days.includes(currentDay)) return;

    if (!matchedShift) {
      // log still valid, but no shift matched
      this.logger.warn(`No matching shift found for ${deviceUserId} at ${timeStr}`, 'LogService');
      return;
    }

    let log = await this.logModel.findOne({ employee: user._id, logDate, isDeleted: false });

    switch (verify_state) {
      case 0:
        if (!log) {
          const graceTime = this.addMinutes(matchedShift.startAt, 1);

          const isLate = timeStr <= graceTime;

          const verifyTypeLabel = this._mapVerifyType(verifyType);

          const payload = {
            employee: user._id,
            logDate,
            checkInAt: timeStr,
            status: isLate ? 'LATE' : 'PRESENT',
            role: user.role,
            shiftId: matchedShift._id,
            verifyType: verifyTypeLabel,
            userId: deviceUserId,
          };

          const newLog = await this.logModel.create(payload);
          await newLog.populate({ path: 'employee', select: '-password -isVerified' });

          server.emit('live_logs', newLog);
        }

        break;

      case 1:
        if (log && !log.checkOutAt) {
          const isLeave = timeStr < matchedShift.endAt;

          const updatedPayload = {
            checkOutAt: timeStr,
            status: isLeave ? 'LEAVE' : 'PRESENT',
            userId: deviceUserId,
          };

          const updatedLog = await this.logModel.updateOne(
            { employee: user._id, logDate },
            updatedPayload,
            {
              new: true,
            },
          );

          if (updatedLog?.modifiedCount > 0) {
            const updatedLog = await this.logModel
              .findOne({ employee: user._id, logDate })
              .populate({ path: 'employee', select: '-password -isVerified' });

            server.emit('live_logs', updatedLog);
          }

          break;
        }
    }
  }
  private addMinutes(timeStr: string, minutes: number): string {
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date(0, 0, 0, hours, mins + minutes);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
  private _parseTime(timeStr: string): string {
    // "09:00" => "09:00"
    return timeStr;
  }

  private _mapVerifyType(code: number): 'CARD' | 'FINGER' | 'UNKNOWN' {
    if (code === 1) return 'FINGER';
    if (code === 4) return 'CARD';
    return 'UNKNOWN';
  }

  private _parseMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
  private getCurrentDayName() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    return days[today.getDay()];
  }
}
