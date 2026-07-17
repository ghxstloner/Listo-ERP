import { Injectable } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private auditService: AuditService,
  ) {}

  async register(registerDto: RegisterDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: registerDto.companyId },
    });

    if (!company) {
      throw I18nException.notFound('auth.errors.company_not_found');
    }

    if (!company.isActive) {
      throw I18nException.badRequest('auth.errors.company_inactive');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw I18nException.badRequest('auth.errors.email_already_registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          name: registerDto.name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      await tx.companyUser.create({
        data: {
          userId: user.id,
          companyId: registerDto.companyId,
        },
      });

      return user;
    });

    const payload = {
      sub: result.id,
      email: result.email,
      jti: randomUUID(),
    };

    const token = this.jwtService.sign(payload);

    return {
      user: result,
      companies: [
        {
          id: company.id,
          name: company.name,
          primaryColor: company.primaryColor,
          secondaryColor: company.secondaryColor,
          permissions: [],
        },
      ],
      access_token: token,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      await this.auditService.logLoginFailure(
        loginDto.email,
        'Usuario no encontrado',
      );
      throw I18nException.unauthorized('auth.errors.invalid_credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      await this.auditService.logLoginFailure(
        loginDto.email,
        'Contraseña incorrecta',
      );
      throw I18nException.unauthorized('auth.errors.invalid_credentials');
    }

    if (!user.isActive) {
      await this.auditService.logLoginFailure(
        loginDto.email,
        'Usuario desactivado',
      );
      throw I18nException.unauthorized('auth.errors.user_deactivated');
    }

    const companyUsers = await this.prisma.companyUser.findMany({
      where: { userId: user.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            primaryColor: true,
            secondaryColor: true,
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

    const activeCompanies = companyUsers
      .filter((cu) => cu.company.isActive)
      .map((cu) => ({
        id: cu.company.id,
        name: cu.company.name,
        primaryColor: cu.company.primaryColor,
        secondaryColor: cu.company.secondaryColor,
        permissions: [
          ...new Set(
            cu.roles.flatMap((assignment) =>
              assignment.role.permissions.map(
                ({ permission }) => permission.code,
              ),
            ),
          ),
        ],
      }));

    if (activeCompanies.length === 0) {
      await this.auditService.logLoginFailure(
        loginDto.email,
        'Sin empresas activas',
      );
      throw I18nException.unauthorized('auth.errors.no_active_companies');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      jti: randomUUID(),
    };

    const token = this.jwtService.sign(payload);

    await this.auditService.logLoginSuccess(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      companies: activeCompanies,
      access_token: token,
    };
  }

  private generateResetCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    await this.auditService.logPasswordResetRequest(forgotPasswordDto.email);

    if (!user) {
      return {
        message: 'auth.success.password_reset_email',
      };
    }

    const resetCode = this.generateResetCode();
    const resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordCode: resetCode,
        resetPasswordExpires: resetPasswordExpires,
      },
    });

    try {
      await this.mailService.sendPasswordResetEmail(user.email, resetCode);
    } catch (error) {
      console.error('Error enviando correo:', error);
    }

    return {
      message: 'auth.success.password_reset_email',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
      throw I18nException.badRequest('auth.errors.passwords_do_not_match');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordCode: resetPasswordDto.code,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw I18nException.badRequest('auth.errors.invalid_or_expired_code');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordCode: null,
        resetPasswordExpires: null,
      },
    });

    await this.auditService.logPasswordResetSuccess(user.id, user.email);

    return {
      message: 'auth.success.password_updated',
    };
  }
}
