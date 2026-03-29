import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = 'http://localhost:5211/api';

  constructor(private http: HttpClient) { }

  getBaseUrl(): string {
    return this.apiUrl;
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`);
  }

  // Customer
  createProfile(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/customer/profile`, data);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/customer/profile`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/customer/profile`, data);
  }

  // Policy Applications
  submitApplication(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/policyapplications`, data);
  }

  getMyApplications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/policyapplications/customer`);
  }

  payPolicy(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/pay-policy`, data);
  }

  // Policies
  getMyPolicies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/policy/my-policies`);
  }

  calculatePremium(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/policy/calculate-premium`, data);
  }

  getSystemPolicies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/policy/all`);
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
  getAdminChartData(days: number = 30): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/admin/charts?days=${days}`);
  }

  createStaff(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/staff`, data);
  }

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

  updatePolicyProduct(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/policyproduct/${id}`, data);
  }

  deletePolicyProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/policyproduct/${id}`);
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

  rejectApplication(id: number, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/policyapplications/${id}/reject`, { reason });
  }

  verifyApplication(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/policyapplications/${id}/verify`, {});
  }

  // Admin - Staff & Customers
  getAllCustomers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/customers`);
  }

  // Admin - Agent Assignment
  getAvailableAgents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/available-agents`);
  }

  assignAgentToApplication(applicationId: number, agentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/assign-agent`, { applicationId, agentId });
  }

  assignAgentToPolicy(policyId: number, agentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/assign-agent-to-policy`, { policyId, agentId });
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

  acceptClaim(claimId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/claims/${claimId}/accept`, {});
  }

  analyzeClaim(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/claims/${id}/analyze`, {});
  }

  // ── Document Upload / Viewing ──────────────────────────────────────
  /**
   * Upload a supporting document for a policy application.
   * Two-step flow: upload first → get documentId → submit application with it.
   */
  uploadDocument(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post(`${this.apiUrl}/documents/upload`, formData);
  }

  uploadClaimDocument(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post(`${this.apiUrl}/documents/claim/upload`, formData);
  }

  /** Build the URL for a document; the HTTP interceptor adds the JWT automatically. */
  getDocumentApiUrl(documentId: number): string {
    return `${this.apiUrl}/documents/${documentId}`;
  }

  /** Fetch a document as a Blob (JWT added by interceptor) for inline display. */
  fetchDocumentBlob(documentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/documents/${documentId}`, {
      responseType: 'blob'
    });
  }

  /** Get document metadata without streaming the file. */
  getDocumentMeta(documentId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/documents/${documentId}/meta`);
  }

  /** Build the URL for a claim document. */
  getClaimDocumentApiUrl(documentId: number): string {
    return `${this.apiUrl}/documents/claim/${documentId}`;
  }

  /** Fetch a claim document as a Blob. */
  fetchClaimDocumentBlob(documentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/documents/claim/${documentId}`, {
      responseType: 'blob'
    });
  }

  // ── Customer Dashboard Charts ──────────────────────────────────────
  getCustomerPaymentsHistory(customerId: number, months: number = 12): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/customer/${customerId}/payments/history?months=${months}`);
  }

  getCustomerCoverageSummary(customerId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/customer/${customerId}/coverage/summary`);
  }

  getCustomerClaimsSummary(customerId: number, months: number = 12): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/customer/${customerId}/claims/summary?months=${months}`);
  }

  getCustomerPolicyMix(customerId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/customer/${customerId}/policies/mix`);
  }

  getCustomerRenewals(customerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/dashboard/customer/${customerId}/policies/renewals`);
  }

  getCustomerSavingsTrend(customerId: number, months: number = 12): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/customer/${customerId}/savings/trend?months=${months}`);
  }

  getInvoices(customerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Invoices/${customerId}/customer`);
  }

  askChatbot(messages: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/Chat/stream`, { messages });
  }

  // SSE Helper for streaming responses
  async *askChatbotStream(messages: any[]): AsyncGenerator<string> {
    const response = await fetch(`${this.apiUrl}/Chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) throw new Error('Network response was not ok');
    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line) continue;
        
        if (line.startsWith('data: ')) {
          yield line.substring(6);
        } else if (line.startsWith('data:')) {
          yield line.substring(5);
        }
      }
    }
  }

  toggleAgentStatus(agentId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/agents/${agentId}/toggle-status`, {});
  }

  toggleOfficerStatus(officerId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/officers/${officerId}/toggle-status`, {});
  }
}
