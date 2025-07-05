// shifts/shift.service.ts
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Shift } from './schemas/shift.schema';
import { Model, Types } from 'mongoose';
import { CreateShiftDto, UpdateShiftDto } from './dto/shift.dto';
import { DepartmentsService } from 'src/departments/departments.service';

@Injectable()
export class ShiftService {
  constructor(
    @InjectModel('Shift') private shiftModel: Model<Shift>,
    private deptService: DepartmentsService,
  ) {}

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

    const departments = await this.deptService.findById(dto.dept);

    if (departments.employees && departments.employees.length > 0) {
      const employeesIds = departments.employees.map((dept) => new Types.ObjectId(dept));
      dto.employees = employeesIds;
    }

    const created = new this.shiftModel(dto);

    let result = await created.save();

    result = await result.populate({ path: 'dept', select: 'deptName status' });
    // .populate({ path: 'employees', select: '-password' });

    return { message: 'Shift created successfully', data: result, status: 201 };
  }

  async findAll() {
    try {
      const shifts = await this.shiftModel
        .find()
        .populate({ path: 'dept', select: 'deptName status' })
        .populate({ path: 'employees', select: '-password' }); // ✅
      return { message: 'Shifts retrieved successfully', data: shifts };
    } catch (error) {
      throw new InternalServerErrorException(`Error occurred to fetch shift : ${error.message}`);
    }
  }

  async findById(id: string) {
    const shift = await this.shiftModel
      .findById(id)
      .populate({ path: 'dept', select: 'deptName status' })
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

    const updated = await this.shiftModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate({ path: 'dept', select: '' });
    if (!updated) throw new NotFoundException('Shift not found');
    return { message: 'Shift updated successfully', data: updated, status: 200 };
  }

  async delete(id: string) {
    const deleted = await this.shiftModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Shift not found');
    return { message: 'Shift deleted successfully', status: 200 };
  }

  async deleteManyDepartments(ids: string[]): Promise<{ deletedCount: number; status: number }> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    const result = await this.shiftModel.deleteMany({ _id: { $in: objectIds } });

    if (result.deletedCount === 0) {
      throw new NotFoundException('No shifts were deleted.');
    }

    return { deletedCount: result.deletedCount, status: 200 };
  }
}
