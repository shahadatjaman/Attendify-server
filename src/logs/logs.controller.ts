import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { LogsService } from './logs.service';
import { Roles } from 'src/auth/roles.decorator';
import { CreateLogDto } from './dto/create-log.dto';
import { NewLog } from './schemas/new-log.schema';

@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogsController {
  constructor(private logService: LogsService) {}

  @Post('')
  @Roles('admin', 'moderator', 'superadmin')
  async createLog(@Body() createLogDto: CreateLogDto) {
    try {
      return await this.logService.create(createLogDto);
    } catch (error) {
      return error;
    }
  }

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
