import { useApiMutation } from "@config";
import type { 
  LoginRequest, 
  LoginResponse, 
  ForgotPasswordRequest, 
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse 
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