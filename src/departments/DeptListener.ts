import { OnEvent } from '@nestjs/event-emitter';
import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomLogger } from 'src/logger/custom-logger.service';

import { Department } from './schemas/dept.schema';

@Injectable()
export class DeptListener {
  constructor(
    @InjectModel(Department.name) private deptModel: Model<Department>,
    private readonly logger: CustomLogger,
  ) {}

  @OnEvent('dept.updated')
  async addEmployeeToDepartment(payload: any): Promise<any> {
    const { deptId, employeeId } = payload;

    const dept = await this.deptModel.findById(deptId);

    if (!dept) return;

    const empId = new Types.ObjectId(employeeId);

    // Prevent duplicates
    if (!dept.employees.includes(empId)) {
      dept.employees.push(empId);
      await dept.save();
    }

    return dept;
  }

  @OnEvent('dept.employee_removed')
  async removeEmployeeFromDepartment(payload: any): Promise<any> {
    console.log('payload', payload);
    const { employeeId } = payload;
    const empId = new Types.ObjectId(employeeId);

    const dept = await this.deptModel.findOne({ employees: empId });
    console.log('dept', dept);

    if (!dept) return;

    // Remove employee if exists
    const index = dept.employees.indexOf(empId);
    if (index !== -1) {
      dept.employees.splice(index, 1);
      await dept.save();
    }

    return dept;
  }
}
