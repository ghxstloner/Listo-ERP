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
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentCompanyId,
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SkipCompanyCheck } from '../common/decorators/skip-company-check.decorator';
import { CompaniesUsersService } from './companies.users.service';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { UpdateCompanyUserDto } from './dto/update-company-user.dto';

@ApiTags('companies-users')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Company-Id',
  description: 'ID de la empresa activa',
  required: true,
})
@Controller('companies-users')
export class CompaniesUsersController {
  constructor(private readonly companiesUsersService: CompaniesUsersService) {}

  @Post()
  @RequirePermissions('administration.general')
  @ApiOperation({ summary: 'Agregar un usuario a una empresa' })
  async create(
    @Body() createCompanyUserDto: CreateCompanyUserDto,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.companiesUsersService.create({
      ...createCompanyUserDto,
      companyId,
    });
  }

  @Get('my-companies')
  @SkipCompanyCheck()
  @ApiOperation({ summary: 'Obtener todas las empresas del usuario actual' })
  async findMyCompanies(@CurrentUser() user: CurrentUserPayload) {
    return this.companiesUsersService.findAllByUserId(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario de una empresa' })
  async findOne(@Param('id', ParseIntPipe) id: number, @CurrentCompanyId() companyId: number) {
    return this.companiesUsersService.findOne(id, companyId);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Obtener todos los usuarios de una empresa' })
  async findAllByCompanyId(
    @Param('companyId', ParseIntPipe) companyId: number,
    @CurrentCompanyId() currentCompanyId: number,
  ) {
    return this.companiesUsersService.findAllByCompanyId(
      companyId === currentCompanyId ? companyId : currentCompanyId,
    );
  }

  @Patch(':id')
  @RequirePermissions('administration.general')
  @ApiOperation({
    summary: 'Actualizar los roles personalizados de un usuario en la empresa',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompanyUserDto: UpdateCompanyUserDto,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.companiesUsersService.update(id, companyId, updateCompanyUserDto);
  }

  @Delete(':id')
  @RequirePermissions('administration.general')
  @ApiOperation({ summary: 'Eliminar un usuario de una empresa' })
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentCompanyId() companyId: number) {
    return this.companiesUsersService.delete(id, companyId);
  }
}
