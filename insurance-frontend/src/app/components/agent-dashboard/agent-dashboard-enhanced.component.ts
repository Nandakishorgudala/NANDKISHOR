import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SidebarComponent, SidebarItem } from '../shared/sidebar.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { InvoiceListComponent } from '../shared/invoices/invoice-list.component';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, InvoiceListComponent],
  template: `
    <div class="dashboard-container">
      <!-- Sidebar -->
      <app-sidebar
        [userName]="agentName()"
        [userRole]="'Insurance Agent'"
        [items]="sidebarItems"
        [activeItem]="activeTab()"
        [collapsed]="isSidebarCollapsed()"
        (toggle)="isSidebarCollapsed.set($event)"
        (itemClick)="onTabChange($event)"
        (logout)="logout()">
      </app-sidebar>

      <!-- Main Content -->
      <div class="main-content" [style.margin-left.px]="contentMargin()">
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

          <!-- Invoices Tab -->
          @if (activeTab() === 'invoices') {
            <div class="card">
              <div class="section-header">
                <h2 class="card-title">🧾 Customer Invoices</h2>
                <p class="section-desc">Search and manage invoices for your customers</p>
              </div>

              <div class="search-box" style="margin-bottom: 24px;">
                <label class="form-label">Search Customer ID</label>
                <div style="display: flex; gap: 12px;">
                  <input type="text" [(ngModel)]="agentInvoiceSearch" class="form-input" placeholder="Enter Customer ID..." style="flex: 1;">
                </div>
              </div>

              @if (agentInvoiceSearch) {
                <app-invoice-list [customerId]="+agentInvoiceSearch"></app-invoice-list>
              } @else {
                <div class="empty-state-box">
                  <p class="empty-state">Enter a Customer ID to view their invoices.</p>
                </div>
              }
            </div>
          }

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
                          <p class="detail-value">{{ '₹' + app.assetValue.toLocaleString() }}</p>
                        </div>
                        <div class="detail-item">
                          <p class="detail-label">Coverage</p>
                          <p class="detail-value">{{ '₹' + app.coverageAmount.toLocaleString() }}</p>
                        </div>
                        <div class="detail-item">
                          <p class="detail-label">Premium</p>
                          <p class="detail-value price">{{ '₹' + app.calculatedPremium.toLocaleString() }}</p>
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

                        @if (app.status === 'Rejected' && app.rejectionReason) {
                          <div class="detail-item full-width">
                            <p class="detail-label">Rejection Reason</p>
                            <p class="detail-value reason-text">{{ app.rejectionReason }}</p>
                          </div>
                        }
                      </div>

                      @if (app.status === 'Pending' || app.status === 'Assigned') {
                        <div class="app-actions">
                          @if (app.documentId) {
                            <button (click)="verifyCustomer(app.id)" class="btn btn-verify">
                              🔍 Verify Customer
                            </button>
                            <button (click)="viewDocument(app)" class="btn btn-outline-doc">
                              📎 View Document
                            </button>
                          } @else {
                            <span class="no-doc-badge">⚠️ No document</span>
                          }
                          <button (click)="approveApplication(app.id)" class="btn btn-success">
                            ✓ Approve
                          </button>
                          <button (click)="openRejectModal(app.id)" class="btn btn-danger">
                            ✗ Reject
                          </button>
                        </div>
                      } @else if (app.documentId) {
                        <div class="app-actions">
                          <button (click)="viewDocument(app)" class="btn btn-outline-doc">
                            📎 View Document
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- Document Preview Modal -->
          @if (showDocModal()) {
            <div class="modal-overlay" (click)="closeDocModal()">
              <div class="modal-box doc-modal" (click)="$event.stopPropagation()">
                <div class="modal-header">
                  <h3 class="modal-title">📎 {{ docModalFileName() }}</h3>
                  <button (click)="closeDocModal()" class="modal-close">×</button>
                </div>
                <div class="doc-preview-body">
                  @if (docBlobUrl()) {
                    @if (docIsImage()) {
                      <img [src]="docBlobUrl()" alt="Uploaded document" class="doc-preview-img" />
                    } @else {
                      <iframe [src]="docBlobUrl()" class="doc-preview-pdf" title="Document Preview"></iframe>
                    }
                  } @else {
                    <div class="doc-loading">
                      <div class="spinner-lg"></div>
                      <p>Loading document…</p>
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- Reject Reason Modal -->
          @if (showRejectModal()) {
            <div class="modal-overlay" (click)="closeRejectModal()">
              <div class="modal-box" (click)="$event.stopPropagation()">
                <div class="modal-header">
                  <h3 class="modal-title">⚠️ Reject Application #{{ rejectingAppId() }}</h3>
                  <button (click)="closeRejectModal()" class="modal-close">×</button>
                </div>
                <div class="modal-body">
                  <label class="form-label">Rejection Reason <span style="color:red">*</span></label>
                  <textarea
                    [(ngModel)]="rejectionReason"
                    rows="4"
                    class="form-input"
                    placeholder="Please provide a detailed reason for rejection…"
                    maxlength="1000">
                  </textarea>
                  <small class="form-hint">{{ rejectionReason.length }}/1000</small>
                </div>
                <div class="modal-footer">
                  <button (click)="closeRejectModal()" class="btn btn-secondary">Cancel</button>
                  <button (click)="submitRejection()" class="btn btn-danger" [disabled]="!rejectionReason.trim()">
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          }

          <!-- Customer Verification Modal -->
          @if (showVerifyModal()) {
            <div class="modal-overlay" (click)="closeVerifyModal()">
              <div class="modal-box verify-modal" (click)="$event.stopPropagation()">
                <div class="modal-header">
                  <div class="header-content">
                    <h3 class="modal-title">🛡️ Customer Verification Report</h3>
                    <p class="modal-subtitle">Application #{{ verificationResult()?.applicationId }}</p>
                  </div>
                  <button (click)="closeVerifyModal()" class="modal-close">×</button>
                </div>
                
                <div class="modal-body custom-scrollbar">
                  @if (isVerifying()) {
                    <div class="verification-loading">
                      <div class="scanning-animation">
                        <div class="scan-bar"></div>
                        <div class="doc-icon">📄</div>
                      </div>
                      <p class="loading-text">Extracting identity details using AI...</p>
                    </div>
                  } @else if (verificationResult()) {
                    <div class="verification-report">
                      <!-- Overall Score -->
                      <div class="score-card-main" [class.score-high]="verificationResult().averageMatchScore >= 80"
                           [class.score-med]="verificationResult().averageMatchScore >= 50 && verificationResult().averageMatchScore < 80"
                           [class.score-low]="verificationResult().averageMatchScore < 50">
                        <div class="score-label">Identity Match Score</div>
                        <div class="score-value">{{ verificationResult().averageMatchScore }}%</div>
                        <div class="score-status">{{ verificationResult().averageMatchScore >= 80 ? 'Verified' : 'Needs Review' }}</div>
                      </div>

                      <div class="report-grid">
                        <!-- Match Details -->
                        <div class="report-section">
                          <h4 class="section-label">Identity Matching</h4>
                          <div class="match-item">
                            <span class="match-name">Name Match</span>
                            <div class="match-bar-bg"><div class="match-bar" [style.width.%]="verificationResult().nameMatchScore"></div></div>
                            <span class="match-percent">{{ verificationResult().nameMatchScore }}%</span>
                          </div>
                          <div class="match-item">
                            <span class="match-name">Address Match</span>
                            <div class="match-bar-bg"><div class="match-bar" [style.width.%]="verificationResult().addressMatchScore"></div></div>
                            <span class="match-percent">{{ verificationResult().addressMatchScore }}%</span>
                          </div>
                          <div class="match-item">
                            <span class="match-name">Age Verified</span>
                            <span class="match-status-icon">{{ verificationResult().extractedAge ? '✅' : '❌' }}</span>
                          </div>
                          @if (verificationResult().extractedDOB) {
                            <div class="match-item">
                              <span class="match-name">Extracted DOB</span>
                              <span class="match-value" style="font-size: 13px; font-weight: 700; color: #1e293b;">{{ verificationResult().extractedDOB }}</span>
                            </div>
                          }
                        </div>

                        <!-- Risk Assessment -->
                        <div class="report-section">
                          <h4 class="section-label">Risk Profile</h4>
                          <div class="risk-stats">
                            <div class="risk-item">
                              <span class="risk-label">Existing Policies</span>
                              <span class="risk-val">{{ verificationResult().existingPoliciesCount }}</span>
                            </div>
                            <div class="risk-item">
                              <span class="risk-label">Risk Score</span>
                              <span class="risk-val" [class.text-red]="verificationResult().riskScore > 70">{{ verificationResult().riskScore }}/100</span>
                            </div>
                            <div class="risk-item">
                              <span class="risk-label">Assessment</span>
                              <span class="badge" [class.badge-approved]="verificationResult().riskAssessment === 'Low'"
                                    [class.badge-pending]="verificationResult().riskAssessment === 'Medium'"
                                    [class.badge-rejected]="verificationResult().riskAssessment === 'High'">
                                {{ verificationResult().riskAssessment }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- AI Recommendation -->
                      <div class="ai-box">
                        <div class="ai-header">
                          <span class="ai-icon">🤖</span>
                          <span class="ai-title">AI Recommendation</span>
                          <span class="ai-badge" [class.bg-green]="verificationResult().recommendation === 'Approve'"
                                [class.bg-red]="verificationResult().recommendation === 'Reject'"
                                [class.bg-yellow]="verificationResult().recommendation === 'Manual Review'">
                            {{ verificationResult().recommendation }}
                          </span>
                        </div>
                        <p class="ai-reason">{{ verificationResult().reasoning }}</p>
                      </div>

                      <!-- Extracted Text Snippet -->
                      <div class="extracted-details">
                        <h4 class="detail-title">Document Content (OCR)</h4>
                        <div class="text-snippet">
                          {{ verificationResult().extractedText }}
                        </div>
                      </div>
                    </div>
                  }
                </div>
                
                <div class="modal-footer">
                  <button (click)="closeVerifyModal()" class="btn btn-secondary">Close Report</button>
                  @if (verificationResult()?.recommendation === 'Approve') {
                    <button (click)="approveFromVerification()" class="btn btn-success">✓ Proceed to Approval</button>
                  } @else {
                     <button (click)="closeVerifyModal()" class="btn btn-verify">Manual Review</button>
                  }
                </div>
              </div>
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
                                    <p class="detail-value">{{ '₹' + policy.coverageAmount.toLocaleString() }}</p>
                                  </div>
                                  <div class="detail-item">
                                    <p class="detail-label">Premium</p>
                                    <p class="detail-value price">{{ '₹' + policy.premiumAmount.toLocaleString() }}</p>
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
                                          <span>Claim #{{ claim.id }} - {{ '₹' + claim.claimedAmount.toLocaleString() }}</span>
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



          <!-- Browse Policies Section -->
          @if (activeTab() === 'browse') {
            <div class="card">
              <div class="section-header-with-badge">
                <h2 class="card-title">Available Insurance Policies</h2>
                <span class="count-badge">{{ policyProducts().length }}</span>
              </div>
              @if (policyProducts().length === 0) {
                <div class="empty-state-enhanced">
                  <div class="empty-icon">🎉</div>
                  <p class="empty-title">Check back later for new insurance products</p>
                </div>
              } @else {
                <div class="policy-grid">
                  @for (product of policyProducts(); track product.id) {
                    <div class="policy-card available">
                      <div class="policy-icon-large">{{ getPolicyIcon(product.name) }}</div>
                      <h3 class="policy-name">{{ product.name }}</h3>
                      <p class="policy-description">{{ product.description }}</p>
                      <div class="policy-price-section">
                        <div class="price-row">
                          <span class="price-label">Base Premium</span>
                          <span class="price-value">{{ '₹' + product.basePremium.toLocaleString() }}/year</span>
                        </div>
                        <div class="price-row">
                          <span class="price-label">Coverage</span>
                          <span class="price-value coverage">{{ '₹' + product.coverageAmount.toLocaleString() }}</span>
                        </div>
                      </div>
                      <div class="policy-features-compact">
                        <div class="feature-badge">
                          <span class="feature-icon">🛡️</span>
                          <span>Comprehensive Coverage</span>
                        </div>
                        <div class="feature-badge">
                          <span class="feature-icon">📞</span>
                          <span>24/7 Support</span>
                        </div>
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
      background: #F9FAFB;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: #F9FAFB;
    }

    .content-header {
      background: white;
      padding: 32px 40px;
      border-bottom: 1px solid #F3F4F6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-title {
      font-size: 28px;
      font-weight: 800;
      color: #111827;
      margin: 0;
      letter-spacing: -0.025em;
    }

    .content-body {
      padding: 40px;
      flex: 1;
      max-width: 1600px;
      width: 100%;
      margin: 0 auto;
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
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: white;
      padding: 28px;
      border-radius: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.02);
      border: 1px solid #F3F4F6;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    }

    .stat-label {
      font-size: 14px;
      font-weight: 600;
      color: #6B7280;
      margin: 0 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value {
      font-size: 36px;
      font-weight: 800;
      color: #7C3AED;
      margin: 0;
    }

    .stat-value-lg {
      font-size: 32px;
      font-weight: 800;
      color: #7C3AED;
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
      font-weight: 700;
      color: #111827;
      margin: 0 0 24px 0;
    }

    /* Table Styles */
    .table-container {
      overflow-x: auto;
      background: white;
      border-radius: 8px;
      border: 1px solid #F3F4F6;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .data-table th {
      background: #F9FAFB;
      padding: 14px 16px;
      font-size: 13px;
      font-weight: 700;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 2px solid #F3F4F6;
    }

    .data-table td {
      padding: 16px;
      border-bottom: 1px solid #F3F4F6;
      font-size: 14px;
      color: #3A4451;
      vertical-align: middle;
    }

    .data-table tbody tr:hover {
      background: #F8FAFC;
    }

    .data-table tbody tr:last-child td {
      border-bottom: none;
    }

    /* Policy Grid Styles */
    .section-header-with-badge {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .count-badge {
      background: #EDE9FE;
      color: #7C3AED;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 700;
    }

    .policy-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .policy-card {
      background: white;
      border-radius: 16px;
      padding: 32px 24px;
      border: 1px solid #F3F4F6;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .policy-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(38, 92, 152, 0.1);
      border-color: #A872C2;
    }

    .policy-icon-large {
      font-size: 48px;
      margin-bottom: 20px;
      text-align: center;
    }

    .policy-name {
      font-size: 20px;
      font-weight: 700;
      color: #265C98;
      margin: 0 0 12px 0;
      text-align: center;
    }

    .policy-description {
      font-size: 14px;
      color: #64748b;
      margin: 0 0 24px 0;
      text-align: center;
      line-height: 1.6;
      flex-grow: 1;
    }

    .policy-price-section {
      background: #F8FAFC;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .price-row:last-child {
      margin-bottom: 0;
    }

    .price-label {
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
    }

    .price-value {
      font-size: 16px;
      font-weight: 700;
      color: #3A4451;
    }

    .price-value.coverage {
      color: #10B981;
    }

    .policy-features-compact {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
    }

    .feature-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #3A4451;
      font-weight: 500;
    }

    .feature-icon {
      font-size: 16px;
    }

    /* Enhanced Empty State */
    .empty-state-enhanced {
      text-align: center;
      padding: 60px 20px;
      background: linear-gradient(135deg, #F4F6F9 0%, #DBEBFE 100%);
      border-radius: 16px;
      margin: 20px 0;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }

    .empty-title {
      font-size: 20px;
      font-weight: 700;
      color: #265C98;
      margin: 0 0 8px 0;
    }

    /* Applications List */

    .applications-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .application-card {
      border: 1px solid #F3F4F6;
      border-radius: 20px;
      padding: 28px;
      transition: all 0.2s;
      background: white;
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
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .app-subtitle {
      font-size: 14px;
      color: #6B7280;
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
      font-weight: 600;
      color: #6B7280;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.025em;
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
      font-weight: 700;
      color: #111827;
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

    .badge-active {
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

    .full-width {
      grid-column: 1 / -1;
    }

    .reason-text {
      color: #E85656;
      font-style: italic;
      background: #FEE2E2;
      padding: 8px;
      border-radius: 4px;
      margin-top: 4px;
    }

    /* Modals & Overlays */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-box {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 24px;
      width: 500px;
      max-width: 90vw;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalSlideUp {
      from { transform: translateY(40px) scale(0.95); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }

    .modal-box.doc-modal {
      width: 800px;
      height: 80vh;
    }

    .modal-header {
      padding: 16px 24px;
      border-bottom: 1px solid #F3F4F6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #64748b;
      line-height: 1;
    }

    .modal-close:hover {
      color: #1e293b;
    }

    .modal-body {
      padding: 24px;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #DBEBFE;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    /* Document Preview */
    .doc-preview-body {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #f8fafc;
      overflow: hidden;
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
    }

    .doc-preview-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .doc-preview-pdf {
      width: 100%;
      height: 100%;
      border: none;
    }

    .doc-loading {
      text-align: center;
      color: #64748b;
    }

    .spinner-lg {
      width: 40px;
      height: 40px;
      border: 4px solid #DBEBFE;
      border-top-color: #3A7EB4;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    /* Forms in Modal */
    .form-label {
      display: block;
      font-weight: 500;
      color: #3a4451;
      margin-bottom: 8px;
    }

    .form-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-family: inherit;
      resize: vertical;
    }

    .form-input:focus {
      outline: none;
      border-color: #3A7EB4;
      box-shadow: 0 0 0 2px rgba(58, 126, 180, 0.2);
    }

    .form-hint {
      color: #64748b;
      font-size: 12px;
      display: block;
      text-align: right;
      margin-top: 4px;
    }

    /* Button Variants */
    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
    }
    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-outline-doc {
      background: transparent;
      border: 1px solid #3A7EB4;
      color: #3A7EB4;
    }

    .btn-outline-doc:hover {
      background: #DBEBFE;
    }

    .btn-verify {
      background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
      color: white;
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
    }

    .btn-verify:hover {
      background: linear-gradient(135deg, #4F46E5 0%, #3730A3 100%);
      transform: translateY(-1px);
      box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
    }

    .no-doc-badge {
      display: inline-block;
      padding: 4px 12px;
      font-size: 12px;
      background: #F1F5F9;
      color: #64748B;
      border-radius: 12px;
      margin: 0 10px;
    }

    /* Verification Modal Specifics */
    .verify-modal {
      width: 700px !important;
      max-height: 90vh;
    }

    .modal-subtitle {
      font-size: 13px;
      color: #64748B;
      margin: 4px 0 0 0;
    }

    .verification-loading {
      padding: 60px 40px;
      text-align: center;
    }

    .scanning-animation {
      position: relative;
      width: 80px;
      height: 100px;
      background: #F1F5F9;
      margin: 0 auto 24px;
      border-radius: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      border: 2px solid #E2E8F0;
    }

    .doc-icon { font-size: 40px; }

    .scan-bar {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: #6366F1;
      box-shadow: 0 0 15px #6366F1;
      animation: scan 2s ease-in-out infinite;
    }

    @keyframes scan {
      0%, 100% { top: 0; }
      50% { top: 96%; }
    }

    .loading-text {
      color: #4F46E5;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .score-card-main {
      padding: 32px;
      border-radius: 16px;
      text-align: center;
      margin-bottom: 24px;
      color: white;
    }

    .score-high { background: linear-gradient(135deg, #10B981 0%, #059669 100%); }
    .score-med { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); }
    .score-low { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); }

    .score-label { font-size: 14px; opacity: 0.9; text-transform: uppercase; font-weight: 600; }
    .score-value { font-size: 48px; font-weight: 800; margin: 8px 0; }
    .score-status { font-size: 16px; font-weight: 600; background: rgba(255,255,255,0.2); display: inline-block; padding: 4px 16px; border-radius: 20px; }

    .report-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .report-section { background: #F8FAFC; padding: 20px; border-radius: 12px; border: 1px solid #E2E8F0; }
    .section-label { font-size: 14px; color: #1E293B; font-weight: 700; margin: 0 0 16px 0; border-left: 3px solid #6366F1; padding-left: 10px; }

    .match-item { margin-bottom: 12px; }
    .match-name { font-size: 12px; color: #64748B; display: block; margin-bottom: 4px; }
    .match-bar-bg { height: 8px; background: #E2E8F0; border-radius: 4px; flex: 1; margin: 0 10px; display: inline-block; width: 100px; }
    .match-bar { height: 100%; background: #6366F1; border-radius: 4px; }
    .match-percent { font-size: 12px; font-weight: 700; color: #1E293B; }

    .risk-stats { display: flex; flex-direction: column; gap: 10px; }
    .risk-item { display: flex; justify-content: space-between; font-size: 13px; }
    .risk-label { color: #64748B; }
    .risk-val { font-weight: 700; color: #1E293B; }

    .ai-box { background: #EEF2FF; padding: 20px; border-radius: 12px; border: 1px solid #C7D2FE; margin-bottom: 24px; }
    .ai-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .ai-title { font-weight: 700; color: #3730A3; }
    .ai-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; color: white; text-transform: uppercase; }
    .bg-green { background: #10B981; }
    .bg-red { background: #EF4444; }
    .bg-yellow { background: #F59E0B; }
    .ai-reason { font-size: 14px; color: #3730A3; line-height: 1.5; margin: 0; }

    .extracted-details { }
    .detail-title { font-size: 13px; font-weight: 700; color: #64748B; margin-bottom: 8px; }
    .text-snippet { font-family: 'Courier New', monospace; font-size: 11px; color: #475569; background: #F1F5F9; padding: 12px; border-radius: 8px; max-height: 100px; overflow-y: auto; border: 1px solid #E2E8F0; }

    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }

  `]
})
export class AgentDashboardEnhancedComponent implements OnInit {
  activeTab = signal('applications');
  isSidebarCollapsed = signal(false);
  agentName = signal('Agent');

