import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';

import { CreateShiftDto, DeleteManyDepartmentsDto, UpdateShiftDto } from './dto/shift.dto';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { ShiftService } from './shifts.service';

@Controller('shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Post()
  @Roles('admin', 'superadmin')
  create(@Body() dto: CreateShiftDto) {
    return this.shiftService.create(dto);
  }

  @Get()
  @Roles('admin', 'superadmin')
  findAll() {
    return this.shiftService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'superadmin', 'moderator')
  findById(@Param('id') id: string) {
    return this.shiftService.findById(id);
  }

  @Put(':id')
  @Roles('admin', 'superadmin')
  update(@Param('id') id: string, @Body() dto: UpdateShiftDto) {
    return this.shiftService.update(id, dto);
  }

  @Delete('bulk-delete')
  @Roles('admin', 'superadmin')
  async deleteManyShifts(@Body() body: DeleteManyDepartmentsDto) {
    const result = await this.shiftService.deleteManyDepartments(body.ids);
    return { ...result, status: 200 };
  }

  @Delete(':id')
  @Roles('admin', 'superadmin')
  delete(@Param('id') id: string) {
    return this.shiftService.delete(id);
  }
}
