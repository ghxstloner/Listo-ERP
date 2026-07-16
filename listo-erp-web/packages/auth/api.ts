import { useApiMutation, useApiQuery } from "@config";
import type { 
  LoginRequest, 
  LoginResponse, 
  ForgotPasswordRequest, 
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  SessionResponse,
} from "./types";

export const useLogin = () => {
  return useApiMutation<LoginResponse, LoginRequest>('auth/login');
};

export const useForgotPassword = () => {
  return useApiMutation<ForgotPasswordResponse, ForgotPasswordRequest>('auth/forgot-password');
};

export const useResetPassword = () => {
  return useApiMutation<ResetPasswordResponse, ResetPasswordRequest>('auth/reset-password');
};

export const useSessionPermissions = (companyId: string | null) => {
  return useApiQuery<SessionResponse>(
    ['auth', 'session', companyId],
    'auth/session',
    undefined,
    {
      enabled: Boolean(companyId),
      refetchInterval: 60_000,
      refetchOnWindowFocus: true,
    },
  );
};
