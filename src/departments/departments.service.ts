import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department } from './schemas/dept.schema';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(@InjectModel(Department.name) private deptModel: Model<Department>) {}

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
    return { message: 'Department created successfully', data: result };
  }

  async findAll(): Promise<Department[]> {
    return this.deptModel
      .find()
      .populate({ path: 'manager', select: '-password' })
      .populate({ path: 'employees', select: '-password' });
  }

  async findById(id: string): Promise<Department> {
    const dept = await this.deptModel
      .findById(id)
      .populate({ path: 'manager', select: '-password' })
      .populate({ path: 'employees', select: '-password' });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async update(id: string, updateDto: UpdateDepartmentDto): Promise<any> {
    if (updateDto.deptName) {
      const isDuplicate = await this.checkDuplicateDeptName(updateDto.deptName, id);
      if (isDuplicate) {
        throw new ConflictException('Department name already exists');
      }
    }
    const updated = await this.deptModel.findByIdAndUpdate(id, updateDto, { new: true });
    if (!updated) throw new NotFoundException('Department not found');
    return { message: 'Department updated successfully', data: updated };
  }

  async delete(id: string): Promise<any> {
    const result = await this.deptModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Department not found');
    return { message: 'Department deleted successfully' };
  }
}
