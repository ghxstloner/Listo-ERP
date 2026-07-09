import { z } from 'zod';

export function createForgotPasswordSchema(t: (key: string) => string) {
  return z.object({
    email: z
      .string()
      .min(1, t("auth.validation.emailRequired"))
      .email(t("auth.validation.emailInvalid")),
  });
}

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Ingresa un correo válido'),
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
