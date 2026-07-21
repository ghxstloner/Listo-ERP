import type { ProviderCredentials } from './credentials.service';

export interface TheFactoryLineTax {
  codigoTOTALImp: string;
  porcentajeTOTALImp: string;
  baseImponibleTOTALImp: string;
  valorTOTALImp: string;
  unidadMedida: string;
}

export type TheFactoryGeneralTax = TheFactoryLineTax;

export interface TheFactoryTaxTotal {
  codigoTOTALImp: string;
  montoTotal: string;
}

export interface TheFactoryInvoicePayload {
  factura: {
    tipoDocumento: '01';
    consecutivoDocumento: string;
    fechaEmision: string;
    moneda: 'COP';
    cantidadDecimales: '2';
    rangoNumeracion: string;
    cliente: {
      nombreRazonSocial: string;
      tipoPersona: string;
      tipoIdentificacion: string;
      numeroDocumento: string;
      numeroIdentificacionDV?: string;
      notificar: 'NO';
      responsabilidadesRut: Array<{ obligaciones: string; regimen?: string }>;
      detallesTributarios: Array<{ codigoImpuesto: string }>;
    };
    detalleDeFactura: Array<{
      secuencia: string;
      codigoProducto: string;
      descripcion: string;
      cantidadUnidades: string;
      unidadMedida: string;
      cantidadReal: '1';
      cantidadRealUnidadMedida: string;
      precioVentaUnitario: string;
      precioTotalSinImpuestos: string;
      precioTotal: string;
      impuestosDetalles: TheFactoryLineTax[];
      impuestosTotales: TheFactoryTaxTotal[];
    }>;
    impuestosGenerales: TheFactoryGeneralTax[];
    impuestosTotales: TheFactoryTaxTotal[];
    mediosDePago: Array<{
      metodoDePago: '1';
      medioPago: string;
      numeroDeReferencia?: string;
    }>;
    totalSinImpuestos: string;
    totalBaseImponible: string;
    totalBrutoConImpuesto: string;
    totalMonto: string;
    redondeoAplicado: '0.00';
    totalProductos: string;
    tipoOperacion: '10';
    tipoSector: '1';
  };
  documentosAdjuntos: '0';
}

export interface TheFactoryEnviarResponse {
  codigo: number;
  mensaje?: string;
  resultado?: string;
  cufe?: string;
  qr?: string;
  xml?: string;
  consecutivoDocumento?: string;
  esValidoDian?: boolean;
  fechaAceptacionDIAN?: string;
  mensajesValidacion?: string[];
  reglasValidacionDIAN?: string[];
}

export interface TheFactoryEstadoDocumentoResponse {
  codigo: number;
  mensaje?: string;
  resultado?: string;
  estatusDocumento?: number;
  mensajeDocumento?: string;
  cufe?: string;
  esValidoDIAN?: boolean;
  fechaAceptacionDIAN?: string;
  reglasValidacionDIAN?: string[];
}

export interface TheFactoryDownloadResponse {
  codigo: number;
  mensaje?: string;
  resultado?: string;
  documento?: string;
  nombre?: string;
  cufe?: string;
  hash?: string;
}

export interface TheFactoryNumberingRange {
  idNumeracion: string;
  prefijo: string;
  numeroDesde: string;
  numeroHasta: string;
  numeroInicial: string;
  tipoServicio: string;
  modalidad: string;
  tipoAmbienteSecuencial: string;
  activo: string;
}

export interface TheFactoryNumberingRangesResponse {
  codigo: number;
  resultado?: string;
  mensaje?: string;
  numeraciones?: TheFactoryNumberingRange[];
}

export interface TheFactoryRequest<T> {
  credentials: ProviderCredentials;
  payload: T;
}

export class TheFactoryClientError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    readonly kind:
      | 'CONFIGURATION'
      | 'HTTP'
      | 'TIMEOUT'
      | 'NETWORK'
      | 'INVALID_RESPONSE',
    readonly statusCode?: number,
  ) {
    super(message);
  }
}
