import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  CurrentCompanyId,
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SkipCompanyCheck } from '../common/decorators/skip-company-check.decorator';
import {
  getMulterOptions,
  MulterUploadFile,
  toRelativePath,
} from '../upload/upload.config';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateHierarchyConfigDto } from './dto/update-hierarchy-config.dto';

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @SkipCompanyCheck()
  @ApiOperation({ summary: 'Crear una nueva empresa' })
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.companiesService.create(createCompanyDto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener información de la empresa' })
  @ApiHeader({
    name: 'X-Company-Id',
    description: 'ID de la empresa activa',
    required: true,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    if (id !== companyId) {
      throw new ForbiddenException('No tienes permiso para ver esta empresa');
    }
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Actualizar información de la empresa (solo ADMIN)',
  })
  @ApiHeader({
    name: 'X-Company-Id',
    description: 'ID de la empresa activa',
    required: true,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (id !== companyId) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar esta empresa',
      );
    }
    return this.companiesService.update(id, updateCompanyDto, user.id);
  }

  @Post(':id/logo')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', getMulterOptions('companies')))
  @ApiOperation({ summary: 'Subir logo de la empresa' })
  @ApiHeader({
    name: 'X-Company-Id',
    description: 'ID de la empresa activa',
    required: true,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async uploadLogo(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @UploadedFile() file: MulterUploadFile | undefined,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (id !== companyId) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar esta empresa',
      );
    }
    if (!file?.filename) {
      throw new BadRequestException('Debe enviar un archivo de imagen');
    }
    const relativePath = toRelativePath('companies', file.filename);
    return this.companiesService.updateLogo(id, relativePath, user.id);
  }

  @Get(':id/hierarchy-config')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obtener configuración de nombres de jerarquía' })
  @ApiHeader({
    name: 'X-Company-Id',
    description: 'ID de la empresa activa',
    required: true,
  })
  async getHierarchyConfig(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    if (id !== companyId) {
      throw new ForbiddenException(
        'No tienes permiso para ver esta configuración',
      );
    }
    return this.companiesService.getHierarchyConfig(id);
  }

  @Patch(':id/hierarchy-config')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar nombres de la jerarquía de la empresa' })
  @ApiHeader({
    name: 'X-Company-Id',
    description: 'ID de la empresa activa',
    required: true,
  })
  async updateHierarchyConfig(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHierarchyConfigDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (id !== companyId) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar esta configuración',
      );
    }
    return this.companiesService.updateHierarchyConfig(id, dto, user.id);
  }
}
