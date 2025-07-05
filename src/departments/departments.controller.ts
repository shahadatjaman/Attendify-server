import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  InternalServerErrorException,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  CreateDepartmentDto,
  DeleteManyDepartmentsDto,
  UpdateDepartmentDto,
} from './dto/department.dto';
import { ObjectId, Types } from 'mongoose';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentController {
  constructor(private readonly deptService: DepartmentsService) {}

  @Post()
  @Roles('admin', 'superadmin')
  create(@Body() body: CreateDepartmentDto, @Req() req: any) {
    return this.deptService.create(body);
  }

  @Get()
  @Roles('admin', 'moderator', 'superadmin')
  findAll() {
    return this.deptService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'moderator', 'superadmin')
  findOne(@Param('id') id: ObjectId) {
    return this.deptService.findById(id);
  }

  @Put(':id')
  @Roles('admin', 'superadmin')
  update(@Param('id') id: string, @Body() body: UpdateDepartmentDto) {
    try {
      return this.deptService.update(id, body);
    } catch (error) {
      throw new InternalServerErrorException('There was an server error');
    }
  }

  @Delete('bulk-delete')
  @Roles('admin', 'superadmin')
  async deleteManyDepartments(@Body() body: DeleteManyDepartmentsDto) {
    const result = await this.deptService.deleteManyDepartments(body.ids);
    return { ...result, status: 200 };
  }

  @Delete(':id')
  @Roles('admin', 'superadmin')
  delete(@Param('id') id: string) {
    return this.deptService.delete(id);
  }
}
