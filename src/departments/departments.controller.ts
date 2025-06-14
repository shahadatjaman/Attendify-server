import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/create-department.dto';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentController {
  constructor(private readonly deptService: DepartmentsService) {}

  @Post()
  @Roles('admin', 'superadmin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() body: CreateDepartmentDto, @Req() req: any) {
    const user = req.user;
    return this.deptService.create(body);
  }

  @Get()
  @Roles('admin', 'moderator', 'superadmin')
  findAll() {
    return this.deptService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'moderator', 'superadmin')
  findOne(@Param('id') id: string) {
    return this.deptService.findById(id);
  }

  @Put(':id')
  @Roles('admin', 'superadmin')
  update(@Param('id') id: string, @Body() body: UpdateDepartmentDto) {
    return this.deptService.update(id, body);
  }

  @Delete(':id')
  @Roles('admin', 'superadmin')
  delete(@Param('id') id: string) {
    return this.deptService.delete(id);
  }
}
