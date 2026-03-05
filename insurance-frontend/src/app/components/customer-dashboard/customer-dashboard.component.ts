import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SidebarComponent, SidebarItem } from '../shared/sidebar.component';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="dashboard-container">
      <!-- Sidebar -->
      <app-sidebar
        [userName]="customerName()"
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

        <!-- Content Area -->
        <div class="content-body">
          @if (activeTab() === 'profile') {
            <div class="card">
              <h2 class="card-title">Customer Profile</h2>
              @if (!hasProfile()) {
                <form (ngSubmit)="createProfile()" class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Age</label>
                    <input type="number" [(ngModel)]="profile.age" name="age" required class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="text" [(ngModel)]="profile.phoneNumber" name="phone" required class="form-input">
                  </div>
                  <div class="form-group full-width">
                    <label class="form-label">Address</label>
                    <input type="text" [(ngModel)]="profile.address" name="address" required class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">City</label>
                    <input type="text" [(ngModel)]="profile.city" name="city" required class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">State</label>
                    <input type="text" [(ngModel)]="profile.state" name="state" required class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Zip Code</label>
                    <input type="text" [(ngModel)]="profile.zipCode" name="zip" required class="form-input">
                  </div>
                  <div class="form-actions full-width">
                    <button type="submit" class="btn btn-primary">Create Profile</button>
                  </div>
                </form>
              } @else {
                <div class="profile-info">
                  <div class="info-item">
                    <span class="info-label">Age:</span>
                    <span class="info-value">{{ profile.age }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">{{ profile.phoneNumber }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Address:</span>
                    <span class="info-value">{{ profile.address }}, {{ profile.city }}, {{ profile.state }} {{ profile.zipCode }}</span>
                  </div>
                </div>
              }
            </div>
          }

          @if (activeTab() === 'browse') {
            <div class="card">
              <h2 class="card-title">Available Insurance Policies</h2>
              @if (policyProducts().length === 0) {
                <p class="empty-state">No policies available at the moment</p>
              } @else {
                <div class="policy-grid">
                  @for (product of policyProducts(); track product.id) {
                    <div class="policy-card">
                      <h3 class="policy-name">{{ product.name }}</h3>
                      <p class="policy-description">{{ product.description }}</p>
                      <div class="policy-details">
                        <div class="detail-item">
                          <span class="detail-label">Base Premium:</span>
                          <span class="detail-value price">{{ '$' + product.basePremium.toLocaleString() }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Coverage:</span>
                          <span class="detail-value">{{ '$' + product.coverageAmount.toLocaleString() }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Tenure:</span>
                          <span class="detail-value">{{ product.tenureYears }} years</span>
                        </div>
                      </div>
                      <button (click)="selectPolicy(product)" class="btn btn-secondary btn-block">
                        Apply Now
                      </button>
                    </div>
                  }
                </div>
              }
            </div>

            @if (selectedPolicy()) {
              <div class="card">
                <h2 class="card-title">Apply for {{ selectedPolicy()?.name }}</h2>
                <form (ngSubmit)="submitApplication()" class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Your Age</label>
                    <input type="number" [(ngModel)]="application.customerAge" name="age" required class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Plan Type</label>
                    <select [(ngModel)]="application.planType" name="planType" required class="form-input">
                      <option value="">Select Plan</option>
                      <option value="Basic">Basic (1.0x coverage)</option>
                      <option value="Plus">Plus (1.25x coverage)</option>
                      <option value="Advanced">Advanced (1.5x coverage)</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Asset Type</label>
                    <input type="text" [(ngModel)]="application.assetType" name="assetType" required class="form-input" placeholder="e.g., House, Car">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Asset Value ($)</label>
                    <input type="number" [(ngModel)]="application.assetValue" name="assetValue" required class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Year Built</label>
                    <input type="number" [(ngModel)]="application.yearBuilt" name="yearBuilt" required class="form-input" min="1800" max="2100">
                  </div>
                  <div class="form-group">
                    <label class="form-label">State</label>
                    <input type="text" [(ngModel)]="application.state" name="state" required class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">City</label>
                    <input type="text" [(ngModel)]="application.city" name="city" required class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Zip Code</label>
                    <input type="text" [(ngModel)]="application.zipCode" name="zipCode" required class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Risk Zone</label>
                    <select [(ngModel)]="application.riskZone" name="riskZone" required class="form-input">
                      <option value="">Select Risk Zone</option>
                      <option value="Low">Low Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="High">High Risk</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Deductible ($)</label>
                    <select [(ngModel)]="application.deductible" name="deductible" required class="form-input">
                      <option value="">Select Deductible</option>
                      <option value="500">$500 (Higher Premium, Lower Out-of-Pocket)</option>
                      <option value="1000">$1,000 (Balanced Option)</option>
                      <option value="2500">$2,500 (Lower Premium)</option>
                      <option value="5000">$5,000 (Lowest Premium, Higher Risk)</option>
                      <option value="10000">$10,000 (Minimum Premium)</option>
                    </select>
                    <small class="form-hint">Amount you pay before insurance coverage begins</small>
                  </div>
                  
                  <div class="form-actions full-width">
                    <button type="button" (click)="cancelApplication()" class="btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn btn-primary">Submit Application</button>
                  </div>
                </form>
              </div>
            }
          }

          @if (activeTab() === 'policies') {
            <div class="card">
              <h2 class="card-title">My Active Policies</h2>
              @if (policies().length === 0) {
                <p class="empty-state">You don't have any active policies yet</p>
              } @else {
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Policy Number</th>
                        <th>Premium</th>
                        <th>Coverage</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (policy of policies(); track policy.id) {
                        <tr>
                          <td class="font-semibold">{{ policy.policyNumber }}</td>
                          <td class="price">{{ '$' + policy.premiumAmount.toLocaleString() }}</td>
                          <td>{{ '$' + policy.coverageAmount.toLocaleString() }}</td>
                          <td>{{ policy.startDate | date:'short' }}</td>
                          <td>{{ policy.endDate | date:'short' }}</td>
                          <td><span [class]="'badge badge-' + policy.status.toLowerCase()">{{ policy.status }}</span></td>
                          <td>
                            <button (click)="fileClaimForPolicy(policy)" class="btn btn-sm btn-primary">File Claim</button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }

          @if (activeTab() === 'applications') {
            <div class="card">
              <h2 class="card-title">My Applications</h2>
              @if (applications().length === 0) {
                <p class="empty-state">No applications submitted yet</p>
              } @else {
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Asset Type</th>
                        <th>Coverage</th>
                        <th>Premium</th>
                        <th>Status</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (app of applications(); track app.id) {
                        <tr>
                          <td>#{{ app.id }}</td>
                          <td>{{ app.assetType }}</td>
                          <td>{{ '$' + app.coverageAmount.toLocaleString() }}</td>
                          <td class="price">{{ '$' + app.calculatedPremium.toLocaleString() }}</td>
                          <td><span [class]="'badge badge-' + app.status.toLowerCase()">{{ app.status }}</span></td>
                          <td>{{ app.submittedAt | date:'short' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }

          @if (activeTab() === 'claims') {
            <div class="card">
              <h2 class="card-title">Submit New Claim</h2>
              
              <!-- Debug Info -->
              <div class="debug-info">
                <p>Policies loaded: {{ policies().length }}</p>
                <p>Claims loaded: {{ claims().length }}</p>
                <p class="success">✓ You can file a claim</p>
              </div>

              <form (ngSubmit)="submitClaim()" class="form-grid">
                <div class="form-group full-width">
                  <label class="form-label">Select Policy *</label>
                  <select [(ngModel)]="claimForm.policyId" name="policyId" required class="form-input">
                    <option value="">Choose a policy...</option>
                    @for (policy of policies(); track policy.id) {
                      <option [value]="policy.id">
                        {{ policy.policyNumber }} - Coverage: {{ '$' + policy.coverageAmount.toLocaleString() }} (Remaining)
                      </option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Incident Date *</label>
                  <input type="date" [(ngModel)]="claimForm.incidentDate" name="incidentDate" required class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">Claimed Amount ($) *</label>
                  <input type="number" [(ngModel)]="claimForm.claimedAmount" name="claimedAmount" required class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">Incident Location *</label>
                  <input type="text" [(ngModel)]="claimForm.incidentLocation" name="incidentLocation" required class="form-input" placeholder="e.g., 123 Main St, Springfield">
                </div>
                <div class="form-group">
                  <label class="form-label">Zip Code *</label>
                  <input type="text" [(ngModel)]="claimForm.incidentZipCode" name="incidentZipCode" required class="form-input">
                </div>
                <div class="form-group full-width">
                  <label class="form-label">Incident Description *</label>
                  <textarea [(ngModel)]="claimForm.incidentDescription" name="incidentDescription" required 
                    class="form-input" rows="4" maxlength="1000" 
                    placeholder="Describe what happened in detail..."></textarea>
                  <small class="form-hint">{{ claimForm.incidentDescription?.length || 0 }}/1000 characters</small>
                </div>
                <div class="form-actions full-width">
                  <button type="submit" class="btn btn-primary">Submit Claim</button>
                </div>
              </form>
            </div>

            <div class="card">
              <h2 class="card-title">Claims History</h2>
              @if (claims().length === 0) {
                <p class="empty-state">No claims submitted yet</p>
              } @else {
                <div class="claims-list">
                  @for (claim of claims(); track claim.id) {
                    <div class="claim-item">
                      <div class="claim-header">
                        <h3 class="claim-id">Claim #{{ claim.id }}</h3>
                        <span [class]="'badge badge-' + claim.status.toLowerCase()">{{ claim.status }}</span>
                      </div>
                      <div class="claim-details">
                        <div class="detail-row">
                          <span class="detail-label">Policy:</span>
                          <span class="detail-value">{{ claim.policyNumber }}</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-label">Claimed Amount:</span>
                          <span class="detail-value price">{{ '$' + claim.claimedAmount.toLocaleString() }}</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-label">Incident Date:</span>
                          <span class="detail-value">{{ claim.incidentDate | date:'short' }}</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-label">Location:</span>
                          <span class="detail-value">{{ claim.incidentLocation }}</span>
                        </div>
                        <div class="detail-row full-width">
                          <span class="detail-label">Description:</span>
                          <span class="detail-value">{{ claim.incidentDescription }}</span>
                        </div>
                        @if (claim.status === 'Approved') {
                          <div class="detail-row">
                            <span class="detail-label">Approved Amount:</span>
                            <span class="detail-value price success">{{ '$' + (claim.approvedAmount?.toLocaleString() || '0') }}</span>
                          </div>
                        }
                        @if (claim.reviewNotes) {
                          <div class="detail-row full-width">
                            <span class="detail-label">Review Notes:</span>
                            <span class="detail-value">{{ claim.reviewNotes }}</span>
                          </div>
                        }
                      </div>
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

    .form-hint {
      font-size: 12px;
      color: #A872C2;
      margin-top: 4px;
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

    /* Profile Info */
    .profile-info {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: #F4F6F9;
      border-radius: 8px;
    }

    .info-label {
      font-weight: 600;
      color: #265C98;
      min-width: 100px;
    }

    .info-value {
      color: #3A4451;
    }

    /* Policy Grid */
    .policy-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .policy-card {
      border: 1px solid #A872C2;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s;
    }

    .policy-card:hover {
      border-color: #3A7EB4;
      box-shadow: 0 4px 12px rgba(58, 126, 180, 0.15);
    }

    .policy-name {
      font-size: 18px;
      font-weight: 600;
      color: #265C98;
      margin: 0 0 8px 0;
    }

    .policy-description {
      font-size: 14px;
      color: #3A4451;
      margin: 0 0 16px 0;
      line-height: 1.5;
    }

    .policy-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .detail-label {
      font-size: 13px;
      color: #A872C2;
    }

    .detail-value {
      font-size: 14px;
      font-weight: 500;
      color: #3A4451;
    }

    .detail-value.price {
      color: #3A7EB4;
      font-weight: 600;
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

    .success {
      color: #10B981;
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

    .badge-rejected, .badge-cancelled {
      background: #FEE2E2;
      color: #991B1B;
    }

    .badge-underreview {
      background: #DBEAFE;
      color: #1E40AF;
    }

    .badge-submitted {
      background: #E0E7FF;
      color: #3730A3;
    }

    /* Claims List */
    .claims-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .claim-item {
      border: 1px solid #A872C2;
      border-radius: 12px;
      padding: 20px;
    }

    .claim-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #DBEBFE;
    }

    .claim-id {
      font-size: 16px;
      font-weight: 600;
      color: #265C98;
      margin: 0;
    }

    .claim-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .detail-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .detail-row.full-width {
      grid-column: 1 / -1;
    }

    /* Debug Info */
    .debug-info {
      background: #DBEBFE;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .debug-info p {
      margin: 4px 0;
      font-size: 13px;
      color: #265C98;
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
export class CustomerDashboardComponent implements OnInit {
  activeTab = signal('profile');
  customerName = signal('');
  hasProfile = signal(false);
  
  profile: any = {
    age: 0,
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  };

  policyProducts = signal<any[]>([]);
  selectedPolicy = signal<any>(null);
  
  application: any = {
    policyProductId: 0,
    customerAge: 0,
    planType: '',
    assetType: '',
    assetValue: 0,
    yearBuilt: 2020,
    state: '',
    city: '',
    zipCode: '',
    riskZone: '',
    deductible: 1000
  };

  policies = signal<any[]>([]);
  applications = signal<any[]>([]);
  claims = signal<any[]>([]);

  claimForm: any = {
    policyId: '',
    incidentDate: '',
    claimedAmount: 0,
    incidentLocation: '',
    incidentZipCode: '',
    incidentDescription: ''
  };

  sidebarItems: SidebarItem[] = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'browse', label: 'Browse Policies', icon: '🔍' },
    { id: 'policies', label: 'My Policies', icon: '📋' },
    { id: 'applications', label: 'My Applications', icon: '📝' },
    { id: 'claims', label: 'My Claims', icon: '⚠️' }
  ];

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user?.fullName) {
      this.customerName.set(user.fullName);
    }

    this.loadProfile();
    this.loadPolicyProducts();
    this.loadPolicies();
    this.loadApplications();
    this.loadClaims();
  }

  getPageTitle(): string {
    const titles: any = {
      profile: 'My Profile',
      browse: 'Browse Policies',
      policies: 'My Policies',
      applications: 'My Applications',
      claims: 'My Claims'
    };
    return titles[this.activeTab()] || 'Dashboard';
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
  }

  loadProfile(): void {
    this.apiService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.hasProfile.set(true);
      },
      error: () => this.hasProfile.set(false)
    });
  }

  createProfile(): void {
    this.apiService.createProfile(this.profile).subscribe({
      next: () => {
        this.hasProfile.set(true);
        alert('Profile created successfully');
      },
      error: (err) => alert(err.error?.message || 'Failed to create profile')
    });
  }

  loadPolicyProducts(): void {
    this.apiService.getAllPolicyProducts().subscribe({
      next: (data: any) => this.policyProducts.set(data),
      error: () => this.policyProducts.set([])
    });
  }

  selectPolicy(product: any): void {
    this.selectedPolicy.set(product);
    this.application.policyProductId = product.id;
  }

  cancelApplication(): void {
    this.selectedPolicy.set(null);
    this.application = {
      policyProductId: 0,
      customerAge: 0,
      planType: '',
      assetType: '',
      assetValue: 0,
      yearBuilt: 2020,
      state: '',
      city: '',
      zipCode: '',
      riskZone: '',
      deductible: 1000
    };
  }
  

  submitApplication(): void {
    this.apiService.applyPolicyWithPlan(this.application).subscribe({
      next: (response: any) => {
        alert('Application submitted successfully!');
        this.cancelApplication();
        this.loadApplications();
        this.activeTab.set('applications');
      },
      error: (err) => alert(err.error?.message || 'Failed to submit application')
    });
  }

  logout(): void {
    this.authService.logout();
  }

  loadPolicies(): void {
    this.apiService.getMyPolicies().subscribe({
      next: (data) => this.policies.set(data),
      error: () => this.policies.set([])
    });
  }

  loadApplications(): void {
    this.apiService.getMyApplications().subscribe({
      next: (data) => this.applications.set(data),
      error: () => this.applications.set([])
    });
  }

  loadClaims(): void {
    this.apiService.getMyClaims().subscribe({
      next: (data) => this.claims.set(data),
      error: () => this.claims.set([])
    });
  }

  fileClaimForPolicy(policy: any): void {
    this.claimForm.policyId = policy.id;
    this.activeTab.set('claims');
  }

  submitClaim(): void {
    this.apiService.createClaim(this.claimForm).subscribe({
      next: () => {
        alert('Claim submitted successfully!');
        this.claimForm = {
          policyId: '',
          incidentDate: '',
          claimedAmount: 0,
          incidentLocation: '',
          incidentZipCode: '',
          incidentDescription: ''
        };
        this.loadClaims();
      },
      error: (err) => alert(err.error?.message || 'Failed to submit claim')
    });
  }
}
