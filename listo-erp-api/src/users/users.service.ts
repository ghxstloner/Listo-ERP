import { AuditService } from '../audit/audit.service';
import { Injectable } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import * as bcrypt from 'bcrypt';
import { customAlphabet } from 'nanoid';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly generateUserCode = customAlphabet(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    6,
  );

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private async generateUniqueUserCode(): Promise<string> {
    let code: string = '';

    while (true) {
      code = this.generateUserCode();
      const existing = await this.prisma.user.findUnique({
        where: { userCode: code },
      });
      if (!existing) {
        break;
      }
    }

    return code;
  }

  async userBelongsToCompany(userId: number, companyId: number) {
    const companyUser = await this.prisma.companyUser.findUnique({
      where: {
        companyId_userId: { companyId, userId },
      },
    });
    return !!companyUser;
  }

  async create(createUserDto: CreateUserDto, companyId: number) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: createUserDto.email }, { name: createUserDto.name }],
      },
    });

    if (existingUser) {
      throw I18nException.badRequest(
        existingUser.email === createUserDto.email
          ? 'users.errors.email_already_registered'
          : 'users.errors.name_already_registered',
      );
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const userCode = await this.generateUniqueUserCode();

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: createUserDto.email,
          password: hashedPassword,
          name: createUserDto.name,
          userCode,
        },
        select: {
          id: true,
          email: true,
          name: true,
          userCode: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const roleIds = await this.validRoleIds(
        createUserDto.roleIds ?? [],
        companyId,
      );
      const companyUser = await tx.companyUser.create({
        data: {
          userId: user.id,
          companyId,
          roles: { create: roleIds.map((roleId) => ({ roleId })) },
        },
        select: {
          roles: { select: { role: { select: { id: true, name: true } } } },
        },
      });

      return { ...user, roles: companyUser.roles.map(({ role }) => role) };
    });

    return {
      message: 'users.success.created',
      data: result,
    };
  }

  async findAll(companyId: number) {
    const companyUsers = await this.prisma.companyUser.findMany({
      where: { companyId },
      include: {
        roles: { select: { role: { select: { id: true, name: true } } } },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            userCode: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return companyUsers.map((cu) => ({
      ...cu.user,
      roles: cu.roles.map(({ role }) => role),
    }));
  }

  async findOne(id: number, companyId: number) {
    const companyUser = await this.prisma.companyUser.findUnique({
      where: {
        companyId_userId: { companyId, userId: id },
      },
      include: {
        roles: { select: { role: { select: { id: true, name: true } } } },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            userCode: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!companyUser) {
      throw I18nException.notFound('users.errors.not_found_in_company');
    }

    return {
      ...companyUser.user,
      roles: companyUser.roles.map(({ role }) => role),
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto, companyId: number) {
    const userInfo = await this.findOne(id, companyId);

    if (updateUserDto.email && updateUserDto.email !== userInfo.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw I18nException.badRequest('users.errors.email_already_registered');
      }
    }

    if (updateUserDto.name && updateUserDto.name !== userInfo.name) {
      const existingUser = await this.prisma.user.findUnique({
        where: { name: updateUserDto.name },
      });

      if (existingUser) {
        throw I18nException.badRequest('users.errors.name_already_registered');
      }
    }

    const { roleIds, ...userUpdateData } = updateUserDto;

    if (userUpdateData.password) {
      userUpdateData.password = await bcrypt.hash(userUpdateData.password, 10);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: userUpdateData,
        select: {
          id: true,
          email: true,
          name: true,
          userCode: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      let roles = userInfo.roles;
      if (roleIds) {
        const validRoleIds = await this.validRoleIds(roleIds, companyId);
        const updatedCompanyUser = await tx.companyUser.update({
          where: {
            companyId_userId: { companyId, userId: id },
          },
          data: {
            roles: {
              deleteMany: {},
              create: validRoleIds.map((roleId) => ({ roleId })),
            },
          },
          select: {
            roles: { select: { role: { select: { id: true, name: true } } } },
          },
        });
        roles = updatedCompanyUser.roles.map(({ role }) => role);
      }

      return { ...updatedUser, roles };
    });

    return {
      message: 'users.success.updated',
      data: result,
    };
  }

  async remove(id: number, companyId: number) {
    await this.findOne(id, companyId);

    await this.prisma.companyUser.delete({
      where: {
        companyId_userId: { companyId, userId: id },
      },
    });

    const remainingCompanies = await this.prisma.companyUser.count({
      where: { userId: id },
    });

    if (remainingCompanies === 0) {
      await this.prisma.user.delete({
        where: { id },
      });
      return { message: 'users.success.deleted_completely' };
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
