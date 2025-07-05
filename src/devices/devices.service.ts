import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device } from './schemas/device.schema';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { UserService } from 'src/users/users.service';
import { User } from 'src/users/schemas/user.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class DeviceService {
  constructor(
    @InjectModel('Device') private deviceModel: Model<Device>,
    @InjectModel(User.name) private userModel: Model<User>,
    private eventEmitter: EventEmitter2,
  ) {}

  async isDuplicateDeviceName(name?: string, excludeId?: string): Promise<boolean> {
    const filter: any = { deviceName: name || '' };
    if (excludeId) filter._id = { $ne: excludeId };
    return !!(await this.deviceModel.findOne(filter));
  }

  async isDuplicateDeviceIp(ip: string, excludeId?: string): Promise<boolean> {
    const filter: any = { deviceIp: ip };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const exists = await this.deviceModel.findOne(filter);
    return !!exists;
  }

  async create(dto: CreateDeviceDto) {
    const device = await this.deviceModel.findOne({});

    if (device) {
      const updated = await this.deviceModel.findByIdAndUpdate(device._id, dto, { new: true });
      if (!updated) throw new NotFoundException('Device not found');
      return { message: 'Device updated successfully', data: updated };
    }

    if (await this.isDuplicateDeviceName(dto?.deviceName)) {
      throw new ConflictException('Device name already exists');
    }
    if (await this.isDuplicateDeviceIp(dto.deviceIp)) {
      throw new ConflictException('Device IP already exists');
    }

    const users = await this.userModel.find();

    if (users) {
      const userIds: any = users.map((user) => user._id);
      dto.users = userIds;
    }

    const created = new this.deviceModel(dto);
    const result = await created.save();
    return { message: 'Device created successfully', data: result };
  }

  async update(id: string, dto: UpdateDeviceDto) {
    if (dto.deviceName && (await this.isDuplicateDeviceName(dto.deviceName, id))) {
      throw new ConflictException('Device name already exists');
    }
    if (dto.deviceIp && (await this.isDuplicateDeviceIp(dto.deviceIp, id))) {
      throw new ConflictException('Device IP already exists');
    }

    const updated = await this.deviceModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException('Device not found');
    return { message: 'Device updated successfully', data: updated };
  }
  async findOneDevice(): Promise<Device | null> {
    return this.deviceModel.findOne().exec();
  }
  async findAll() {
    const devices = await this.deviceModel
      .find()
      .populate({ path: 'users', select: '-password' })
      .populate('logCount'); // virtual field

    return { message: 'Devices retrieved successfully', data: devices };
  }

  async findById(id: string) {
    const device = await this.deviceModel
      .findById(id)
      .populate({ path: 'users', select: '-password' })
      .populate('logCount');

    if (!device) throw new NotFoundException('Device not found');
    return { message: 'Device retrieved successfully', data: device };
  }

  async findOne() {
    try {
      const device = await this.deviceModel.findOne();

      if (!device) throw new NotFoundException('Device not found');
      return device;
    } catch (error) {
      return null;
    }
  }

  async delete(id: string) {
    const result = await this.deviceModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Device not found');

    return { message: 'Device deleted successfully', status: 200 };
  }
}
