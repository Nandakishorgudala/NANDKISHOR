export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  id: number;
  email: string;
  fullName: string;
  role: string;
  token: string;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'Admin' | 'Agent' | 'Customer' | 'ClaimsOfficer';
}
