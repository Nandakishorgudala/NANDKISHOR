export interface PolicyApplication {
  policyProductId: number;
  assetType: string;
  assetValue: number;
  yearBuilt: number;
  state: string;
  city: string;
  zipCode: string;
  coverageAmount: number;
  deductible: number;
}

export interface PremiumCalculation {
  policyApplicationId: number;
  customerAge: number;
  assetValue: number;
  yearBuilt: number;
  zipCode: string;
  riskZone: string;
  coverageAmount: number;
  deductible: number;
}

export interface PremiumResponse {
  basePremium: number;
  ageFactorMultiplier: number;
  riskZoneMultiplier: number;
  assetAgeMultiplier: number;
  coverageMultiplier: number;
  calculatedPremium: number;
  riskScore: number;
  requiresManualReview: boolean;
  calculationBreakdown: string;
}

export interface Policy {
  id: number;
  policyNumber: string;
  premiumAmount: number;
  coverageAmount: number;
  startDate: string;
  endDate: string;
  status: string;
}
