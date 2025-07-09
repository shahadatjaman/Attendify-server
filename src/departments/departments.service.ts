import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { Department } from './schemas/dept.schema';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { User } from 'src/users/schemas/user.schema';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name) private deptModel: Model<Department>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async checkDuplicateDeptName(name: string, excludeId?: string): Promise<boolean> {
    const query: any = { deptName: name };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const exists = await this.deptModel.findOne(query);
    return !!exists;
  }
  async create(deptDto: CreateDepartmentDto): Promise<any> {
    const isDuplicate = await this.checkDuplicateDeptName(deptDto.deptName);
    if (isDuplicate) {
      throw new ConflictException('Department name already exists');
    }

    const created = new this.deptModel(deptDto);
    const result = await created.save();
    return { message: 'Department created successfully', data: result, status: 201 };
  }

  async findAll(): Promise<Department[]> {
    return this.deptModel
      .find()
      .populate({ path: 'manager', select: '-password' })
      .populate({ path: 'employees', select: '-password' });
  }

  async findById(id: ObjectId): Promise<Department> {
    const dept = await this.deptModel
      .findById(id)
      .populate({ path: 'manager', select: '-password' })
      .populate({ path: 'employees', select: '-password' });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  // async findByName(deptId: string): Promise<Department> {
  //   const dept = await this.deptModel
  //     .findById(deptId)
  //     .populate({ path: 'manager', select: '-password' })
  //     .populate({ path: 'employees', select: '-password' });
  //   if (!dept) throw new NotFoundException('Department not found');
  //   return dept;
  // }

  async update(id: string, updateDto: UpdateDepartmentDto): Promise<any> {
    if (updateDto.deptName) {
      const isDuplicate = await this.checkDuplicateDeptName(updateDto.deptName, id);
      if (isDuplicate) {
        throw new ConflictException('Department name already exists');
      }
    }

    if (updateDto.manager) {
      const user: any = await this.findByUserId(updateDto.manager);

      if (user) {
        updateDto.manager = user._id;
      }
    }

    const updated = await this.deptModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .populate({ path: 'manager', select: '-password -isVerified' });
    if (!updated) throw new NotFoundException('Department not found');
    return { message: 'Department updated successfully', data: updated, status: 200 };
  }

  async delete(id: string): Promise<any> {
    const result = await this.deptModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Department not found');
    return { message: 'Department deleted successfully', status: 200 };
  }

  async findByUserId(id: string): Promise<User> {
    const user = await this.userModel.findOne({ userId: id });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async deleteManyDepartments(ids: string[]): Promise<{ deletedCount: number; status: number }> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    const result = await this.deptModel.deleteMany({ _id: { $in: objectIds } });

    if (result.deletedCount === 0) {
      throw new NotFoundException('No departments were deleted.');
    }

    return { deletedCount: result.deletedCount, status: 200 };
  }
}
