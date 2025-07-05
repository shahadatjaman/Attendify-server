import { OnEvent } from '@nestjs/event-emitter';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Device } from './schemas/device.schema';

@Injectable()
export class DeviceListener {
  constructor(@InjectModel('Device') private deviceModel: Model<Device>) {}

  @OnEvent('device.update')
  async processAndStoreLog(payload: any) {
    const { updates } = payload;

    await this.updateDeviceStatusAndUsers(updates);
  }

  async updateDeviceStatusAndUsers(updates: {
    status?: 'ACTIVE' | 'INACTIVE' | 'OFFLINE' | 'ONLINE';
    lastConnectedAt?: Date;
  }): Promise<Device> {
    const device = await this.deviceModel.findOne({});
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // Apply updates
    if (updates.status) device.status = updates.status;
    if (updates.lastConnectedAt && updates.status === 'ONLINE')
      device.lastConnectedAt = updates.lastConnectedAt;

    return await device.save();
  }

  @OnEvent('device.add_userId')
  async addUserId(payload: any): Promise<any> {
    const { userId } = payload;
    const uid = new Types.ObjectId(userId);

    const device = await this.deviceModel.findOne();

    if (!device) return;

    // Prevent duplicates
    if (!device.users.includes(uid)) {
      device.users.push(uid);
      await device.save();
    }

    return device;
  }

  @OnEvent('device.user_removed')
  async removeUserIdFromDevice(payload: any): Promise<any> {
    const { employeeId } = payload;
    const userId = new Types.ObjectId(employeeId);

    const device = await this.deviceModel.findOne({ users: userId });

    if (!device) return;

    // Remove employee if exists
    const index = device.users.indexOf(userId);
    if (index !== -1) {
      device.users.splice(index, 1);
      await device.save();
    }

    return device;
  }
}
