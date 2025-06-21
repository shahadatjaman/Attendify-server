import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { LogsService } from './logs.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomLogger } from 'src/logger/custom-logger.service';
import { Shift } from 'src/shifts/schemas/shift.schema';
import { User } from 'src/users/schemas/user.schema';
import { NewLog } from './schemas/new-log.schema';

@Injectable()
export class LogCreatedListener {
  constructor(
    @InjectModel('NewLog') private readonly logModel: Model<NewLog>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Shift') private readonly shiftModel: Model<Shift>,
    private readonly logger: CustomLogger,
  ) {}

  // @OnEvent('log.created')
  handleUserCreatedEvent(payload: any) {
    console.log('Log created:', payload);
    // Do something like send email, log, etc.
  }

  @OnEvent('log.created')
  async processAndStoreLog(payload: any) {
    const { deviceUserId, recordTime, verifyType, verify_state } = payload;

    const timestamp = new Date(recordTime);
    const logDate = timestamp.toISOString().split('T')[0];
    const timeStr = timestamp.toTimeString().slice(0, 5); // HH:mm

    const user: any = await this.userModel.findOne({ deviceUserId });
    console.log('user', user);
    if (!user) return;

    const shifts = await this.shiftModel.find({ employees: { $in: [user._id.toString()] } });

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

    console.log('matchedShift', matchedShift);
    if (!matchedShift) {
      // log still valid, but no shift matched
      this.logger.warn(`No matching shift found for ${deviceUserId} at ${timeStr}`, 'LogService');
      return;
    }

    let status;

    switch (verify_state) {
      case '0':
        const isLate = timeStr > matchedShift.startAt;
        status = isLate ? 'LATE' : 'PRESENT';
        break;
    }

    const verifyTypeLabel = this._mapVerifyType(verifyType);

    // 🔁 Find existing log for the day
    let log = await this.logModel.findOne({ employee: user._id, logDate });

    if (!log) {
      log = new this.logModel({
        employee: user._id,
        logDate,
        checkInAt: timeStr,
        status,
        role: user.role,
        verifyType: verifyTypeLabel,
      });
    } else {
      log.checkOutAt = timeStr;
    }

    await log.save();
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
}
