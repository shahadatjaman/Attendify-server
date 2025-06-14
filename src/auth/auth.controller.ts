import { Controller, Post, Body, Request, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
}
