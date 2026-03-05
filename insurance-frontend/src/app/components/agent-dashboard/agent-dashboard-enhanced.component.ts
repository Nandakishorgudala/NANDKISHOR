import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SidebarComponent, SidebarItem } from '../shared/sidebar.component';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="dashboard-container">
      <!-- Sidebar -->
      <app-sidebar
        [userName]="agentName()"
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
          <!-- Stats Cards -->
          <div class="stats-grid">
            <div class="stat-card">
              <h3 class="stat-label">Pending Applications</h3>
              <p class="stat-value">{{ applications().filter(a => a.status === 'Pending' || a.status === 'Assigned').length }}</p>
            </div>
            <div class="stat-card">
              <h3 class="stat-label">Approved</h3>
              <p class="stat-value">{{ applications().filter(a => a.status === 'Approved').length }}</p>
            </div>
            <div class="stat-card">
              <h3 class="stat-label">My Customers</h3>
              <p class="stat-value">{{ customers().length }}</p>
            </div>
            <div class="stat-card">
              <h3 class="stat-label">Active Policies</h3>
              <p class="stat-value">{{ policies().length }}</p>
            </div>
          </div>

          <!-- Applications Tab -->
          @if (activeTab() === 'applications') {
            <div class="card">
              <h2 class="card-title">Policy Applications</h2>
              
              @if (applications().length === 0) {
                <p class="empty-state">No applications assigned yet</p>
              } @else {
                <div class="applications-list">
                  @for (app of applications(); track app.id) {
                    <div class="application-card">
                      <div class="app-header">
                        <div>
                          <h3 class="app-title">Application #{{ app.id }}</h3>
                          <p class="app-subtitle">Customer ID: {{ app.customerId }}</p>
                        </div>
                        <span [class]="'badge badge-' + app.status.toLowerCase()">
                          {{ app.status }}
                        </span>
                      </div>

                      <div class="app-details">
                        <div class="detail-item">
                          <p class="detail-label">Asset Type</p>
                          <p class="detail-value">{{ app.assetType }}</p>
                        </div>
                        <div class="detail-item">
                          <p class="detail-label">Asset Value</p>
                          <p class="detail-value">{{ '$' + app.assetValue.toLocaleString() }}</p>
                        </div>
                        <div class="detail-item">
                          <p class="detail-label">Coverage</p>
                          <p class="detail-value">{{ '$' + app.coverageAmount.toLocaleString() }}</p>
                        </div>
                        <div class="detail-item">
                          <p class="detail-label">Premium</p>
                          <p class="detail-value price">{{ '$' + app.calculatedPremium.toLocaleString() }}</p>
                        </div>
                        <div class="detail-item">
                          <p class="detail-label">Location</p>
                          <p class="detail-value">{{ app.city }}, {{ app.state }}</p>
                        </div>
                        <div class="detail-item">
                          <p class="detail-label">Risk Score</p>
                          <p class="detail-value" [class.text-red]="app.riskScore >= 70"
                             [class.text-yellow]="app.riskScore >= 40 && app.riskScore < 70"
                             [class.text-green]="app.riskScore < 40">
                            {{ app.riskScore }}/100
                          </p>
                        </div>
                        <div class="detail-item">
                          <p class="detail-label">Submitted</p>
                          <p class="detail-value">{{ app.submittedAt | date:'short' }}</p>
                        </div>
                        <div class="detail-item">
                          <p class="detail-label">Manual Review</p>
                          <p class="detail-value" [class.text-red]="app.requiresManualReview">
                            {{ app.requiresManualReview ? 'Required' : 'Not Required' }}
                          </p>
                        </div>
                      </div>

                      @if (app.status === 'Pending' || app.status === 'Assigned') {
                        <div class="app-actions">
                          <button (click)="approveApplication(app.id)" class="btn btn-success">
                            ✓ Approve Application
                          </button>
                          <button (click)="rejectApplication(app.id)" class="btn btn-danger">
                            ✗ Reject Application
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- Customers Tab -->
          @if (activeTab() === 'customers') {
            <div class="card">
              <h2 class="card-title">My Customers</h2>
              
              @if (customers().length === 0) {
                <p class="empty-state">No customers yet</p>
              } @else {
                <div class="customers-list">
                  @for (customer of customers(); track customer.id) {
                    <div class="customer-card">
                      <div class="customer-header">
                        <div>
                          <h3 class="customer-name">{{ customer.fullName }}</h3>
                          <p class="customer-email">{{ customer.email }}</p>
                          <p class="customer-id">Customer ID: {{ customer.customerId }}</p>
                        </div>
                        <div class="customer-stats">
                          <p class="stat-label">Total Policies</p>
                          <p class="stat-value-lg">{{ customer.policies?.length || 0 }}</p>
                        </div>
                      </div>

                      <!-- Customer Policies -->
                      @if (customer.policies && customer.policies.length > 0) {
                        <div class="policies-section">
                          <h4 class="section-title">Policies:</h4>
                          <div class="policies-grid">
                            @for (policy of customer.policies; track policy.id) {
                              <div class="policy-item">
                                <div class="policy-details-grid">
                                  <div class="detail-item">
                                    <p class="detail-label">Policy Number</p>
                                    <p class="detail-value font-semibold">{{ policy.policyNumber }}</p>
                                  </div>
                                  <div class="detail-item">
                                    <p class="detail-label">Coverage</p>
                                    <p class="detail-value">{{ '$' + policy.coverageAmount.toLocaleString() }}</p>
                                  </div>
                                  <div class="detail-item">
                                    <p class="detail-label">Premium</p>
                                    <p class="detail-value price">{{ '$' + policy.premiumAmount.toLocaleString() }}</p>
                                  </div>
                                  <div class="detail-item">
                                    <p class="detail-label">Claims Used</p>
                                    <p class="detail-value">{{ policy.claimsCount || 0 }}</p>
                                  </div>
                                  <div class="detail-item">
                                    <p class="detail-label">Status</p>
                                    <span [class]="'badge badge-' + policy.status.toLowerCase()">
                                      {{ policy.status }}
                                    </span>
                                  </div>
                                </div>

                                <!-- Claims for this policy -->
                                @if (policy.claims && policy.claims.length > 0) {
                                  <div class="claims-section">
                                    <p class="claims-title">Recent Claims:</p>
                                    <div class="claims-list">
                                      @for (claim of policy.claims; track claim.id) {
                                        <div class="claim-item">
                                          <span>Claim #{{ claim.id }} - {{ '$' + claim.claimedAmount.toLocaleString() }}</span>
                                          <span [class]="'badge badge-sm badge-' + claim.status.toLowerCase()">
                                            {{ claim.status }}
                                          </span>
                                        </div>
                                      }
                                    </div>
                                  </div>
                                }
                              </div>
                            }
                          </div>
                        </div>
                      } @else {
                        <p class="no-policies">No active policies yet</p>
                      }
                    </div>
                  }
                </div>
              }
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

    .stat-value-lg {
      font-size: 28px;
      font-weight: 700;
      color: #3A7EB4;
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

    /* Applications List */
    .applications-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .application-card {
      border: 1px solid #DBEBFE;
      border-radius: 12px;
      padding: 24px;
      transition: box-shadow 0.2s;
    }

    .application-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .app-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }

    .app-title {
      font-size: 18px;
      font-weight: 600;
      color: #265C98;
      margin: 0;
    }

    .app-subtitle {
      font-size: 14px;
      color: #A872C2;
      margin: 4px 0 0 0;
    }

    .app-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
    }

    .detail-label {
      font-size: 12px;
      color: #A872C2;
      margin: 0 0 4px 0;
    }

    .detail-value {
      font-size: 14px;
      font-weight: 600;
      color: #3A4451;
      margin: 0;
    }

    .price {
      color: #3A7EB4;
    }

    .text-red {
      color: #E85656;
    }

    .text-yellow {
      color: #FF7B54;
    }

    .text-green {
      color: #10B981;
    }

    .app-actions {
      display: flex;
      gap: 12px;
    }

    /* Customers List */
    .customers-list {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .customer-card {
      border: 1px solid #DBEBFE;
      border-radius: 12px;
      padding: 24px;
    }

    .customer-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }

    .customer-name {
      font-size: 18px;
      font-weight: 600;
      color: #265C98;
      margin: 0;
    }

    .customer-email {
      font-size: 14px;
      color: #3A4451;
      margin: 4px 0 0 0;
    }

    .customer-id {
      font-size: 12px;
      color: #A872C2;
      margin: 4px 0 0 0;
    }

    .customer-stats {
      text-align: right;
    }

    .policies-section {
      margin-top: 20px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #265C98;
      margin: 0 0 12px 0;
    }

    .policies-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .policy-item {
      background: #F4F6F9;
      padding: 16px;
      border-radius: 8px;
    }

    .policy-details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
    }

    .claims-section {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #DBEBFE;
    }

    .claims-title {
      font-size: 12px;
      font-weight: 600;
      color: #3A4451;
      margin: 0 0 8px 0;
    }

    .claims-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .claim-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
    }

    .no-policies {
      font-size: 14px;
      color: #A872C2;
      font-style: italic;
      margin: 12px 0 0 0;
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
      flex: 1;
    }

    .btn-success {
      background: #10B981;
      color: white;
    }

    .btn-success:hover {
      background: #059669;
    }

    .btn-danger {
      background: #E85656;
      color: white;
    }

    .btn-danger:hover {
      background: #DC2626;
    }

    /* Badge */
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-sm {
      padding: 2px 8px;
      font-size: 11px;
    }

    .badge-pending, .badge-assigned {
      background: #FFF3CD;
      color: #856404;
    }

    .badge-approved {
      background: #D1FAE5;
      color: #065F46;
    }

    .badge-rejected {
      background: #FEE2E2;
      color: #991B1B;
    }

    /* Badge */
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-sm {
      padding: 2px 8px;
      font-size: 11px;
    }

    .badge-pending, .badge-assigned {
      background: #FFF3CD;
      color: #856404;
    }

    .badge-approved {
      background: #D1FAE5;
      color: #065F46;
    }

    .badge-rejected {
      background: #FEE2E2;
      color: #991B1B;
    }

    .badge-active {
      background: #D1FAE5;
      color: #065F46;
    }

    .badge-expired {
      background: #F3F4F6;
      color: #6B7280;
    }

    .badge-cancelled {
      background: #FEE2E2;
      color: #991B1B;
    }

    .badge-underreview {
      background: #DBEAFE;
      color: #1E40AF;
    }

    .badge-submitted {
      background: #FFF3CD;
      color: #856404;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #A872C2;
      font-size: 14px;
    }

    .font-semibold {
      font-weight: 600;
    }
  `]
})
export class AgentDashboardEnhancedComponent implements OnInit {
  activeTab = signal('applications');
  agentName = signal('Agent');
  applications = signal<any[]>([]);
  customers = signal<any[]>([]);
  policies = signal<any[]>([]);
  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' }>({ 
    show: false, 
    message: '', 
    type: 'success' 
  });

  private apiUrl = 'http://localhost:5211/api';

  sidebarItems: SidebarItem[] = [
    { id: 'applications', label: 'Applications', icon: '📋' },
    { id: 'customers', label: 'My Customers', icon: '👥' }
  ];

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user?.fullName) {
      this.agentName.set(user.fullName);
    }
    
    this.loadApplications();
    this.loadCustomers();
  }

  getPageTitle(): string {
    const titles: any = {
      applications: 'Policy Applications',
      customers: 'My Customers'
    };
    return titles[this.activeTab()] || 'Agent Dashboard';
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
  }

  loadApplications(): void {
    this.apiService.getAgentApplications().subscribe({
      next: (data) => this.applications.set(data),
      error: () => this.applications.set([])
    });
  }

  loadCustomers(): void {
    this.apiService.getAgentCustomers().subscribe({
      next: (data) => {
        this.customers.set(data);
        // Calculate total policies from all customers
        const totalPolicies = data.reduce((sum: number, customer: any) => 
          sum + (customer.policies?.length || 0), 0);
        this.policies.set(data.flatMap((c: any) => c.policies || []));
      },
      error: () => {
        this.customers.set([]);
        this.policies.set([]);
      }
    });
  }

  approveApplication(applicationId: number): void {
    if (!confirm('Are you sure you want to approve this application?')) return;
    
    this.apiService.approveApplication(applicationId).subscribe({
      next: () => {
        this.showNotification('Application approved successfully!', 'success');
        this.loadApplications();
        this.loadCustomers();
      },
      error: (err) => this.showNotification(err.error?.message || 'Failed to approve', 'error')
    });
  }

  rejectApplication(applicationId: number): void {
    if (!confirm('Are you sure you want to reject this application?')) return;
    
    this.apiService.rejectApplication(applicationId).subscribe({
      next: () => {
        this.showNotification('Application rejected', 'success');
        this.loadApplications();
      },
      error: (err) => this.showNotification(err.error?.message || 'Failed to reject', 'error')
    });
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification.set({ show: true, message, type });
    setTimeout(() => {
      this.notification.set({ show: false, message: '', type: 'success' });
    }, 3000);
  }

  logout(): void {
    this.authService.logout();
  }
}
