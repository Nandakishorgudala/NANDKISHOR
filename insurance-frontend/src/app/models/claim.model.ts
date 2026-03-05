export interface CreateClaim {
  policyId: number;
  incidentDate: string;
  incidentLocation: string;
  incidentZipCode: string;
  incidentDescription: string;
  claimedAmount: number;
}

export interface ReviewClaim {
  claimId: number;
  propertyLossPercentage: number;
  disasterImpactScore: number;
  reviewNotes?: string;
}

export interface ApproveClaim {
  claimId: number;
  approvedAmount: number;
  reviewNotes?: string;
}

export interface Claim {
  id: number;
  policyId: number;
  policyNumber: string;
  incidentDate: string;
  incidentLocation: string;
  incidentZipCode: string;
  claimedAmount: number;
  estimatedLossAmount: number;
  approvedAmount: number;
  disasterImpactScore: number;
  fraudRiskScore: number;
  propertyLossPercentage: number;
  status: string;
  reviewNotes?: string;
}
