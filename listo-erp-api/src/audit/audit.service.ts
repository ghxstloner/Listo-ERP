import { Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogData {
  userId?: number;
  companyId?: number;
  action: AuditAction;
  description: string;
  section: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          companyId: data.companyId,
          action: data.action,
          description: data.description,
          section: data.section,
        },
      });
    } catch (error) {
      console.error('Error al registrar auditoría:', error);
    }
  }

  async logLoginSuccess(userId: number, email: string): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.LOGIN_SUCCESS,
      description: `Login exitoso para usuario: ${email}`,
      section: 'auth',
    });
  }

  async logLoginFailure(email: string, reason: string): Promise<void> {
    await this.log({
      action: AuditAction.LOGIN_FAILURE,
      description: `Login fallido para usuario: ${email} - ${reason}`,
      section: 'auth',
    });
  }

  async logLogout(userId: number, email: string): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.LOGOUT,
      description: `Logout de usuario: ${email}`,
      section: 'auth',
    });
  }

  async logPasswordResetRequest(email: string): Promise<void> {
    await this.log({
      action: AuditAction.PASSWORD_RESET_REQUEST,
      description: `Solicitud de recuperación de contraseña para: ${email}`,
      section: 'auth',
    });
  }

  async logPasswordResetSuccess(userId: number, email: string): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.PASSWORD_RESET_SUCCESS,
      description: `Contraseña restablecida exitosamente para: ${email}`,
      section: 'auth',
    });
  }

  async logPasswordChange(userId: number, email: string): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.PASSWORD_CHANGE,
      description: `Cambio de contraseña para usuario: ${email}`,
      section: 'auth',
    });
  }

  async getRecentLogs(limit: number = 100): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async getLogsByUser(userId: number, limit: number = 50): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: { userId },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getLogsByCompany(
    companyId: number,
    limit: number = 100,
  ): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: { companyId },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async logCreate(
    userId: number,
    companyId: number,
    section: string,
    entityName: string,
    entityId: string | number,
  ): Promise<void> {
    await this.log({
      userId,
      companyId,
      action: AuditAction.CREATE,
      description: `Creación de ${entityName} (ID: ${entityId}) en ${section}`,
      section,
    });
  }

  async logUpdate(
    userId: number,
    companyId: number,
    section: string,
    entityName: string,
    entityId: string | number,
  ): Promise<void> {
    await this.log({
      userId,
      companyId,
      action: AuditAction.UPDATE,
      description: `Actualización de ${entityName} (ID: ${entityId}) en ${section}`,
      section,
    });
  }

  async logDelete(
    userId: number,
    companyId: number,
    section: string,
    entityName: string,
    entityId: string | number,
  ): Promise<void> {
    await this.log({
      userId,
      companyId,
      action: AuditAction.DELETE,
      description: `Eliminación de ${entityName} (ID: ${entityId}) en ${section}`,
      section,
    });
  }
}
