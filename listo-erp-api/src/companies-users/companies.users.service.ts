import { Injectable } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { UpdateCompanyUserDto } from './dto/update-company-user.dto';

@Injectable()
export class CompaniesUsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: number) {
    const companyUser = await this.prisma.companyUser.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        companyId: true,
        role: true,
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
        role: true,
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
        role: true,
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

    const companyUser = await this.prisma.companyUser.create({
      data: {
        userId: createCompanyUserDto.userId,
        companyId: createCompanyUserDto.companyId,
        role: createCompanyUserDto.role || Role.USER,
      },
      select: {
        id: true,
        userId: true,
        companyId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return {
      message: 'companies_users.success.created',
      data: companyUser,
    };
  }

  async update(id: number, updateCompanyUserDto: UpdateCompanyUserDto) {
    const companyUser = await this.prisma.companyUser.update({
      where: { id },
      data: { role: updateCompanyUserDto.role },
      select: {
        id: true,
        userId: true,
        companyId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return {
      message: 'companies_users.success.updated',
      data: companyUser,
    };
  }

  async delete(id: number) {
    await this.prisma.companyUser.delete({
      where: { id },
    });
    return { message: 'users.success.removed_from_company' };
  }
}
