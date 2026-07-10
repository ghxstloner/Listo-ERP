import { Injectable } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { PrismaService } from '../prisma/prisma.service';
import { AssignSellerUsersDto } from './dto/assign-seller-users.dto';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';

@Injectable()
export class SellersService {
  constructor(private prisma: PrismaService) {}

  async create(createSellerDto: CreateSellerDto, companyId: number) {
    const userIds = this.normalizeUserIds(createSellerDto.userIds);
    await this.validateCompanyUsers(userIds, companyId);

    const seller = await this.prisma.seller.create({
      data: {
        code: createSellerDto.code,
        name: createSellerDto.name,
        isActive: createSellerDto.isActive ?? true,
        companyId,
        sellerUsers: {
          create: userIds.map((userId) => ({ userId, companyId })),
        },
      },
      select: this.selectBase(),
    });

    return {
      message: 'sellers.success.created',
      data: seller,
    };
  }

  async findAll(companyId: number) {
    const sellers = await this.prisma.seller.findMany({
      where: { companyId },
      select: this.selectBase(),
      orderBy: { createdAt: 'desc' },
    });
    return sellers;
  }

  async findOne(id: number, companyId: number) {
    const seller = await this.prisma.seller.findFirst({
      where: { id, companyId },
      select: this.selectBase(),
    });
    if (!seller) {
      throw I18nException.notFound('sellers.errors.not_found');
    }
    return seller;
  }

  async update(
    id: number,
    updateSellerDto: UpdateSellerDto,
    companyId: number,
  ) {
    await this.findOne(id, companyId);

    const seller = await this.prisma.seller.update({
      where: { id },
      data: updateSellerDto,
      select: this.selectBase(),
    });

    return {
      message: 'sellers.success.updated',
      data: seller,
    };
  }

  async assignUsers(
    id: number,
    assignSellerUsersDto: AssignSellerUsersDto,
    companyId: number,
  ) {
    await this.findOne(id, companyId);
    const userIds = this.normalizeUserIds(assignSellerUsersDto.userIds);
    await this.validateCompanyUsers(userIds, companyId);

    const seller = await this.prisma.$transaction(async (tx) => {
      await tx.sellerUser.deleteMany({ where: { sellerId: id, companyId } });
      await tx.sellerUser.createMany({
        data: userIds.map((userId) => ({ sellerId: id, userId, companyId })),
      });
      return tx.seller.findFirst({
        where: { id, companyId },
        select: this.selectBase(),
      });
    });

    return {
      message: 'sellers.success.users_assigned',
      data: seller,
    };
  }

  async remove(id: number, companyId: number) {
    await this.findOne(id, companyId);
    await this.prisma.seller.delete({ where: { id } });
    return { message: 'sellers.success.deleted' };
  }

  private normalizeUserIds(userIds: number[]) {
    return [...new Set(userIds)].filter((userId) => Number.isInteger(userId));
  }

  private async validateCompanyUsers(userIds: number[], companyId: number) {
    if (userIds.length === 0) {
      throw I18nException.badRequest('sellers.errors.users_required');
    }

    const users = await this.prisma.companyUser.findMany({
      where: {
        companyId,
        userId: { in: userIds },
        user: { isActive: true },
      },
      select: { userId: true },
    });

    if (users.length !== userIds.length) {
      throw I18nException.badRequest('sellers.errors.invalid_users');
    }
  }

  private selectBase() {
    return {
      id: true,
      code: true,
      name: true,
      isActive: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
      sellerUsers: {
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
            },
          },
        },
      },
    };
  }
}
