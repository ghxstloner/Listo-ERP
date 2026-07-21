import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nException } from '../../common/exceptions/i18n-exception';
import { SKIP_COMPANY_CHECK_KEY } from '../../common/guards/company-access.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

const ROUTE_PERMISSIONS: Record<string, string | string[]> = {
  companies: 'administration.general',
  'companies-users': 'administration.general',
  users: 'administration.general',
  branches: 'administration.branches',
  warehouses: 'administration.branches',
  'warehouse-branches': 'administration.branches',
  currencies: 'administration.currencies',
  'exchange-rates': 'administration.currencies',
  tills: 'administration.tills',
  departments: 'inventory.catalogs',
  subdepartments: 'inventory.catalogs',
  categories: 'inventory.catalogs',
  subcategories: 'inventory.catalogs',
  inventory: 'inventory.control',
  'inventory-transfers': 'inventory.transfers',
  suppliers: 'purchases.suppliers',
  'purchase-orders': 'purchases.orders',
  customers: ['sales.customers', 'sales.pos'],
  sellers: ['sales.sellers', 'sales.pos'],
  'payment-methods': ['sales.catalogs', 'sales.pos'],
  'cash-sessions': ['sales.cash-closures', 'sales.pos'],
  sales: 'sales.pos',
  audit: 'reports.sales-book',
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const skipsCompanyCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_COMPANY_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic || skipsCompanyCheck) return true;
    const explicit = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const resource = request.baseUrl?.split('/').filter(Boolean).pop();
    let required =
      explicit ?? (resource ? ROUTE_PERMISSIONS[resource] : undefined);

    // POS users may read products to build their ticket, but cannot modify the catalog.
    if (resource === 'products' && request.method === 'GET') {
      required = ['inventory.products', 'sales.pos'];
    } else if (resource === 'products') {
      required = 'inventory.products';
    }

    if (!required) return true;

    const granted = request.companyUser?.permissions ?? [];
    const requiredAny = Array.isArray(required) ? required : [required];
    if (!requiredAny.some((permission) => granted.includes(permission))) {
      throw I18nException.forbidden('guards.errors.insufficient_permissions');
    }
    return true;
  }
}
