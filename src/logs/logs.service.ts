import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NewLog } from './schemas/new-log.schema';
import { Injectable } from '@nestjs/common';
import { Shift } from 'src/shifts/schemas/shift.schema';
import { User } from 'src/users/schemas/user.schema';
import { CustomLogger } from 'src/logger/custom-logger.service';

const VERIFY_TYPE_MAP = {
  1: 'FINGER',
  4: 'CARD',
};

@Injectable()
export class LogsService {
  constructor(
    @InjectModel('NewLog') private readonly logModel: Model<NewLog>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Shift') private readonly shiftModel: Model<Shift>,
    private readonly logger: CustomLogger,
  ) {}

  async processAndStoreLog(logData: { userId: string; attTime: string; verifyType: number }) {
    const { userId, attTime, verifyType } = logData;

    const timestamp = new Date(attTime);
    const logDate = timestamp.toISOString().split('T')[0];
    const timeStr = timestamp.toTimeString().slice(0, 5); // HH:mm

    const user: any = await this.userModel.findOne({ userId });
    if (!user) return;

    const shifts = await this.shiftModel.find({ employees: { $in: [user._id.toString()] } });

    console.log('shifts', shifts);

    if (!shifts.length) return;

    // ✅ Try to match the current time to a shift
    const matchedShift = shifts.find((shift) => {
      const shiftStart = this._parseMinutes(shift.startAt);
      const shiftEnd = this._parseMinutes(shift.endAt);
      const current = this._parseMinutes(timeStr);
      //
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
      this.logger.warn(`No matching shift found for ${userId} at ${timeStr}`, 'LogService');
      return;
    }

    const isLate = timeStr > matchedShift.startAt;
    const status = isLate ? 'LATE' : 'PRESENT';
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
