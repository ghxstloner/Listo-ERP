import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
import {
  getMulterOptions,
  MulterUploadFile,
  toRelativePath,
} from '../upload/upload.config';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodsService } from './payment-methods.service';

@ApiTags('payment-methods')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Company-Id',
  description: 'ID de la empresa activa',
  required: true,
})
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear nuevo método de pago' })
  async create(
    @Body() createPaymentMethodDto: CreatePaymentMethodDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.paymentMethodsService.create(
      createPaymentMethodDto,
      companyId,
      user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los métodos de pago de la empresa' })
  findAll(@CurrentCompanyId() companyId: number) {
    return this.paymentMethodsService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un método de pago por ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.paymentMethodsService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un método de pago' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentMethodDto: UpdatePaymentMethodDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.paymentMethodsService.update(
      id,
      updatePaymentMethodDto,
      companyId,
      user.id,
    );
  }

  @Post(':id/image')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', getMulterOptions('payment-methods')))
  @ApiOperation({ summary: 'Subir imagen del método de pago' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @UploadedFile() file: MulterUploadFile | undefined,
  ) {
    if (!file?.filename) {
      throw new BadRequestException('Debe enviar un archivo de imagen');
    }
    return this.paymentMethodsService.updateImage(
      id,
      companyId,
      toRelativePath('payment-methods', file.filename),
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar un método de pago' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.paymentMethodsService.remove(id, companyId, user.id);
  }
}
