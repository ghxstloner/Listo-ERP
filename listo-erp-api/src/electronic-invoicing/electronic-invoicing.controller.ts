import { Body, Controller, Get, Param, Put, Res } from '@nestjs/common';

import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import {
  CurrentCompanyId,
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { UpdateColombiaConfigurationDto } from './dto/update-colombia-configuration.dto';
import { ElectronicInvoicingService } from './electronic-invoicing.service';
import type { Response } from 'express';

@ApiTags('electronic-invoicing')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Company-Id', required: true })
@Controller('electronic-invoicing')
export class ElectronicInvoicingController {
  constructor(
    private readonly electronicInvoicing: ElectronicInvoicingService,
  ) { }

  @Get('configuration/colombia')
  @RequirePermissions('administration.electronic-invoicing')
  getColombiaConfiguration(@CurrentCompanyId() companyId: number) {
    return this.electronicInvoicing.getColombiaConfiguration(companyId);
  }

  @Put('configuration/colombia')
  @RequirePermissions('administration.electronic-invoicing')
  updateColombiaConfiguration(
    @Body() dto: UpdateColombiaConfigurationDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.electronicInvoicing.updateColombiaConfiguration(
      companyId,
      user.id,
      dto,
    );
  }

  @Get('sales/:saleId/invoice')
  getInvoiceForSale(
    @Param('saleId') saleId: string,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.electronicInvoicing.getInvoiceForSale(
      companyId,
      Number(saleId),
    );
  }

  @Get('sales/:saleId/invoice/receipt')
  async downloadReceipt(
    @Param('saleId') saleId: string,
    @CurrentCompanyId() companyId: number,
    @Res() response: Response,
  ) {
    const artifact = await this.electronicInvoicing.downloadReceipt(
      companyId,
      Number(saleId),
    );
    response.setHeader('Content-Type', artifact.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${artifact.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}"`,
    );
    response.send(artifact.content);
  }
}
