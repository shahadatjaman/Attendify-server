import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NewLog } from './schemas/new-log.schema';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Shift } from 'src/shifts/schemas/shift.schema';
import { User } from 'src/users/schemas/user.schema';
import { CustomLogger } from 'src/logger/custom-logger.service';
import { OnEvent } from '@nestjs/event-emitter';
import { CreateLogDto } from './dto/create-log.dto';

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

  async processAndStoreLog(logData: { userId: string; recordTime: string; verifyType: number }) {
    const { userId, recordTime, verifyType } = logData;

    const timestamp = new Date(recordTime);
    const logDate = timestamp.toISOString().split('T')[0];
    const timeStr = timestamp.toTimeString().slice(0, 5); // HH:mm

    const user: any = await this.userModel.findOne({ userId });
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

  async create(createLogDto: CreateLogDto): Promise<any> {
    const existingLog = await this.logModel.findOne({
      logDate: createLogDto.logDate,
      shiftId: createLogDto.shiftId,
      isDeleted: false,
    });

    if (existingLog) {
      throw new ConflictException("You can't create  duplicate log!");
    }

    const user: any = await this.userModel.findOne({ userId: createLogDto.userId });

    if (!user) {
      throw new NotFoundException('Employee not found');
    }
    createLogDto.employee = user._id;
    createLogDto.verifyType = 'CUSTOME';

    const createdLog = new this.logModel(createLogDto);
    const savedLog = await createdLog.save();

    // Return the saved log with populated `employee` and `shiftId`
    return await this.logModel
      .findById(savedLog._id)
      .populate({ path: 'employee', select: '-password -isVerified -isDeleted' })
      .populate({ path: 'shiftId', select: '' });
  }

  // This method retrieves logs for the current day
  async getTodayLogs(): Promise<NewLog[]> {
    const todayDateString = new Date().toISOString().split('T')[0];
    return this.logModel
      .find({ logDate: todayDateString, isDeleted: false })
      .populate({ path: 'employee', select: '-password -isVerified -isDeleted' })
      .populate({ path: 'shiftId', select: '' });
  }

  async getLogs(): Promise<NewLog[]> {
    return this.logModel
      .find({ isDeleted: false })
      .populate({ path: 'employee', select: '-password -isVerified -isDeleted' })
      .populate({ path: 'shiftId', select: '' })
      .sort();
  }

  async deleteOne(logId: string) {
    try {
      const updated = await this.logModel.updateOne(
        { _id: new Types.ObjectId(logId) },
        { isDeleted: true },
        { new: true },
      );
      return updated;
    } catch (error) {
      throw new InternalServerErrorException('Error occurred to delete log');
    }
  }

  async getTodaySummary(): Promise<{
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalLeave: number;
  }> {
    const todayDateString = new Date().toISOString().split('T')[0];

    const [presentCount, absentCount, lateCount, leaveCount] = await Promise.all([
      this.logModel.countDocuments({
        logDate: todayDateString,
        status: 'PRESENT',
        isDeleted: true,
      }),
      this.logModel.countDocuments({
        logDate: todayDateString,
        status: 'ABSENT',
        isDeleted: true,
      }),
      this.logModel.countDocuments({
        logDate: todayDateString,
        status: 'LATE',
        isDeleted: true,
      }),
      this.logModel.countDocuments({
        logDate: todayDateString,
        status: 'LEAVE',
        isDeleted: true,
      }),
    ]);

    return {
      totalPresent: presentCount,
      totalAbsent: absentCount,
      totalLate: lateCount,
      totalLeave: leaveCount,
    };
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

// checkIn: 0
// checkOut: 1
// overTimeIn: 4
// overTimeOut:5
