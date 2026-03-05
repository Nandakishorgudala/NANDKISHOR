import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = 'http://localhost:5211/api';

  constructor(private http: HttpClient) {}

  // Customer
  createProfile(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/customer/profile`, data);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/customer/profile`);
  }

  // Policy Applications
  submitApplication(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/policyapplications`, data);
  }

  getMyApplications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/policyapplications/customer`);
  }

  // Policies
  getMyPolicies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/policy/my-policies`);
  }

  calculatePremium(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/policy/calculate-premium`, data);
  }

  // Dashboard
  getAdminStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/admin/stats`);
  }

  getAgentStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/agent/stats`);
  }

  getOfficerStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/officer/stats`);
  }

  // Admin
  createAgent(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/create-agent`, data);
  }

  createClaimsOfficer(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/create-claims-officer`, data);
  }

  // Admin Overview
  getAllApplications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/applications`);
  }

  getAllPolicies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/policies`);
  }

  getAgentPerformance(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/agent-performance`);
  }

  // Policy Products
  createPolicyProduct(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/policyproduct`, data);
  }

  getAllPolicyProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/policyproduct`);
  }

  getActivePolicyProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/policyproduct/active`);
  }

  applyPolicyWithPlan(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/policyapplications/apply-with-plan`, data);
  }

  // Agent
  getAgentApplications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/policyapplications/agent`);
  }

  getAgentCustomers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/policyapplications/agent/customers`);
  }

  approveApplication(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/policyapplications/${id}/approve`, {});
  }

  rejectApplication(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/policyapplications/${id}/reject`, {});
  }

  // Admin - Agent Assignment
  getAvailableAgents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/available-agents`);
  }

  assignAgentToApplication(applicationId: number, agentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/assign-agent`, { applicationId, agentId });
  }

  getOfficerPerformance(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/officer-performance`);
  }

  // Admin - Claims Officer Assignment
  getAvailableOfficers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/available-officers`);
  }

  getUnassignedClaims(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/unassigned-claims`);
  }

  assignOfficerToClaim(claimId: number, officerId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/assign-officer`, { claimId, officerId });
  }

  // Claims
  createClaim(claimData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/claims`, claimData);
  }

  getMyClaims(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/claims/my-claims`);
  }

  getAssignedClaims(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/claims/officer/assigned`);
  }

  getPendingClaims(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/claims/pending`);
  }

  assignClaimToOfficer(claimId: number, officerId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/claims/assign`, { claimId, officerId });
  }

  reviewClaim(reviewData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/claims/review`, reviewData);
  }

  approveClaim(approveData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/claims/approve`, approveData);
  }

  rejectClaim(rejectData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/claims/reject`, rejectData);
  }
}
