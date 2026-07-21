import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';
import { I18nException } from '../../common/exceptions/i18n-exception';
import { PrismaService } from '../../prisma/prisma.service';

export const SKIP_COMPANY_CHECK_KEY = 'skipCompanyCheck';

@Injectable()
export class CompanyAccessGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const skipCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_COMPANY_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      return true;
    }

    const companyIdHeader = request.headers['x-company-id'];

    if (!companyIdHeader) {
      throw I18nException.badRequest('guards.errors.company_header_required');
    }

    const companyId = parseInt(companyIdHeader, 10);
    if (isNaN(companyId)) {
      throw I18nException.badRequest('common.errors.invalid_id');
    }

    const companyUser = await this.prisma.companyUser.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId,
        },
      },
      include: {
        company: {
          select: {
            isActive: true,
          },
        },
        roles: {
          where: { role: { isActive: true } },
          select: {
            role: {
              select: {
                permissions: {
                  select: { permission: { select: { code: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!companyUser) {
      throw I18nException.forbidden('common.errors.company_access_denied');
    }

    if (!companyUser.company.isActive) {
      throw I18nException.forbidden('common.errors.company_inactive');
    }

    request.companyUser = {
      id: companyUser.id,
      companyId,
      permissions: [
        ...new Set(
          companyUser.roles.flatMap((assignment) =>
            assignment.role.permissions.map(
              ({ permission }) => permission.code,
            ),
          ),
        ),
      ],
    };

    return true;
  }
}
