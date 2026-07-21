import { Injectable } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { UpdateCompanyUserDto } from './dto/update-company-user.dto';

@Injectable()
export class CompaniesUsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: number, companyId: number) {
    const companyUser = await this.prisma.companyUser.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        userId: true,
        companyId: true,
        roles: { select: { role: { select: { id: true, name: true } } } },
        createdAt: true,
        updatedAt: true,
      },
    });
    return companyUser;
  }

  async findAllByUserId(userId: number) {
    const companyUsers = await this.prisma.companyUser.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        companyId: true,
        roles: { select: { role: { select: { id: true, name: true } } } },
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
            primaryColor: true,
            secondaryColor: true,
            isActive: true,
          },
        },
      },
    });
    return companyUsers.filter((cu) => cu.company.isActive);
  }

  async findAllByCompanyId(companyId: number) {
    const companyUsers = await this.prisma.companyUser.findMany({
      where: { companyId },
      select: {
        id: true,
        userId: true,
        companyId: true,
        roles: { select: { role: { select: { id: true, name: true } } } },
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });
    return companyUsers;
  }

  async create(
    createCompanyUserDto: CreateCompanyUserDto & { companyId: number },
  ) {
    const existing = await this.prisma.companyUser.findUnique({
      where: {
        companyId_userId: {
          companyId: createCompanyUserDto.companyId,
          userId: createCompanyUserDto.userId,
        },
      },
    });

    if (existing) {
      throw I18nException.badRequest('common.errors.already_exists', {
        entity: 'user in company',
      });
    }

    const roleIds = await this.validRoleIds(
      createCompanyUserDto.roleIds ?? [],
      createCompanyUserDto.companyId,
    );
    const companyUser = await this.prisma.companyUser.create({
      data: {
        userId: createCompanyUserDto.userId,
        companyId: createCompanyUserDto.companyId,
        roles: { create: roleIds.map((roleId) => ({ roleId })) },
      },
      select: {
        id: true,
        userId: true,
        companyId: true,
        roles: { select: { role: { select: { id: true, name: true } } } },
        createdAt: true,
        updatedAt: true,
      },
    });
    return {
      message: 'companies_users.success.created',
      data: companyUser,
    };
  }

  async update(
    id: number,
    companyId: number,
    updateCompanyUserDto: UpdateCompanyUserDto,
  ) {
    const membership = await this.prisma.companyUser.findFirst({
      where: { id, companyId },
      select: { id: true },
    });
    if (!membership) {
      throw I18nException.notFound('common.errors.not_found', {
        entity: 'user in company',
      });
    }
    const roleIds = await this.validRoleIds(
      updateCompanyUserDto.roleIds,
      companyId,
    );
    const companyUser = await this.prisma.companyUser.update({
      where: { id },
      data: {
        roles: {
          deleteMany: {},
          create: roleIds.map((roleId) => ({ roleId })),
        },
      },
      select: {
        id: true,
        userId: true,
        companyId: true,
        roles: { select: { role: { select: { id: true, name: true } } } },
        createdAt: true,
        updatedAt: true,
      },
    });
    return {
      message: 'companies_users.success.updated',
      data: companyUser,
    };
  }

  async delete(id: number, companyId: number) {
    const result = await this.prisma.companyUser.deleteMany({
      where: { id, companyId },
    });
    if (result.count === 0) {
      throw I18nException.notFound('common.errors.not_found', {
        entity: 'user in company',
      });
    }
    return { message: 'users.success.removed_from_company' };
  }

  private async validRoleIds(roleIds: number[], companyId: number) {
    const roles = await this.prisma.companyRole.findMany({
      where: { id: { in: roleIds }, companyId },
      select: { id: true },
    });
    if (roles.length !== roleIds.length) {
      throw I18nException.badRequest('common.errors.invalid_id');
    }
    return roles.map(({ id }) => id);
  }
}
