import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface ProviderCredentials {
  tokenEmpresa: string;
  tokenPassword: string;
}

export interface EncryptedCredentials {
  ciphertext: string;
  nonce: string;
  authTag: string;
}

@Injectable()
export class CredentialsService {
  constructor(private readonly config: ConfigService) {}

  encrypt(credentials: ProviderCredentials): EncryptedCredentials {
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.getKey(), nonce);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(credentials), 'utf8'),
      cipher.final(),
    ]);

    return {
      ciphertext: ciphertext.toString('base64'),
      nonce: nonce.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
    };
  }

  decrypt(encrypted: EncryptedCredentials): ProviderCredentials {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.getKey(),
      Buffer.from(encrypted.nonce, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(encrypted.ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8');

    return JSON.parse(plaintext) as ProviderCredentials;
  }

  private getKey(): Buffer {
    const value = this.config.get<string>(
      'ELECTRONIC_INVOICING_ENCRYPTION_KEY',
    );
    if (!value || !/^[a-fA-F0-9]{64}$/.test(value)) {
      throw new InternalServerErrorException(
        'ELECTRONIC_INVOICING_ENCRYPTION_KEY must be a 64-character hexadecimal key',
      );
    }
    return Buffer.from(value, 'hex');
  }
}
