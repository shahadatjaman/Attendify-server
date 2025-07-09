import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { UserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { CloudinaryService } from 'src/shared/cloudinary.service';
import { generateUserId } from 'src/utils/generate-user-id';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private cloudinary: CloudinaryService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createUser(dto: UserDto) {
    try {
      const defaultEmail = dto.email || `${dto.firstname.toLowerCase()}_${Date.now()}@gmail.com`;
      const placeholderPhone =
        `+8801${Math.floor(100000000 + Math.random() * 900000000)}` || dto.phone;

      const existingUser = await this.userModel.findOne({ email: defaultEmail });

      if (existingUser) {
        throw new ConflictException('Email is already registered');
      }

      const defaultPassword = dto.firstname;

      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const avatarUrl = dto.avatarPath ? await this.cloudinary.uploadImage(dto.avatarPath) : null;

      let userId: string;
      let exists: boolean;
      do {
        userId = generateUserId();
        exists = !!(await this.userModel.exists({ userId }));
      } while (exists);

      const createdUser = new this.userModel({
        ...dto,
        userId,
        password: hashedPassword,
        email: defaultEmail,
        avatar: avatarUrl,
        phone: placeholderPhone,
      });
      const savedUser = await createdUser.save();

      const { password, ...userWithoutPassword } = savedUser.toObject();

      this.eventEmitter.emit('dept.updated', {
        deptId: dto.dept,
        employeeId: userWithoutPassword._id,
      });

      this.eventEmitter.emit('device.add_userId', {
        userId: userWithoutPassword._id,
      });
      this.eventEmitter.emit('shift.add_userId', {
        userId: userWithoutPassword._id,
      });

      return {
        message: 'User createds successfully',
        status: 200,
        data: userWithoutPassword,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(): Promise<Partial<User>[]> {
    const users = await this.userModel
      .find({ roles: 'employee' })
      .lean()
      .populate({ path: 'dept', select: 'deptName status' });

    return users.map(({ password, ...rest }) => rest);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByUserId(id: string): Promise<User> {
    const user = await this.userModel.findOne({ userId: id });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(id: string, dto: Partial<UserDto>, avatarFile: any): Promise<any> {
    const avatarUrl = avatarFile ? await this.cloudinary.uploadImage(avatarFile) : dto.avatar;

    const payload = {
      ...dto,
      avatar: avatarUrl,
    };

    const user = await this.userModel.findByIdAndUpdate(id, payload, { new: true });
    if (!user) throw new NotFoundException('User not found');

    const { password, isVerified, ...userWithoutPassword } = user.toObject();

    if (dto.dept) {
      this.eventEmitter.emit('dept.updated', {
        deptName: dto.dept,
        employeeId: userWithoutPassword._id,
      });
    }

    return userWithoutPassword;
  }

  async deleteUser(id: string): Promise<any> {
    const res = await this.userModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('User not found');

    this.eventEmitter.emit('dept.employee_removed', {
      employeeId: id,
    });

    this.eventEmitter.emit('device.user_removed', {
      employeeId: id,
    });

    this.eventEmitter.emit('shift.user_removed', {
      employeeId: id,
    });

    return {
      status: 200,
      data: res,
    };
  }
}
