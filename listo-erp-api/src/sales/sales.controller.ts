import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import {
  CurrentCompanyId,
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Company-Id', required: true })
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(
    @Body() dto: CreateSaleDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.salesService.create(dto, companyId, user.id);
  }
}
