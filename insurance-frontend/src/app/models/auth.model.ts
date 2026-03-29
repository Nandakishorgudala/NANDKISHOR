export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  age: number;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface AuthResponse {
  id: number;
  email: string;
  fullName: string;
  role: string;
  token: string;
  agentId?: number;
  claimsOfficerId?: number;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'Admin' | 'Agent' | 'Customer' | 'ClaimsOfficer';
  agentId?: number;
  claimsOfficerId?: number;
}
