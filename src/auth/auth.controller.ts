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
} from '@nestjs/common';
import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './local-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/users/schemas/user.schema';
import { Model } from 'mongoose';
import { ResetPassDto } from './dto/resetPass.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Req() req, @Res({ passthrough: true }) res: any) {
    const tokens = await this.authService.login(req.user);
    res.cookie('jwt', tokens.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return { message: 'Login successful', accessToken: tokens.access_token };
  }

  @Post('register')
  async register(@Request() req: any, @Body() body: RegisterDto) {
    const avatarPath = req.file ? req.file.path : undefined;

    return this.authService.register(body, avatarPath);
  }

  @Post('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const refreshToken = req.cookies['refresh_token'];
    const newAccessToken = await this.authService.refreshToken(refreshToken);
    res.cookie('jwt', newAccessToken.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
    });
    return { message: 'Access token refreshed' };
  }

  @Get('verify')
  async verifyEmail(@Query('token') token: string, @Res() res: any) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    try {
      await this.authService.verifyEmailToken(token);
      return res.status(200).send('✅ Email verified successfully!');
    } catch (err) {
      console.log('err', err);
      return res.status(400).send('❌ Invalid or expired token.');
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: ResetPassDto) {
    const user = await this.userModel.findOne({ email: body.email });
    if (!user) throw new NotFoundException('User not found');

    const token = await this.authService.generateResetToken(user.id);
    await this.authService.sendResetEmail(user.email, token);

    return { message: 'Password reset link sent to your email' };
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    const { token, newPassword } = body;

    return this.authService.resetPassword(token, newPassword);
  }
}
