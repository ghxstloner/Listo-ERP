export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user:{
    id: number,
    email: string,
    name: string
},
  companies:[
    {
      id: number,
      name: string,
      primaryColor: string
      secondaryColor: string
      role: string
    }
  ],
  access_token: string
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  code: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}