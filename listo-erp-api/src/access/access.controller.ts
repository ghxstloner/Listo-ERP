import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CurrentCompanyId } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AccessService } from './access.service';
import { CreateCompanyRoleDto } from './dto/create-company-role.dto';
import { UpdateCompanyRoleDto } from './dto/update-company-role.dto';

@ApiTags('access')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Company-Id', required: true })
@Controller('access')
@RequirePermissions('administration.general')
export class AccessController {
  constructor(private readonly access: AccessService) {}

  @Get('permissions')
  findPermissions() {
    return this.access.findPermissions();
  }

  @Get('roles')
  findRoles(@CurrentCompanyId() companyId: number) {
    return this.access.findRoles(companyId);
  }

  @Post('roles')
  createRole(
    @CurrentCompanyId() companyId: number,
    @Body() dto: CreateCompanyRoleDto,
  ) {
    return this.access.createRole(companyId, dto);
  }

  @Patch('roles/:id')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @Body() dto: UpdateCompanyRoleDto,
  ) {
    return this.access.updateRole(id, companyId, dto);
  }

  @Delete('roles/:id')
  deleteRole(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.access.deleteRole(id, companyId);
  }
}
