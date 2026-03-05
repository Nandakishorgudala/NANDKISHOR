import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SidebarComponent, SidebarItem } from '../shared/sidebar.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="dashboard-container">
      <!-- Sidebar -->
      <app-sidebar
        [userName]="'Admin'"
        [items]="sidebarItems"
        [activeItem]="activeTab()"
        (itemClick)="onTabChange($event)"
        (logout)="logout()">
      </app-sidebar>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Header -->
        <div class="content-header">
          <h1 class="page-title">{{ getPageTitle() }}</h1>
        </div>

        <!-- Toast Notification -->
        @if (notification().show) {
          <div class="toast-notification" [class.success]="notification().type === 'success'" [class.error]="notification().type === 'error'">
            <span class="toast-icon">{{ notification().type === 'success' ? '✓' : '✗' }}</span>
            <span>{{ notification().message }}</span>
          </div>
        }

        <!-- Content Area -->
        <div class="content-body">
          @if (activeTab() === 'overview') {
            <!-- Stats Cards -->
            <div class="stats-grid">
              <div class="stat-card">
                <h3 class="stat-label">Total Customers</h3>
                <p class="stat-value">{{ stats().totalCustomers || 0 }}</p>
              </div>
              <div class="stat-card">
                <h3 class="stat-label">Total Agents</h3>
                <p class="stat-value">{{ stats().totalAgents || 0 }}</p>
              </div>
              <div class="stat-card">
                <h3 class="stat-label">Claims Officers</h3>
                <p class="stat-value">{{ stats().totalClaimsOfficers || 0 }}</p>
              </div>
              <div class="stat-card">
                <h3 class="stat-label">Pending Claims</h3>
                <p class="stat-value">{{ stats().pendingClaims || 0 }}</p>
              </div>
            </div>

            <!-- Pending Applications -->
            @if (unassignedApplications().length > 0) {
              <div class="card">
                <h2 class="card-title">Pending Applications - Assign Agent</h2>
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Asset</th>
                        <th>Coverage</th>
                        <th>Premium</th>
                        <th>Submitted</th>
                        <th>Assign Agent</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (app of unassignedApplications(); track app.id) {
                        <tr>
                          <td>#{{ app.id }}</td>
                          <td>{{ app.customerName }}</td>
                          <td>{{ app.assetType }}</td>
                          <td>{{ '$' + app.coverageAmount.toLocaleString() }}</td>
                          <td class="price">{{ '$' + app.calculatedPremium.toLocaleString() }}</td>
                          <td>{{ app.submittedAt | date:'short' }}</td>
                          <td>
                            <div class="assign-row">
                              <select [(ngModel)]="selectedAgents[app.id]" class="form-input-sm">
                                <option value="">Select Agent</option>
                                @for (agent of availableAgents(); track agent.id) {
                                  <option [value]="agent.id">{{ agent.fullName }}</option>
                                }
                              </select>
                              <button (click)="assignAgent(app.id)" class="btn btn-sm btn-primary">Assign</button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            <!-- Unassigned Claims -->
            @if (unassignedClaims().length > 0) {
              <div class="card">
                <h2 class="card-title">Pending Claims - Assign Claims Officer</h2>
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Claim ID</th>
                        <th>Policy</th>
                        <th>Amount</th>
                        <th>Incident Date</th>
                        <th>Assign Officer</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (claim of unassignedClaims(); track claim.id) {
                        <tr>
                          <td>#{{ claim.id }}</td>
                          <td>{{ claim.policyNumber }}</td>
                          <td class="price">{{ '$' + claim.claimedAmount.toLocaleString() }}</td>
                          <td>{{ claim.incidentDate | date:'short' }}</td>
                          <td>
                            <div class="assign-row">
                              <select [(ngModel)]="selectedOfficers[claim.id]" class="form-input-sm">
                                <option value="">Select Officer</option>
                                @for (officer of availableOfficers(); track officer.id) {
                                  <option [value]="officer.id">{{ officer.fullName }}</option>
                                }
                              </select>
                              <button (click)="assignOfficer(claim.id)" class="btn btn-sm btn-primary">Assign</button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            <!-- All Policy Applications -->
            <div class="card">
              <h2 class="card-title">All Policy Applications</h2>
              @if (allApplications().length === 0) {
                <p class="empty-state">No applications yet</p>
              } @else {
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Asset Type</th>
                        <th>Coverage</th>
                        <th>Premium</th>
                        <th>Status</th>
                        <th>Agent</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (app of allApplications(); track app.id) {
                        <tr>
                          <td>#{{ app.id }}</td>
                          <td>{{ app.customerName || 'N/A' }}</td>
                          <td>{{ app.assetType }}</td>
                          <td>{{ '$' + app.coverageAmount.toLocaleString() }}</td>
                          <td class="price">{{ '$' + app.calculatedPremium.toLocaleString() }}</td>
                          <td><span [class]="'badge badge-' + app.status.toLowerCase()">{{ app.status }}</span></td>
                          <td>{{ app.agentName || 'Unassigned' }}</td>
                          <td>{{ app.submittedAt | date:'short' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>

            <!-- All Policies -->
            <div class="card">
              <h2 class="card-title">All Active Policies</h2>
              @if (allPolicies().length === 0) {
                <p class="empty-state">No policies yet</p>
              } @else {
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Policy Number</th>
                        <th>Customer</th>
                        <th>Premium</th>
                        <th>Coverage</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (policy of allPolicies(); track policy.id) {
                        <tr>
                          <td class="font-semibold">{{ policy.policyNumber }}</td>
                          <td>{{ policy.customerName || 'N/A' }}</td>
                          <td class="price">{{ '$' + policy.premiumAmount.toLocaleString() }}</td>
                          <td>{{ '$' + policy.coverageAmount.toLocaleString() }}</td>
                          <td>{{ policy.startDate | date:'short' }}</td>
                          <td>{{ policy.endDate | date:'short' }}</td>
                          <td><span [class]="'badge badge-' + policy.status.toLowerCase()">{{ policy.status }}</span></td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>

            <!-- Agent Performance Summary -->
            <div class="card">
              <h2 class="card-title">Agent Performance Summary</h2>
              @if (agentPerformance().length === 0) {
                <p class="empty-state">No agents yet</p>
              } @else {
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Agent</th>
                        <th>Email</th>
                        <th>Total Applications</th>
                        <th>Approved</th>
                        <th>Pending</th>
                        <th>Active Policies</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (agent of agentPerformance(); track agent.agentId) {
                        <tr>
                          <td>{{ agent.fullName }}</td>
                          <td>{{ agent.email }}</td>
                          <td>{{ agent.totalApplications || 0 }}</td>
                          <td><span class="badge badge-approved">{{ agent.approvedApplications || 0 }}</span></td>
                          <td><span class="badge badge-pending">{{ agent.pendingApplications || 0 }}</span></td>
                          <td><span class="badge badge-active">{{ agent.activePolicies || 0 }}</span></td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }

          @if (activeTab() === 'users') {
            <div class="form-grid-2">
              <!-- Create Agent -->
              <div class="card">
                <h2 class="card-title">Create Agent</h2>
                <form (ngSubmit)="createAgent()" class="form-vertical">
                  <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" [(ngModel)]="agent.fullName" name="fullName" required class="form-input" placeholder="Full Name">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" [(ngModel)]="agent.email" name="email" required class="form-input" placeholder="Email">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Password</label>
                    <div class="password-input">
                      <input [type]="showAgentPassword() ? 'text' : 'password'" [(ngModel)]="agent.password" name="password" required class="form-input" placeholder="Password">
                      <button type="button" (click)="showAgentPassword.set(!showAgentPassword())" class="password-toggle">
                        {{ showAgentPassword() ? '👁️' : '👁️‍🗨️' }}
                      </button>
                    </div>
                  </div>
                  <button type="submit" class="btn btn-primary btn-block">Create Agent</button>
                </form>
              </div>

              <!-- Create Claims Officer -->
              <div class="card">
                <h2 class="card-title">Create Claims Officer</h2>
                <form (ngSubmit)="createOfficer()" class="form-vertical">
                  <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" [(ngModel)]="officer.fullName" name="fullName" required class="form-input" placeholder="Full Name">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" [(ngModel)]="officer.email" name="email" required class="form-input" placeholder="Email">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Password</label>
                    <div class="password-input">
                      <input [type]="showOfficerPassword() ? 'text' : 'password'" [(ngModel)]="officer.password" name="password" required class="form-input" placeholder="Password">
                      <button type="button" (click)="showOfficerPassword.set(!showOfficerPassword())" class="password-toggle">
                        {{ showOfficerPassword() ? '👁️' : '👁️‍🗨️' }}
                      </button>
                    </div>
                  </div>
                  <button type="submit" class="btn btn-primary btn-block">Create Officer</button>
                </form>
              </div>
            </div>
          }

          @if (activeTab() === 'agents') {
            <div class="card">
              <h2 class="card-title">Agent Performance</h2>
              @if (agentPerformance().length === 0) {
                <p class="empty-state">No agents yet</p>
              } @else {
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Agent ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Total Applications</th>
                        <th>Approved</th>
                        <th>Pending</th>
                        <th>Active Policies</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (agent of agentPerformance(); track agent.agentId) {
                        <tr>
                          <td>#{{ agent.agentId }}</td>
                          <td>{{ agent.fullName }}</td>
                          <td>{{ agent.email }}</td>
                          <td>{{ agent.totalApplications || 0 }}</td>
                          <td><span class="badge badge-approved">{{ agent.approvedApplications || 0 }}</span></td>
                          <td><span class="badge badge-pending">{{ agent.pendingApplications || 0 }}</span></td>
                          <td><span class="badge badge-active">{{ agent.activePolicies || 0 }}</span></td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }

          @if (activeTab() === 'officers') {
            <div class="card">
              <h2 class="card-title">Claims Officer Performance</h2>
              @if (officerPerformance().length === 0) {
                <p class="empty-state">No claims officers yet</p>
              } @else {
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Officer ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Employee ID</th>
                        <th>Department</th>
                        <th>Total Claims</th>
                        <th>Under Review</th>
                        <th>Approved</th>
                        <th>Rejected</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (officer of officerPerformance(); track officer.officerId) {
                        <tr>
                          <td>#{{ officer.officerId }}</td>
                          <td>{{ officer.fullName }}</td>
                          <td>{{ officer.email }}</td>
                          <td>{{ officer.employeeId }}</td>
                          <td>{{ officer.department }}</td>
                          <td>{{ officer.totalClaims || 0 }}</td>
                          <td><span class="badge badge-underreview">{{ officer.underReviewClaims || 0 }}</span></td>
                          <td><span class="badge badge-approved">{{ officer.approvedClaims || 0 }}</span></td>
                          <td><span class="badge badge-rejected">{{ officer.rejectedClaims || 0 }}</span></td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }

          @if (activeTab() === 'policies') {
            <div class="card">
              <h2 class="card-title">Create Policy Product</h2>
              <form (ngSubmit)="createPolicyProduct()" class="form-grid">
                <div class="form-group">
                  <label class="form-label">Policy Name</label>
                  <input type="text" [(ngModel)]="policyProduct.name" name="name" required class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">Base Premium ($)</label>
                  <input type="number" [(ngModel)]="policyProduct.basePremium" name="basePremium" required class="form-input">
                </div>
                <div class="form-group full-width">
                  <label class="form-label">Description</label>
                  <textarea [(ngModel)]="policyProduct.description" name="description" required class="form-input" rows="3"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Coverage Amount ($)</label>
                  <input type="number" [(ngModel)]="policyProduct.coverageAmount" name="coverageAmount" required class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">Tenure (Months)</label>
                  <input type="number" [(ngModel)]="policyProduct.tenureMonths" name="tenureMonths" required class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">Claim Limit</label>
                  <input type="number" [(ngModel)]="policyProduct.claimLimit" name="claimLimit" required class="form-input">
                </div>
                <div class="form-actions full-width">
                  <button type="submit" class="btn btn-primary">Create Policy</button>
                </div>
              </form>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Layout */
    .dashboard-container {
      display: flex;
      min-height: 100vh;
      background: #F4F6F9;
    }

    .main-content {
      margin-left: 240px;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .content-header {
      background: white;
      padding: 24px 32px;
      border-bottom: 1px solid #DBEBFE;
    }

    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: #265C98;
      margin: 0;
    }

    .content-body {
      padding: 32px;
      flex: 1;
    }

    /* Toast Notification */
    .toast-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      padding: 16px 24px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
    }

    .toast-notification.success {
      background: #10B981;
      color: white;
    }

    .toast-notification.error {
      background: #E85656;
      color: white;
    }

    .toast-icon {
      font-size: 20px;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .stat-label {
      font-size: 14px;
      color: #A872C2;
      margin: 0 0 8px 0;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #265C98;
      margin: 0;
    }

    /* Card */
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .card-title {
      font-size: 20px;
      font-weight: 600;
      color: #265C98;
      margin: 0 0 20px 0;
    }

    /* Forms */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    .form-vertical {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-label {
      font-size: 14px;
      font-weight: 500;
      color: #3A4451;
      margin-bottom: 8px;
    }

    .form-input {
      padding: 10px 14px;
      border: 1px solid #A872C2;
      border-radius: 8px;
      font-size: 14px;
      color: #3A4451;
      transition: all 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: #3A7EB4;
      box-shadow: 0 0 0 3px rgba(58, 126, 180, 0.1);
    }

    .form-input-sm {
      padding: 6px 10px;
      border: 1px solid #A872C2;
      border-radius: 6px;
      font-size: 13px;
      color: #3A4451;
    }

    .password-input {
      position: relative;
      display: flex;
      align-items: center;
    }

    .password-toggle {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    /* Buttons */
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3A7EB4;
      color: white;
    }

    .btn-primary:hover {
      background: #265C98;
    }

    .btn-secondary {
      background: transparent;
      color: #3A7EB4;
      border: 1px solid #3A7EB4;
    }

    .btn-secondary:hover {
      background: #DBEBFE;
    }

    .btn-block {
      width: 100%;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    /* Table */
    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      background: #F4F6F9;
      padding: 12px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      color: #265C98;
      border-bottom: 2px solid #DBEBFE;
    }

    .data-table td {
      padding: 12px;
      font-size: 14px;
      color: #3A4451;
      border-bottom: 1px solid #DBEBFE;
    }

    .data-table tr:hover {
      background: #F4F6F9;
    }

    .price {
      color: #3A7EB4;
      font-weight: 600;
    }

    .assign-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    /* Badge */
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-pending, .badge-assigned {
      background: #FFF3CD;
      color: #856404;
    }

    .badge-approved, .badge-active {
      background: #D1FAE5;
      color: #065F46;
    }

    .badge-rejected {
      background: #FEE2E2;
      color: #991B1B;
    }

    .badge-underreview {
      background: #DBEAFE;
      color: #1E40AF;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #A872C2;
      font-size: 14px;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  activeTab = signal('overview');
  stats = signal<any>({});
  agent: any = { fullName: '', email: '', password: '' };
  officer: any = { fullName: '', email: '', password: '' };
  policyProduct: any = { 
    name: '', 
    description: '', 
    basePremium: 0, 
    coverageAmount: 0, 
    tenureMonths: 12, 
    claimLimit: 3 
  };
  allApplications = signal<any[]>([]);
  unassignedApplications = signal<any[]>([]);
  availableAgents = signal<any[]>([]);
  selectedAgents: { [key: number]: number } = {};
  unassignedClaims = signal<any[]>([]);
  availableOfficers = signal<any[]>([]);
  selectedOfficers: { [key: number]: number } = {};
  allPolicies = signal<any[]>([]);
  agentPerformance = signal<any[]>([]);
  officerPerformance = signal<any[]>([]);
  showAgentPassword = signal(false);
  showOfficerPassword = signal(false);
  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' }>({ 
    show: false, 
    message: '', 
    type: 'success' 
  });

  sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'System Overview', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'agents', label: 'Agents', icon: '🤵' },
    { id: 'officers', label: 'Claims Officers', icon: '👨‍💼' },
    { id: 'policies', label: 'Policy Products', icon: '📋' }
  ];

  constructor(private authService: AuthService, private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadAllApplications();
    this.loadAllPolicies();
    this.loadAgentPerformance();
    this.loadOfficerPerformance();
    this.loadAvailableAgents();
    this.loadAvailableOfficers();
    this.loadUnassignedClaims();
  }

  getPageTitle(): string {
    const titles: any = {
      overview: 'System Overview',
      users: 'User Management',
      agents: 'Agent Performance',
      officers: 'Claims Officer Performance',
      policies: 'Policy Products'
    };
    return titles[this.activeTab()] || 'Admin Dashboard';
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
  }

  loadAllApplications(): void {
    this.apiService.getAllApplications().subscribe({
      next: (data) => {
        this.allApplications.set(data);
        const unassigned = data.filter((app: any) => !app.agentId && app.status === 'Pending');
        this.unassignedApplications.set(unassigned);
      },
      error: () => {
        this.allApplications.set([]);
        this.unassignedApplications.set([]);
      }
    });
  }

  loadAvailableAgents(): void {
    this.apiService.getAvailableAgents().subscribe({
      next: (data) => this.availableAgents.set(data),
      error: () => this.availableAgents.set([])
    });
  }

  assignAgent(applicationId: number): void {
    const agentId = this.selectedAgents[applicationId];
    if (!agentId) {
      this.showNotification('Please select an agent', 'error');
      return;
    }

    this.apiService.assignAgentToApplication(applicationId, agentId).subscribe({
      next: () => {
        this.showNotification('Agent assigned successfully!', 'success');
        this.loadAllApplications();
        this.loadAgentPerformance();
        delete this.selectedAgents[applicationId];
      },
      error: (err) => this.showNotification(err.error?.message || 'Failed to assign agent', 'error')
    });
  }

  loadAvailableOfficers(): void {
    this.apiService.getAvailableOfficers().subscribe({
      next: (data) => this.availableOfficers.set(data),
      error: () => this.availableOfficers.set([])
    });
  }

  loadUnassignedClaims(): void {
    this.apiService.getUnassignedClaims().subscribe({
      next: (data) => this.unassignedClaims.set(data),
      error: () => this.unassignedClaims.set([])
    });
  }

  assignOfficer(claimId: number): void {
    const officerId = this.selectedOfficers[claimId];
    if (!officerId) {
      this.showNotification('Please select a claims officer', 'error');
      return;
    }

    this.apiService.assignOfficerToClaim(claimId, officerId).subscribe({
      next: () => {
        this.showNotification('Claims officer assigned successfully!', 'success');
        this.loadUnassignedClaims();
        this.loadOfficerPerformance();
        delete this.selectedOfficers[claimId];
      },
      error: (err) => this.showNotification(err.error?.message || 'Failed to assign officer', 'error')
    });
  }

  loadAllPolicies(): void {
    this.apiService.getAllPolicies().subscribe({
      next: (data) => this.allPolicies.set(data),
      error: () => this.allPolicies.set([])
    });
  }

  loadAgentPerformance(): void {
    this.apiService.getAgentPerformance().subscribe({
      next: (data) => this.agentPerformance.set(data),
      error: () => this.agentPerformance.set([])
    });
  }

  loadOfficerPerformance(): void {
    this.apiService.getOfficerPerformance().subscribe({
      next: (data) => this.officerPerformance.set(data),
      error: () => this.officerPerformance.set([])
    });
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification.set({ show: true, message, type });
    setTimeout(() => {
      this.notification.set({ show: false, message: '', type: 'success' });
    }, 3000);
  }

  loadStats(): void {
    this.apiService.getAdminStats().subscribe({
      next: (data) => this.stats.set(data),
      error: () => this.stats.set({})
    });
  }

  createAgent(): void {
    this.apiService.createAgent(this.agent).subscribe({
      next: () => {
        this.showNotification('Agent created successfully!', 'success');
        this.agent = { fullName: '', email: '', password: '' };
        this.loadStats();
        this.loadAgentPerformance();
      },
      error: (err) => this.showNotification(err.error?.message || 'Failed to create agent', 'error')
    });
  }

  createOfficer(): void {
    this.apiService.createClaimsOfficer(this.officer).subscribe({
      next: () => {
        this.showNotification('Claims Officer created successfully!', 'success');
        this.officer = { fullName: '', email: '', password: '' };
        this.loadStats();
        this.loadOfficerPerformance();
      },
      error: (err) => this.showNotification(err.error?.message || 'Failed to create officer', 'error')
    });
  }

  createPolicyProduct(): void {
    this.apiService.createPolicyProduct(this.policyProduct).subscribe({
      next: () => {
        this.showNotification('Policy Product created successfully!', 'success');
        this.policyProduct = { name: '', description: '', basePremium: 0, coverageAmount: 0, tenureMonths: 12, claimLimit: 3 };
      },
      error: (err) => this.showNotification(err.error?.message || 'Failed to create policy product', 'error')
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
