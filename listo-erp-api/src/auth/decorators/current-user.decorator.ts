import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Role } from '@prisma/client';

export interface CurrentUserPayload {
  id: number;
  email: string;
}

export interface CompanyUserPayload {
  companyId: number;
  role: Role;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as CurrentUserPayload;
  },
);

export const CurrentCompanyUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CompanyUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.companyUser as CompanyUserPayload;
  },
);

export const CurrentCompanyId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();

    if (request.companyUser?.companyId) {
      return request.companyUser.companyId;
    }

    const companyId = request.headers['x-company-id'] as string | undefined;

    if (!companyId) {
      throw new BadRequestException(
        'Header X-Company-Id es requerido para esta operación',
      );
    }

    const parsedId = parseInt(companyId, 10);
    if (isNaN(parsedId)) {
      throw new BadRequestException('X-Company-Id debe ser un número válido');
    }

    return parsedId;
  },
);

export const CurrentCompanyRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Role => {
    const request = ctx.switchToHttp().getRequest();
    return request.companyUser?.role;
  },
);
