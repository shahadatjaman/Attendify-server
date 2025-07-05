import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Request,
  UseGuards,
  InternalServerErrorException,
  Put,
} from '@nestjs/common';

import { User } from './schemas/user.schema';
import { UserService } from './users.service';
import { UpdateUserDto, UserDto } from './dto/user.dto';
import { Roles } from 'src/auth/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator', 'superadmin', 'employee')
  async create(@Request() req: any, @Body() dto: UserDto) {
    try {
      const avatarPath = req.file ? req.file.path : undefined;

      const user = await this.userService.createUser({ ...dto, avatarPath });

      if (!user) {
        return null;
      }

      return user;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator', 'superadmin', 'employee')
  async findAll() {
    return await this.userService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'moderator', 'superadmin', 'employee')
  findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @Put(':id')
  @Roles('admin', 'moderator', 'superadmin', 'employee')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    const avatarPath = req.file ? req.file.path : undefined;
    const user = await this.userService.updateUser(id, dto, avatarPath);

    return { status: 200, data: user };
  }

  @Delete(':id')
  @Roles('admin', 'moderator', 'superadmin', 'employee')
  remove(@Param('id') id: string): Promise<void> {
    return this.userService.deleteUser(id);
  }
}
