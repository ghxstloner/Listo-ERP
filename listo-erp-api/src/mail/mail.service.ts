import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    const smtpHost =
      this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const smtpPort = this.configService.get<number>('SMTP_PORT') || 587;

    this.logger.log(`Configurando SMTP: ${smtpHost}:${smtpPort}`);
    this.logger.log(
      `SMTP_USER: ${smtpUser ? 'Configurado' : 'NO CONFIGURADO'}`,
    );
    this.logger.log(
      `SMTP_PASS: ${smtpPass ? 'Configurado' : 'NO CONFIGURADO'}`,
    );

    if (!smtpUser || !smtpPass) {
      this.logger.error(
        '❌ Faltan credenciales SMTP en las variables de entorno',
      );
      this.logger.error('   Asegúrate de tener en .env:');
      this.logger.error('   SMTP_USER=tuemail@gmail.com');
      this.logger.error('   SMTP_PASS=tu-app-password');
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  async sendPasswordResetEmail(to: string, code: string): Promise<void> {
    const smtpUser = this.configService.get<string>('SMTP_USER');

    if (!smtpUser) {
      throw new Error(
        'SMTP_USER no está configurado en las variables de entorno',
      );
    }

    const companyName =
      this.configService.get<string>('COMPANY_NAME') || 'Listo ERP';

    const mailOptions = {
      from: `"${companyName}" <${smtpUser}>`,
      to,
      subject: `Código de recuperación de contraseña - ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Recuperación de Contraseña</h2>
          <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código de verificación:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #ff6600; font-size: 36px; letter-spacing: 8px; margin: 0;">${code}</h1>
          </div>
          
          <p style="color: #666;">Este código expirará en <strong>15 minutos</strong> y es de un solo uso.</p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Si no solicitaste este código, puedes ignorar este mensaje. Tu contraseña no será modificada.
          </p>
        </div>
      `,
    };

    try {
      this.logger.log(`Enviando correo a: ${to}`);
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Correo enviado exitosamente a: ${to}`);
    } catch (error) {
      this.logger.error(`❌ Error al enviar correo: ${error.message}`);
      throw error;
    }
  }
}
