export interface CustomerProfile {
  age: number;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface CustomerResponse extends CustomerProfile {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  isActive: boolean;
}
