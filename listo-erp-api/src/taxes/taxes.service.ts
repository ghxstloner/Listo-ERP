import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, Prisma } from '@prisma/client';

@Injectable()
export class TaxesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private serializeTax<T extends { rate: Prisma.Decimal }>(tax: T) {
    return {
      ...tax,
      rate: Number(tax.rate),
    };
  }

  async create(createTaxDto: CreateTaxDto, companyId: number, userId: number) {
    const existing = await this.prisma.tax.findUnique({
      where: {
        companyId_name: {
          companyId,
          name: createTaxDto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Ya existe un impuesto con este nombre en la empresa');
    }

    const tax = await this.prisma.tax.create({
      data: {
        ...createTaxDto,
        companyId,
      },
    });

    await this.auditService.log({
      userId,
      companyId,
      action: AuditAction.CREATE,
      description: `Creó el impuesto: ${tax.name}`,
      section: 'TAXES',
    });

    return this.serializeTax(tax);
  }

  async findAll(companyId: number) {
    const taxes = await this.prisma.tax.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
    return taxes.map((tax) => this.serializeTax(tax));
  }

  async findOne(id: number, companyId: number) {
    const tax = await this.prisma.tax.findFirst({
      where: { id, companyId },
    });

    if (!tax) {
      throw new NotFoundException(`Impuesto con ID ${id} no encontrado`);
    }

    return this.serializeTax(tax);
  }

  async update(id: number, updateTaxDto: UpdateTaxDto, companyId: number, userId: number) {
    const tax = await this.prisma.tax.findFirst({
      where: { id, companyId },
    });

    if (!tax) {
      throw new NotFoundException(`Impuesto con ID ${id} no encontrado`);
    }

    if (updateTaxDto.name && updateTaxDto.name !== tax.name) {
      const existing = await this.prisma.tax.findUnique({
        where: {
          companyId_name: {
            companyId,
            name: updateTaxDto.name,
          },
        },
      });

      if (existing) {
        throw new ConflictException('Ya existe un impuesto con este nombre en la empresa');
      }
    }

    const updated = await this.prisma.tax.update({
      where: { id },
      data: updateTaxDto,
    });

    await this.auditService.log({
      userId,
      companyId,
      action: AuditAction.UPDATE,
      description: `Actualizó el impuesto: ${updated.name}`,
      section: 'TAXES',
    });

    return this.serializeTax(updated);
  }

  async remove(id: number, companyId: number, userId: number) {
    const tax = await this.prisma.tax.findFirst({
      where: { id, companyId },
    });

    if (!tax) {
      throw new NotFoundException(`Impuesto con ID ${id} no encontrado`);
    }

    const productCount = await this.prisma.product.count({
      where: { taxId: id, companyId },
    });

    if (productCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar el impuesto porque está asignado a uno o más productos. Desactívelo en su lugar.',
      );
    }

    await this.prisma.tax.delete({
      where: { id },
    });

    await this.auditService.log({
      userId,
      companyId,
      action: AuditAction.DELETE,
      description: `Eliminó el impuesto: ${tax.name}`,
      section: 'TAXES',
    });

    return { success: true };
  }
}
