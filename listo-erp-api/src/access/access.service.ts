import { Injectable } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyRoleDto } from './dto/create-company-role.dto';
import { UpdateCompanyRoleDto } from './dto/update-company-role.dto';

const roleSelect = {
  id: true,
  companyId: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  permissions: { select: { permission: { select: { code: true, name: true } } } },
} as const;

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  findPermissions() {
    return this.prisma.permission.findMany({ orderBy: { code: 'asc' } });
  }

  findRoles(companyId: number) {
    return this.prisma.companyRole.findMany({
      where: { companyId },
      select: roleSelect,
      orderBy: { name: 'asc' },
    });
  }

  async createRole(companyId: number, dto: CreateCompanyRoleDto) {
    const permissionIds = await this.permissionIds(dto.permissionCodes);
    const role = await this.prisma.companyRole.create({
      data: {
        companyId,
        name: dto.name.trim(),
        description: dto.description?.trim() || undefined,
        permissions: { create: permissionIds.map((permissionId) => ({ permissionId })) },
      },
      select: roleSelect,
    });
    return { data: role };
  }

  async updateRole(id: number, companyId: number, dto: UpdateCompanyRoleDto) {
    await this.roleForCompany(id, companyId);
    const permissionIds = dto.permissionCodes
      ? await this.permissionIds(dto.permissionCodes)
      : undefined;
    const role = await this.prisma.companyRole.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        isActive: dto.isActive,
        ...(permissionIds && {
          permissions: {
            deleteMany: {},
            create: permissionIds.map((permissionId) => ({ permissionId })),
          },
        }),
      },
      select: roleSelect,
    });
    return { data: role };
  }

  async deleteRole(id: number, companyId: number) {
    await this.roleForCompany(id, companyId);
    await this.prisma.companyRole.delete({ where: { id } });
    return { message: 'common.success.deleted' };
  }

  private async roleForCompany(id: number, companyId: number) {
    const role = await this.prisma.companyRole.findFirst({ where: { id, companyId } });
    if (!role) throw I18nException.notFound('common.errors.not_found', { entity: 'role' });
    return role;
  }

  private async permissionIds(codes: string[]) {
    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: codes } },
      select: { id: true },
    });
    if (permissions.length !== codes.length) {
      throw I18nException.badRequest('common.errors.invalid_id');
    }
    return permissions.map(({ id }) => id);
  }
}
