import { ConfigService } from '@nestjs/config';
import { CredentialsService } from './credentials.service';

describe('CredentialsService', () => {
  const key =
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  it('round-trips provider credentials without keeping plaintext in ciphertext', () => {
    const service = new CredentialsService(
      new ConfigService({ ELECTRONIC_INVOICING_ENCRYPTION_KEY: key }),
    );
    const credentials = {
      tokenEmpresa: 'company-token',
      tokenPassword: 'password-token',
    };

    const encrypted = service.encrypt(credentials);

    expect(encrypted.ciphertext).not.toContain(credentials.tokenEmpresa);
    expect(encrypted.ciphertext).not.toContain(credentials.tokenPassword);
    expect(service.decrypt(encrypted)).toEqual(credentials);
  });

  it('rejects a missing or invalid encryption key', () => {
    const service = new CredentialsService(new ConfigService());

    expect(() =>
      service.encrypt({
        tokenEmpresa: 'company-token',
        tokenPassword: 'password',
      }),
    ).toThrow('ELECTRONIC_INVOICING_ENCRYPTION_KEY');
  });
});
