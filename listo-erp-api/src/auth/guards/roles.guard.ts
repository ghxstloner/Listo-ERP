import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { I18nException } from '../../common/exceptions/i18n-exception';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const companyUser = request.companyUser;

    if (!companyUser) {
      throw I18nException.forbidden('guards.errors.company_context_required');
    }

    const hasRole = requiredRoles.some((role) => companyUser.role === role);

    if (!hasRole) {
      throw I18nException.forbidden('guards.errors.insufficient_permissions');
    }

    return true;
  }
}
