import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

interface TranslatableError {
  key: string;
  args?: Record<string, any>;
}

export class I18nException {
  static badRequest(
    key: string,
    args?: Record<string, any>,
  ): BadRequestException {
    return new BadRequestException({ key, args } as TranslatableError);
  }

  static notFound(key: string, args?: Record<string, any>): NotFoundException {
    return new NotFoundException({ key, args } as TranslatableError);
  }

  static unauthorized(
    key: string,
    args?: Record<string, any>,
  ): UnauthorizedException {
    return new UnauthorizedException({ key, args } as TranslatableError);
  }

  static forbidden(
    key: string,
    args?: Record<string, any>,
  ): ForbiddenException {
    return new ForbiddenException({ key, args } as TranslatableError);
  }
}

// Helper to get entity translation key
export const EntityTranslations: Record<string, string> = {
  company: 'Empresa',
  user: 'Usuario',
  branch: 'Sucursal',
  department: 'Departamento',
  subdepartment: 'Subdepartamento',
  category: 'Categoría',
  subcategory: 'Subcategoría',
  product: 'Producto',
  supplier: 'Proveedor',
  seller: 'Vendedor',
  currency: 'Moneda',
  'exchange-rate': 'Tipo de cambio',
  'payment-method': 'Método de pago',
  till: 'Caja',
};
