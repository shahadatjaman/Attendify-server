import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { CloudinaryService } from 'src/shared/cloudinary.service';
import { generateUserId } from 'src/utils/generate-user-id';
import { CustomLogger } from 'src/logger/custom-logger.service';
import { EmailService } from 'src/email/email.service';
import { UserDevice } from 'src/users/schemas/user-device.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserDevice.name) private userDeviceModel: Model<UserDevice>,
    private cloudinary: CloudinaryService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private readonly logger: CustomLogger,
  ) {
    // this.userModel.deleteMany({});
  }

  generateTokens(payload: any) {
    const access_token = this.jwtService.sign(payload, {
      secret: 'secretKey',
      expiresIn: '15m',
    });

    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d',
    });

    return { access_token, refresh_token };
  }

  generateVerificationToken(_id: any): string {
    return this.jwtService.sign({ _id }, { secret: process.env.JWT_SECRET, expiresIn: '1d' });
  }

  async generateResetToken(userId: string): Promise<string> {
    return this.jwtService.sign(
      { userId },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      },
    );
  }

  async validateUser(email: string, pass: string): Promise<any> {
    try {
      const user = await this.userModel.findOne({ email, isVerified: true });

      if (!user) return null;

      const isMatch = await bcrypt.compare(pass, user?.password);

      if (user && isMatch) {
        const { password, ...result } = user.toObject();

        return result;
      } else {
        return null;
      }
    } catch (error) {
      console.log('error', error);
    }
  }

  async getUserByEmail(value: string) {
    try {
      const user = await this.userModel.findOne({
        email: value,
        // isVerified: true,
      });

      if (user) {
        const { _id, email, roles } = user;
        return { _id, email, roles };
      } else {
        return null;
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  async getUserByUserId(value: string) {
    try {
      const user: any = await this.userModel.findById(value);

      const { password, ...result } = user.toObject();

      return result;
    } catch (error) {
      throw new Error(error);
    }
  }

  async login(user: any) {
    const payload = {
      username: user.userId,
      sub: user._id,
      name: `${user.firstname} ${user.lastname}`,
      avatar: user.avatar,
      email: user.email,
      roles: user.roles,
    };
    return this.generateTokens(payload);
  }

  async register(userDto: RegisterDto, file?: any) {
    try {
      this.logger.log('Attempting to register user...', 'AuthService');

      // 1. Check for existing email
      const existingUser = await this.userModel.findOne({ email: userDto.email });

      if (existingUser) {
        this.logger.warn(`Email already exists: ${userDto.email}`, 'AuthService');
        throw new ConflictException('Email is already registered');
      }

      // await this.userModel.deleteMany({});

      // 2. Hash password
      const hashedPassword = await bcrypt.hash(userDto.password, 10);

      // 3. Generate unique 4-char userId
      let userId: string;
      let exists: boolean;
      do {
        userId = generateUserId();
        exists = !!(await this.userModel.exists({ userId }));
      } while (exists);
      this.logger.debug(`Generated userId: ${userId}`, 'AuthService');

      // 4. Upload avatar (if any)
      const avatarUrl = file ? await this.cloudinary.uploadImage(file) : null;

      // 5. Create and save user
      const createdUser = new this.userModel({
        ...userDto,
        userId,
        password: hashedPassword,
        avatar: avatarUrl,
        roles: ['superadmin'],
      });

      const savedUser = await createdUser.save();
      this.logger.log(`User registered: ${savedUser.email}`, 'AuthService');

      // 6. Return sanitized response
      const { password, ...userWithoutPassword } = savedUser.toObject();
      const verificationToken = this.generateVerificationToken(savedUser._id);

      await this.emailService.sendVerificationEmail(userDto.email, verificationToken);
      return {
        message: 'User registered successfully',
        data: userWithoutPassword,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  validateToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      return {
        statusCode: 200,
        message: 'Token is valid',
        data: decoded,
      };
    } catch (error) {
      return {
        statusCode: 401,
        message: 'Invalid or expired token',
        error: error.message,
      };
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, { secret: process.env.JWT_SECRET });
      const newAccessToken = this.jwtService.sign(
        { username: payload.username, sub: payload.sub, roles: payload.roles },
        { secret: process.env.JWT_SECRET, expiresIn: '15m' },
      );
      return { access_token: newAccessToken };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async isValidCookie(token: string) {
    try {
      console.log('token', token);
      const verify = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });

      // console.log('verify', verify);
      return verify;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Decode the token to get its data even if it is expired
        const decoded = this.jwtService.decode(token);
        return decoded;
      } else {
        return null;
      }
    }
  }

  async verifyEmailToken(token: string): Promise<any> {
    try {
      const isValidToken: any = await this.isValidCookie(token);

      if (!isValidToken) return;

      const user = await this.userModel.findById(isValidToken._id);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user) return;

      await this.markEmailAsVerified(user._id);

      return true;
    } catch (err) {
      console.log('err', err);
      throw new UnauthorizedException('Token invalid or expired');
    }
  }

  async sendResetEmail(email: string, token: string) {
    await this.emailService.sendResetEmail(email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    let payload: any;

    try {
      payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch (err) {
      throw new NotFoundException('Invalid or expired token');
    }

    const user = await this.userModel.findById(payload.userId);
    if (!user) throw new NotFoundException('Invalid token');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.updatePassword(user.id, hashedPassword);

    return { message: 'Password has been reset successfully' };
  }

  async updatePassword(userId: string, hashedPassword: string) {
    return this.userModel.findByIdAndUpdate(userId, { password: hashedPassword });
  }

  async updateOldPassword(userId: string, oldPassword: string, newPassword: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return { message: 'Password updated successfully', status: 200 };
  }

  async updatePasswordWithoutOld(userId: string, newPassword: string): Promise<any> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.userModel.findByIdAndUpdate(
        user._id,
        {
          password: hashedPassword,
        },
        { new: true },
      );

      return { message: 'Password updated successfully', status: 200 };
    } catch (error) {
      console.log('error', error);
      throw new InternalServerErrorException('Error occured to update password');
    }
  }

  async markEmailAsVerified(id: any) {
    return await this.userModel.findByIdAndUpdate(id, { isVerified: true });
  }

  async log(userId: string, ip: string, ua: string, loc: string) {
    const existing = await this.userDeviceModel.findOne({ userId, ipAddress: ip, userAgent: ua });
    if (existing) {
      existing.lastActive = new Date();
      return existing.save();
    }
    return this.userDeviceModel.create({ userId, ipAddress: ip, userAgent: ua, location: loc });
  }

  async getAll(userId: string) {
    return this.userDeviceModel.find({ userId }).sort({ lastActive: -1 });
  }
}
