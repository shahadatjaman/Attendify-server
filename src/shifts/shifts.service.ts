// shifts/shift.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Shift } from './schemas/shift.schema';
import { Model } from 'mongoose';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';

@Injectable()
export class ShiftService {
  constructor(@InjectModel('Shift') private shiftModel: Model<Shift>) {}

  async isDuplicateShiftName(shiftName: string, excludeId?: string): Promise<boolean> {
    const filter: any = { shiftName };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const existing = await this.shiftModel.findOne(filter);
    return !!existing;
  }

  // Create
  async create(dto: CreateShiftDto) {
    const isDuplicate = await this.isDuplicateShiftName(dto.shiftName);
    if (isDuplicate) {
      throw new ConflictException('Shift name already exists');
    }

    const created = new this.shiftModel(dto);
    const result = await created.save();
    return { message: 'Shift created successfully', data: result };
  }

  async findAll() {
    const shifts = await this.shiftModel
      .find()
      .populate({ path: 'dep', select: 'deptName status' })
      .populate({ path: 'employees', select: '-password' }); // ✅
    return { message: 'Shifts retrieved successfully', data: shifts };
  }

  async findById(id: string) {
    const shift = await this.shiftModel
      .findById(id)
      .populate({ path: 'dep', select: 'deptName status' })
      .populate({ path: 'employees', select: '-password' }); // ✅
    if (!shift) throw new NotFoundException('Shift not found');
    return { message: 'Shift retrieved successfully', data: shift };
  }

  async update(id: string, dto: UpdateShiftDto) {
    if (dto.shiftName) {
      const isDuplicate = await this.isDuplicateShiftName(dto.shiftName, id);
      if (isDuplicate) {
        throw new ConflictException('Shift name already exists');
      }
    }

    const updated = await this.shiftModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException('Shift not found');
    return { message: 'Shift updated successfully', data: updated };
  }

  async delete(id: string) {
    const deleted = await this.shiftModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Shift not found');
    return { message: 'Shift deleted successfully' };
  }
}
