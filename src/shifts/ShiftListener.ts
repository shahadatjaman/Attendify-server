import { OnEvent } from '@nestjs/event-emitter';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Shift } from './schemas/shift.schema';

@Injectable()
export class ShiftListener {
  constructor(@InjectModel(Shift.name) private shiftModel: Model<Shift>) {}

  @OnEvent('shift.add_userId')
  async addUserId(payload: any): Promise<any> {
    try {
      const { userId } = payload;
      const uid = new Types.ObjectId(userId);

      const shift: any = await this.shiftModel.findOne();

      if (!shift) return;

      // Prevent duplicates
      if (!shift.employees.includes(uid)) {
        shift.employees.push(uid);
        await shift.save();
      }

      return shift;
    } catch (error) {
      console.log('error', error);
    }
  }

  @OnEvent('shift.user_removed')
  async removeUserIdFromShift(payload: any): Promise<any> {
    const { employeeId } = payload;
    const userId = new Types.ObjectId(employeeId);

    const shift = await this.shiftModel.findOne({ employees: userId });

    if (!shift) return;

    // Remove employee if exists
    const index = shift.employees.indexOf(userId);
    if (index !== -1) {
      shift.employees.splice(index, 1);
      await shift.save();
    }

    return shift;
  }
}
