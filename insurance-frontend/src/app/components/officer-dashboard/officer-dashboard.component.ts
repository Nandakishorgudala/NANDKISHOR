import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SidebarComponent, SidebarItem } from '../shared/sidebar.component';

@Component({
  selector: 'app-officer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="dashboard-container">
      <!-- Sidebar -->
      <app-sidebar
        [userName]="officerName()"
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
              <h3 class="stat-label">Total Assigned</h3>
              <p class="stat-value">{{ assignedClaims().length }}</p>
            </div>
            <div class="stat-card">
              <h3 class="stat-label">Under Review</h3>
              <p class="stat-value">{{ getCountByStatus('UnderReview') }}</p>
            </div>
            <div class="stat-card">
              <h3 class="stat-label">Approved</h3>
              <p class="stat-value">{{ getCountByStatus('Approved') }}</p>
            </div>
            <div class="stat-card">
              <h3 class="stat-label">Rejected</h3>
              <p class="stat-value">{{ getCountByStatus('Rejected') }}</p>
            </div>
          </div>

          <!-- Claims List -->
          <div class="card">
            <h2 class="card-title">Assigned Claims</h2>
            
            @if (assignedClaims().length === 0) {
              <p class="empty-state">No claims assigned yet</p>
            } @else {
              <div class="claims-list">
                @for (claim of assignedClaims(); track claim.id) {
                  <div class="claim-card">
                    <div class="claim-header">
                      <div>
                        <h3 class="claim-title">Claim #{{ claim.id }}</h3>
                        <p class="claim-subtitle">Policy: {{ claim.policyNumber }}</p>
                      </div>
                      <span [class]="'badge badge-' + claim.status.toLowerCase()">
                        {{ claim.status }}
                      </span>
                    </div>

                    <div class="claim-details">
                      <div class="detail-item">
                        <p class="detail-label">Incident Date</p>
                        <p class="detail-value">{{ claim.incidentDate | date:'mediumDate' }}</p>
                      </div>
                      <div class="detail-item">
                        <p class="detail-label">Claimed Amount</p>
                        <p class="detail-value price">{{ '$' + claim.claimedAmount.toLocaleString() }}</p>
                      </div>
                      <div class="detail-item">
                        <p class="detail-label">Location</p>
                        <p class="detail-value">{{ claim.incidentLocation }}</p>
                      </div>
                      <div class="detail-item">
                        <p class="detail-label">Zip Code</p>
                        <p class="detail-value">{{ claim.incidentZipCode }}</p>
                      </div>
                    </div>

                    <div class="incident-description">
                      <p class="detail-label">Incident Description</p>
                      <p class="description-text">{{ claim.incidentDescription }}</p>
                    </div>

                    @if (claim.status === 'Submitted') {
                      <button (click)="startReview(claim)" class="btn btn-primary btn-block">
                        Start Review
                      </button>
                    }

                    @if (claim.status === 'UnderReview') {
                      <div class="review-section">
                        <h4 class="review-title">Review & Decision</h4>
                        <form (ngSubmit)="approveClaim(claim.id)" class="review-form">
                          <div class="form-grid">
                            <div class="form-group">
                              <label class="form-label">Approved Amount ($)</label>
                              <input type="number" [(ngModel)]="reviewData[claim.id].approvedAmount" 
                                name="approvedAmount{{claim.id}}" required min="0" step="0.01"
                                [max]="claim.claimedAmount"
                                class="form-input">
                              <p class="form-hint">Max: {{ '$' + claim.claimedAmount.toLocaleString() }}</p>
                            </div>
                            <div class="form-group">
                              <label class="form-label">Review Notes (minimum 10 characters)</label>
                              <textarea [(ngModel)]="reviewData[claim.id].reviewNotes" 
                                name="reviewNotes{{claim.id}}" rows="2" minlength="10"
                                placeholder="Provide detailed reason for your decision..."
                                class="form-input"></textarea>
                              <p class="form-hint">Current: {{ reviewData[claim.id]?.reviewNotes?.length || 0 }} characters</p>
                            </div>
                          </div>
                          <div class="form-actions">
                            <button type="submit" class="btn btn-success">
                              Approve Claim
                            </button>
                            <button type="button" (click)="rejectClaim(claim.id)" class="btn btn-danger">
                              Reject Claim
                            </button>
                          </div>
                        </form>
                      </div>
                    }

                    @if (claim.status === 'Approved') {
                      <div class="status-box status-approved">
                        <p class="status-amount">Approved Amount: {{ '$' + claim.approvedAmount.toLocaleString() }}</p>
                        <p class="status-note">✓ Amount deducted from policy coverage</p>
                        @if (claim.reviewNotes) {
                          <p class="status-notes">Notes: {{ claim.reviewNotes }}</p>
                        }
                      </div>
                    }

                    @if (claim.status === 'Rejected') {
                      <div class="status-box status-rejected">
                        <p class="status-title">Claim Rejected</p>
                        @if (claim.reviewNotes) {
                          <p class="status-notes">Reason: {{ claim.reviewNotes }}</p>
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

    /* Claims List */
    .claims-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .claim-card {
      border: 1px solid #DBEBFE;
      border-radius: 12px;
      padding: 24px;
      transition: box-shadow 0.2s;
    }

    .claim-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .claim-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }

    .claim-title {
      font-size: 18px;
      font-weight: 600;
      color: #265C98;
      margin: 0;
    }

    .claim-subtitle {
      font-size: 14px;
      color: #A872C2;
      margin: 4px 0 0 0;
    }

    .claim-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
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

    .incident-description {
      margin-bottom: 16px;
    }

    .description-text {
      font-size: 14px;
      color: #3A4451;
      margin: 4px 0 0 0;
      line-height: 1.5;
    }

    .review-section {
      margin-top: 20px;
      padding: 20px;
      background: #F4F6F9;
      border-radius: 8px;
    }

    .review-title {
      font-size: 16px;
      font-weight: 600;
      color: #265C98;
      margin: 0 0 16px 0;
    }

    .review-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
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

    .form-hint {
      font-size: 12px;
      color: #A872C2;
      margin: 4px 0 0 0;
    }

    .form-actions {
      display: flex;
      gap: 12px;
    }

    .status-box {
      margin-top: 16px;
      padding: 16px;
      border-radius: 8px;
    }

    .status-approved {
      background: #D1FAE5;
      border: 1px solid #10B981;
    }

    .status-rejected {
      background: #FEE2E2;
      border: 1px solid #E85656;
    }

    .status-title {
      font-size: 14px;
      font-weight: 600;
      color: #3A4451;
      margin: 0 0 8px 0;
    }

    .status-amount {
      font-size: 16px;
      font-weight: 600;
      color: #065F46;
      margin: 0 0 4px 0;
    }

    .status-note {
      font-size: 12px;
      color: #065F46;
      margin: 0 0 8px 0;
    }

    .status-notes {
      font-size: 13px;
      color: #3A4451;
      margin: 0;
      font-style: italic;
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

    .btn-success {
      background: #10B981;
      color: white;
      flex: 1;
    }

    .btn-success:hover {
      background: #059669;
    }

    .btn-danger {
      background: #E85656;
      color: white;
      flex: 1;
    }

    .btn-danger:hover {
      background: #DC2626;
    }

    .btn-block {
      width: 100%;
    }

    /* Badge */
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-submitted {
      background: #FFF3CD;
      color: #856404;
    }

    .badge-underreview {
      background: #DBEAFE;
      color: #1E40AF;
    }

    .badge-approved {
      background: #D1FAE5;
      color: #065F46;
    }

    .badge-rejected {
      background: #FEE2E2;
      color: #991B1B;
    }

    .badge-settled {
      background: #E9D5FF;
      color: #6B21A8;
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
export class OfficerDashboardComponent implements OnInit {
  activeTab = signal('claims');
  officerName = signal('Claims Officer');
  assignedClaims = signal<any[]>([]);
  reviewData: { [key: number]: { approvedAmount: number; reviewNotes: string } } = {};
  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' }>({ 
    show: false, 
    message: '', 
    type: 'success' 
  });

  sidebarItems: SidebarItem[] = [
    { id: 'claims', label: 'Assigned Claims', icon: '📄' }
  ];

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user?.fullName) {
      this.officerName.set(user.fullName);
    }
    
    this.loadAssignedClaims();
  }

  getPageTitle(): string {
    return 'Assigned Claims';
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
  }

  loadAssignedClaims(): void {
    this.apiService.getAssignedClaims().subscribe({
      next: (data) => {
        this.assignedClaims.set(data);
        // Initialize review data for each claim
        data.forEach((claim: any) => {
          if (!this.reviewData[claim.id]) {
            this.reviewData[claim.id] = {
              approvedAmount: claim.claimedAmount,
              reviewNotes: ''
            };
          }
        });
      },
      error: () => this.assignedClaims.set([])
    });
  }

  getCountByStatus(status: string): number {
    return this.assignedClaims().filter(c => c.status === status).length;
  }

  getStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'underreview': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'settled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  startReview(claim: any): void {
    const reviewData = {
      claimId: claim.id,
      disasterImpactScore: 0.5,
      propertyLossPercentage: 50
    };

    this.apiService.reviewClaim(reviewData).subscribe({
      next: () => {
        this.showNotification('Review started successfully', 'success');
        this.loadAssignedClaims();
      },
      error: (err) => this.showNotification(err.error?.message || 'Failed to start review', 'error')
    });
  }

  approveClaim(claimId: number): void {
    const data = this.reviewData[claimId];
    if (!data.approvedAmount || data.approvedAmount <= 0) {
      this.showNotification('Please enter a valid approved amount', 'error');
      return;
    }

    const approveData = {
      claimId: claimId,
      approvedAmount: data.approvedAmount,
      reviewNotes: data.reviewNotes || 'Claim approved after review'
    };

    this.apiService.approveClaim(approveData).subscribe({
      next: () => {
        this.showNotification('Claim approved successfully! Amount deducted from policy coverage.', 'success');
        this.loadAssignedClaims();
      },
      error: (err) => this.showNotification(err.error?.message || 'Failed to approve claim', 'error')
    });
  }

  rejectClaim(claimId: number): void {
    const notes = this.reviewData[claimId]?.reviewNotes;
    if (!notes || notes.trim().length < 10) {
      this.showNotification('Please provide a detailed reason for rejection (minimum 10 characters)', 'error');
      return;
    }

    if (!confirm('Are you sure you want to reject this claim?')) return;

    const rejectData = {
      claimId: claimId,
      reviewNotes: notes.trim()
    };

    this.apiService.rejectClaim(rejectData).subscribe({
      next: () => {
        this.showNotification('Claim rejected successfully', 'success');
        this.loadAssignedClaims();
      },
      error: (err) => this.showNotification(err.error?.message || 'Failed to reject claim', 'error')
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
