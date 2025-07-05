import { Controller, Get, InternalServerErrorException, UseGuards } from '@nestjs/common';
import { ZktecoService } from './zkteco.service';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('zkteco')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ZktecoController {
  constructor(private zktecoService: ZktecoService) {}

  @Get('databse-stats')
  @Roles('admin', 'moderator', 'superadmin')
  async getDatabaseStats() {
    try {
      return this.zktecoService.getDatabaseStats();
    } catch (error) {
      throw new InternalServerErrorException('Error occured to retrives database stats');
    }
  }
}
