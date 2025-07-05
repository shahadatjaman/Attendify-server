import {
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { LogsService } from './logs.service';
import { Roles } from 'src/auth/roles.decorator';

@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogsController {
  constructor(private logService: LogsService) {}

  @Get('today')
  @Roles('admin', 'moderator', 'superadmin')
  async todayLogs() {
    try {
      const logs = await this.logService.getTodayLogs();
      const summary = await this.logService.getTodaySummary();
      return {
        status: 200,
        message: '',
        data: { logs, summary },
      };
    } catch (error) {
      throw new InternalServerErrorException('ERROR occurred to retrives tody logs');
    }
  }

  @Get()
  @Roles('admin', 'moderator', 'superadmin')
  async getAllLogs() {
    try {
      const logs = await this.logService.getLogs();

      return {
        status: 200,
        message: '',
        data: logs,
      };
    } catch (error) {
      throw new InternalServerErrorException('ERROR occurred to retrives logs');
    }
  }

  @Delete(':id')
  @Roles('admin', 'moderator', 'superadmin')
  async deleteOne(@Param('id') id: string) {
    try {
      return await this.logService.deleteOne(id);
    } catch (error) {
      throw new InternalServerErrorException('Error occured to delete log');
    }
  }
}
