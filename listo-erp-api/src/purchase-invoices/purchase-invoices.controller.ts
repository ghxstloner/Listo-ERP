import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Res,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  CurrentCompanyId,
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { PurchaseInvoicesService } from './purchase-invoices.service';
import type { Response } from 'express';

@ApiTags('purchase-invoices')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Company-Id', required: true })
@Controller('purchase-invoices')
export class PurchaseInvoicesController {
  constructor(private readonly purchaseInvoices: PurchaseInvoicesService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(
    @Body() dto: CreatePurchaseInvoiceDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.purchaseInvoices.create(dto, companyId, user.id);
  }

  @Get()
  findAll(@CurrentCompanyId() companyId: number) {
    return this.purchaseInvoices.findAll(companyId);
  }

  @Get('products/:productId')
  @ApiQuery({ name: 'warehouseId', required: false, type: Number })
  @ApiQuery({ name: 'supplierId', required: false, type: Number })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  findProductInvoices(
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentCompanyId() companyId: number,
    @Query('warehouseId', new ParseIntPipe({ optional: true }))
    warehouseId?: number,
    @Query('supplierId', new ParseIntPipe({ optional: true }))
    supplierId?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.purchaseInvoices.findProductInvoices(companyId, productId, {
      warehouseId,
      supplierId,
      dateFrom,
      dateTo,
    });
  }

  @Get(':id/receipt')
  async downloadReceipt(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @Res() response: Response,
  ) {
    const receipt = await this.purchaseInvoices.downloadReceipt(id, companyId);
    response.setHeader('Content-Type', receipt.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${receipt.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}"`,
    );
    response.send(receipt.content);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.purchaseInvoices.findOne(id, companyId);
  }
}
