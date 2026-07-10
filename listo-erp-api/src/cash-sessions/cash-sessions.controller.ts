import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentCompanyId,
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { CashSessionsService } from './cash-sessions.service';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';
import { OpenCashSessionDto } from './dto/open-cash-session.dto';

@ApiTags('cash-sessions')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Company-Id',
  description: 'ID de la empresa activa',
  required: true,
})
@Controller('cash-sessions')
export class CashSessionsController {
  constructor(private readonly cashSessionsService: CashSessionsService) {}

  @Post('open')
  @ApiOperation({ summary: 'Abrir una caja operativa' })
  open(
    @Body() openCashSessionDto: OpenCashSessionDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.cashSessionsService.open(
      openCashSessionDto,
      companyId,
      user.id,
    );
  }

  @Get('current')
  @ApiOperation({ summary: 'Obtener la caja abierta del usuario actual' })
  current(
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.cashSessionsService.findCurrent(companyId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar aperturas y cierres de caja' })
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'CLOSED'] })
  @ApiQuery({ name: 'branchId', required: false, type: Number })
  @ApiQuery({ name: 'tillId', required: false, type: Number })
  findAll(
    @CurrentCompanyId() companyId: number,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
    @Query('tillId') tillId?: string,
  ) {
    return this.cashSessionsService.findAll(companyId, {
      status,
      branchId: this.parseOptionalInt(branchId),
      tillId: this.parseOptionalInt(tillId),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una sesión de caja por ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.cashSessionsService.findOne(id, companyId);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Cerrar una caja operativa' })
  close(
    @Param('id', ParseIntPipe) id: number,
    @Body() closeCashSessionDto: CloseCashSessionDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.cashSessionsService.close(
      id,
      closeCashSessionDto,
      companyId,
      user.id,
    );
  }

  private parseOptionalInt(value?: string) {
    if (value == null || value === '') return undefined;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
}
