import { z } from 'zod';

export function createLoginSchema(t: (key: string) => string) {
  return z.object({
    identifier: z
      .string()
      .min(1, t("auth.validation.identifierRequired")),
    password: z
      .string()
      .min(1, t("auth.validation.passwordRequired"))
      .min(6, t("auth.validation.passwordMinLength")),
  });
}

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'El correo electrónico o nombre de usuario es requerido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginSchema = z.infer<typeof loginSchema>;
