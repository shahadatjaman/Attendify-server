import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Req,
  Res,
  Get,
  Query,
  BadRequestException,
  NotFoundException,
  Patch,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './local-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/users/schemas/user.schema';
import { Model } from 'mongoose';
import { ResetPassDto } from './dto/resetPass.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TokenValidatorDto } from './dto/token-validator.dto';
import { Response } from 'express';
import geoip from 'geoip-lite';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Req() req, @Res({ passthrough: true }) res: Response) {
    try {
      const tokens = await this.authService.login(req.user);

      res.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      return { message: 'Login successful', accessToken: tokens.access_token };
    } catch (error) {
      console.log('error', error);
      throw new InternalServerErrorException('Error occured to login');
    }
  }

  @Post('register')
  async register(@Request() req: any, @Body() body: RegisterDto) {
    const avatarPath = req.file ? req.file.path : undefined;

    return this.authService.register(body, avatarPath);
  }

  @Get('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const refreshToken = req.cookies['refresh_token'];

    const newAccessToken = await this.authService.refreshToken(refreshToken);

    res.cookie('jwt', newAccessToken.access_token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { message: 'Access token refreshed', accessToken: newAccessToken.access_token };
  }

  @Get('verify')
  async verifyEmail(@Query('token') token: string, @Res() res: any) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    try {
      const isToken: any = await this.authService.verifyEmailToken(token);
      if (!isToken) {
        return res.status(400).json({
          message: 'Invalid or expired token.',
          status: 400,
        });
      }

      return res.status(200).json({
        message: '✅ Email verified successfully!',
        status: 200,
      });
    } catch (err) {
      return res.status(400).json({
        message: 'Invalid or expired token.',
        status: 400,
      });
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: ResetPassDto) {
    const user = await this.userModel.findOne({ email: body.email });
    if (!user) throw new NotFoundException('User not found');

    const token = await this.authService.generateResetToken(user.id);
    await this.authService.sendResetEmail(user.email, token);

    return { message: 'Password reset link sent to your email', status: 200 };
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    const { token, newPassword } = body;

    return this.authService.resetPassword(token, newPassword);
  }

  @Post('token-validator')
  async tokenValidation(@Body() body: TokenValidatorDto, @Res({ passthrough: true }) res: any) {
    const { token } = body;

    try {
      const tokenValidity = this.authService.validateToken(token);

      if (tokenValidity.statusCode === 200) {
        const user = await this.authService.getUserByUserId(tokenValidity.data.userId);

        const tokens = await this.authService.login(user);

        res.cookie('refresh_token', tokens.refresh_token, {
          httpOnly: true,
          sameSite: 'none',
          secure: true,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return tokenValidity;
      } else {
        return tokenValidity;
      }
    } catch (error) {
      console.log('error', error);
      throw new InternalServerErrorException('Error occured to validate token');
    }
  }

  @Patch('update-password')
  @Roles('admin', 'moderator', 'superadmin', 'employee')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updatePassword(
    @Body() dto: UpdatePasswordDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    const { userId } = req.user;

    try {
      const user = await this.authService.getUserByUserId(userId);

      const tokens = await this.authService.login(user);

      res.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      return this.authService.updatePasswordWithoutOld(userId, dto.newPassword);
    } catch (error) {
      console.log('error', error);
      throw new InternalServerErrorException('Error occured to update pass');
    }
  }

  @Post('logout')
  @Roles('admin', 'moderator', 'superadmin', 'employee')
  @UseGuards(JwtAuthGuard, RolesGuard)
  logout(@Res({ passthrough: true }) res: Response) {
    try {
      // Clear the refresh_token cookie
      res.clearCookie('refresh_token', {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      });

      return { message: 'Logged out successfully', status: 200 };
    } catch (error) {
      throw new InternalServerErrorException('Error occurred to logout');
    }
  }
}
