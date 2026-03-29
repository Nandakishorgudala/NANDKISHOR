import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AgentPerformance {
  labels: string[];
  premiums: number[];
  policiesIssued: number[];
  commission: number[];
}

export interface CommissionBreakdown {
  labels: string[];
  values: number[];
  percentages: number[];
  totalCommission: number;
  mtdDelta: number;
}

export interface TaskSummary {
  labels: string[];
  urgent: number[];
  dueSoon: number[];
  onTrack: number[];
}

export interface ClaimStatusDataset {
  status: string;
  counts: number[];
  amounts: number[];
}

export interface ClaimsSummary {
  labels: string[];
  datasets: ClaimStatusDataset[];
  avgProcessingDays: number[];
}

export interface FunnelData {
  steps: string[];
  values: number[];
}

export interface TopCustomer {
  customerId: number;
  name: string;
  premium: number;
}

export interface RiskBubble {
  policyId: number;
  name: string;
  premium: number;
  riskScore: number;
  exposure: number;
}

export interface BranchPerformance {
  branches: string[];
  premiums: number[];
  policies: number[];
}

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private apiUrl = `${environment.apiUrl}/dashboard/agent`;

  constructor(private http: HttpClient) {}

  getPerformance(agentId: number, months: number = 12): Observable<AgentPerformance> {
    return this.http.get<AgentPerformance>(`${this.apiUrl}/${agentId}/performance?months=${months}`);
  }

  getCommissionBreakdown(agentId: number): Observable<CommissionBreakdown> {
    return this.http.get<CommissionBreakdown>(`${this.apiUrl}/${agentId}/commission/breakdown`);
  }

  getTasksSummary(agentId: number): Observable<TaskSummary> {
    return this.http.get<TaskSummary>(`${this.apiUrl}/${agentId}/tasks/summary`);
  }

  getClaimsSummary(agentId: number, months: number = 12): Observable<ClaimsSummary> {
    return this.http.get<ClaimsSummary>(`${this.apiUrl}/${agentId}/claims/summary?months=${months}`);
  }

  getFunnel(agentId: number, range: string = '30d'): Observable<FunnelData> {
    return this.http.get<FunnelData>(`${this.apiUrl}/${agentId}/funnel?range=${range}`);
  }

  getTopCustomers(agentId: number, limit: number = 10): Observable<TopCustomer[]> {
    return this.http.get<TopCustomer[]>(`${this.apiUrl}/${agentId}/top/customers?limit=${limit}`);
  }

  getPortfolioRisk(agentId: number): Observable<RiskBubble[]> {
    return this.http.get<RiskBubble[]>(`${this.apiUrl}/${agentId}/portfolio/risk`);
  }

  getBranchesPerformance(agentId: number): Observable<BranchPerformance> {
    return this.http.get<BranchPerformance>(`${this.apiUrl}/${agentId}/branches/performance`);
  }
}
