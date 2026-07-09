import { z } from 'zod';

export function createResetPasswordSchema(t: (key: string) => string) {
  return z.object({
    code: z
      .string()
      .min(1, t("auth.validation.codeRequired")),
    newPassword: z
      .string()
      .min(1, t("auth.validation.passwordRequired"))
      .min(6, t("auth.validation.passwordMinLength")),
    confirmPassword: z
      .string()
      .min(1, t("auth.validation.confirmPasswordRequired")),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t("auth.validation.passwordsDoNotMatch"),
    path: ["confirmPassword"],
  });
}

export const resetPasswordSchema = z.object({
  code: z
    .string()
    .min(1, 'El código es requerido'),
  newPassword: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z
    .string()
    .min(1, 'La confirmación de contraseña es requerida'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ["confirmPassword"],
});

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
