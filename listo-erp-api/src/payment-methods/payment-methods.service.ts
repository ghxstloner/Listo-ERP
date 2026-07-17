import { Injectable } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { isUniqueConstraintError } from '../common/utils/prisma-errors';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { removeUploadedFile } from '../upload/upload.config';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(
    createPaymentMethodDto: CreatePaymentMethodDto,
    companyId: number,
    userId: number,
  ) {
    const code = createPaymentMethodDto.code.trim().toUpperCase();
    if (code === '') {
      throw I18nException.badRequest('common.errors.code_empty');
    }
    const existing = await this.prisma.paymentMethod.findUnique({
      where: { companyId_code: { companyId, code } },
    });
    if (existing) {
      throw I18nException.badRequest('payment_methods.errors.code_exists');
    }
    try {
      const paymentMethod = await this.prisma.paymentMethod.create({
        data: {
          name: createPaymentMethodDto.name,
          code,
          requiresReference: createPaymentMethodDto.requiresReference ?? false,
          isActive: createPaymentMethodDto.isActive ?? true,
          companyId,
        },
        select: this.selectBase(),
      });

      await this.auditService.logCreate(
        userId,
        companyId,
        'payment-methods',
        'Método de Pago',
        paymentMethod.id,
      );

      return {
        message: 'payment_methods.success.created',
        data: paymentMethod,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('payment_methods.errors.code_exists');
      }
      throw e;
    }
  }

  async findAll(companyId: number) {
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: { companyId },
      select: this.selectBase(),
      orderBy: { createdAt: 'desc' },
    });
    return paymentMethods;
  }

  async findOne(id: number, companyId: number) {
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { id, companyId },
      select: this.selectBase(),
    });
    if (!paymentMethod) {
      throw I18nException.notFound('payment_methods.errors.not_found');
    }
    return paymentMethod;
  }

  async update(
    id: number,
    updatePaymentMethodDto: UpdatePaymentMethodDto,
    companyId: number,
    userId: number,
  ) {
    await this.findOne(id, companyId);
    const data: UpdatePaymentMethodDto = { ...updatePaymentMethodDto };
    if (updatePaymentMethodDto.code != null) {
      const code = updatePaymentMethodDto.code.trim().toUpperCase();
      if (code === '') {
        throw I18nException.badRequest('common.errors.code_empty');
      }
      const existing = await this.prisma.paymentMethod.findFirst({
        where: {
          companyId,
          code,
          id: { not: id },
        },
      });
      if (existing) {
        throw I18nException.badRequest('payment_methods.errors.code_exists');
      }
      data.code = code;
    }
    try {
      const paymentMethod = await this.prisma.paymentMethod.update({
        where: { id },
        data,
        select: this.selectBase(),
      });

      await this.auditService.logUpdate(
        userId,
        companyId,
        'payment-methods',
        'Método de Pago',
        paymentMethod.id,
      );

      return {
        message: 'payment_methods.success.updated',
        data: paymentMethod,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('payment_methods.errors.code_exists');
      }
      throw e;
    }
  }

  async remove(id: number, companyId: number, userId: number) {
    const paymentMethod = await this.findOne(id, companyId);
    await this.prisma.paymentMethod.delete({ where: { id } });

    if (paymentMethod.image) {
      await removeUploadedFile('payment-methods', paymentMethod.image);
    }

    await this.auditService.logDelete(
      userId,
      companyId,
      'payment-methods',
      'Método de Pago',
      id,
    );

    return { message: 'payment_methods.success.deleted' };
  }

  async updateImage(id: number, companyId: number, relativePath: string) {
    const currentPaymentMethod = await this.findOne(id, companyId);
    const paymentMethod = await this.prisma.paymentMethod.update({
      where: { id },
      data: { image: relativePath },
      select: this.selectBase(),
    });

    if (
      currentPaymentMethod.image &&
      currentPaymentMethod.image !== relativePath
    ) {
      await removeUploadedFile('payment-methods', currentPaymentMethod.image);
    }

    return paymentMethod;
  }

  private selectBase() {
    return {
      id: true,
      name: true,
      code: true,
      requiresReference: true,
      image: true,
      isActive: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
    };
  }
}