  contentMargin = computed(() => this.isSidebarCollapsed() ? 80 : 250);
  applications = signal<any[]>([]);
  customers = signal<any[]>([]);
  policies = signal<any[]>([]);
  systemPolicies = signal<any[]>([]);
  policyProducts = signal<any[]>([]);
  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Document Viewer Signals
  showDocModal = signal(false);
  docBlobUrl = signal<SafeResourceUrl | null>(null);
  docModalFileName = signal<string>('');
  docIsImage = signal(false);

  // Rejection Modal Signals
  showRejectModal = signal(false);
  rejectingAppId = signal<number | null>(null);
  rejectionReason: string = '';

  // Verification Signals
  showVerifyModal = signal(false);
  isVerifying = signal(false);
  verificationResult = signal<any>(null);

  private apiUrl = 'http://localhost:5211/api';

  sidebarItems: SidebarItem[] = [
    { id: 'applications', label: 'Applications', icon: '📋' },
    { id: 'customers', label: 'My Customers', icon: '👥' },
    { id: 'browse', label: 'Browse Policies', icon: '🔍' },
    { id: 'invoices', label: 'Invoices', icon: '🧾' }
  ];

  agentInvoiceSearch: string = '';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user?.fullName) {
      this.agentName.set(user.fullName);
    }

    this.loadApplications();
    this.loadCustomers();
    this.loadSystemPolicies();
    this.loadPolicyProducts();
  }

  getPageTitle(): string {
    const titles: any = {
      applications: 'Policy Applications',
      customers: 'My Customers',
      policies: 'All System Policies',
      browse: 'Browse Policies'
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

  loadSystemPolicies(): void {
    this.apiService.getSystemPolicies().subscribe({
      next: (data) => this.systemPolicies.set(data),
      error: () => this.systemPolicies.set([])
    });
  }

  loadPolicyProducts(): void {
    this.apiService.getAllPolicyProducts().subscribe({
      next: (data: any) => this.policyProducts.set(data),
      error: () => this.policyProducts.set([])
    });
  }

  getPolicyIcon(policyName: string): string {
    const name = policyName.toLowerCase();
    if (name.includes('home') || name.includes('house') || name.includes('property')) return '🏠';
    if (name.includes('auto') || name.includes('car') || name.includes('vehicle')) return '🚗';
    if (name.includes('health') || name.includes('medical')) return '🏥';
    if (name.includes('life')) return '❤️';
    if (name.includes('travel')) return '✈️';
    if (name.includes('business')) return '💼';
    return '🛡️';
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

  openRejectModal(applicationId: number): void {
    this.rejectingAppId.set(applicationId);
    this.rejectionReason = '';
    this.showRejectModal.set(true);
  }

  closeRejectModal(): void {
    this.showRejectModal.set(false);
    this.rejectingAppId.set(null);
    this.rejectionReason = '';
  }

  submitRejection(): void {
    const appId = this.rejectingAppId();
    if (!appId || !this.rejectionReason.trim()) return;

    this.apiService.rejectApplication(appId, this.rejectionReason).subscribe({
      next: () => {
        this.showNotification('Application rejected successfully.', 'success');
        this.closeRejectModal();
        this.loadApplications();
      },
      error: (err) => this.showNotification(err.error?.message || 'Failed to reject', 'error')
    });
  }

  viewDocument(app: any): void {
    if (!app.documentId) return;

    this.docModalFileName.set(app.documentFileName || `Document #${app.documentId}`);
    this.docIsImage.set(app.documentContentType?.startsWith('image/') || false);
    this.showDocModal.set(true);
    this.docBlobUrl.set(null); // Show loading state

    this.apiService.fetchDocumentBlob(app.documentId).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.docBlobUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl));
      },
      error: (err) => {
        this.showNotification('Failed to load document.', 'error');
        this.closeDocModal();
      }
    });
  }

  closeDocModal(): void {
    this.showDocModal.set(false);
    this.docBlobUrl.set(null);
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification.set({ show: true, message, type });
    setTimeout(() => {
      this.notification.set({ show: false, message: '', type: 'success' });
    }, 3000);
  }

  verifyCustomer(applicationId: number): void {
    this.isVerifying.set(true);
    this.showVerifyModal.set(true);
    this.apiService.verifyApplication(applicationId).subscribe({
      next: (data) => {
        this.verificationResult.set(data);
        this.isVerifying.set(false);
      },
      error: (err) => {
        this.showNotification(err.error?.message || 'Verification failed', 'error');
        this.closeVerifyModal();
      }
    });
  }

  closeVerifyModal(): void {
    this.showVerifyModal.set(false);
    this.verificationResult.set(null);
    this.isVerifying.set(false);
  }

  approveFromVerification(): void {
    const appId = this.verificationResult()?.applicationId;
    if (appId) {
      this.closeVerifyModal();
      this.approveApplication(appId);
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
