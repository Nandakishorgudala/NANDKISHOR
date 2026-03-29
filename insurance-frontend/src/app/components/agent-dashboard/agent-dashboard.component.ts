import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AgentService, AgentPerformance, CommissionBreakdown, TaskSummary, ClaimsSummary, FunnelData, TopCustomer, RiskBubble, BranchPerformance } from '../../services/agent.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SidebarComponent } from '../shared/sidebar.component';
import { KpiCardComponent } from '../shared/kpi-card/kpi-card.component';
import { ChartPerformanceComponent } from './charts/chart-performance.component';
import { ChartCommissionComponent } from './charts/chart-commission.component';
import { ChartTasksSlaComponent } from './charts/chart-tasks-sla.component';
import { ChartClaimsAgentComponent } from './charts/chart-claims-agent.component';
import { ChartFunnelComponent } from './charts/chart-funnel.component';
import { ChartTopCustomersComponent } from './charts/chart-top-customers.component';
import { ChartPortfolioBubbleComponent } from './charts/chart-portfolio-bubble.component';
import { ChartBranchPerformanceComponent } from './charts/chart-branch-performance.component';
import { InvoiceListComponent } from '../shared/invoices/invoice-list.component';
import { InvoiceService } from '../../services/invoice.service';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    SidebarComponent, 
    KpiCardComponent,
    ChartPerformanceComponent,
    ChartCommissionComponent,
    ChartTasksSlaComponent,
    ChartClaimsAgentComponent,
    ChartFunnelComponent,
    ChartTopCustomersComponent,
    ChartPortfolioBubbleComponent,
    ChartBranchPerformanceComponent,
    InvoiceListComponent
  ],
  template: `
    <div class="dashboard-wrapper" [class.dark-mode]="isDarkMode()">
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

      <main class="main-content" [style.margin-left.px]="contentMargin()">
        <!-- Toast Notification -->
        @if (notification().show) {
          <div class="toast-notification" [class]="notification().type">
            <span class="material-icons">{{ notification().type === 'success' ? 'check_circle' : 'error' }}</span>
            <span>{{ notification().message }}</span>
          </div>
        }

        <header class="dashboard-header">
          <div class="header-content">
            <h1 class="greeting">Welcome back, {{ agentName().split(' ')[0] }}! 👋</h1>
            <p class="subtitle">{{ getPageSubtitle() }}</p>
          </div>
          <div class="header-actions">
            @if (activeTab() === 'insights') {
              <div class="date-range-picker">
                <span class="material-icons">calendar_month</span>
                <span>Last 30 Days</span>
                <span class="material-icons">expand_more</span>
              </div>
            }
            <button class="theme-toggle" (click)="toggleDarkMode()">
              <span class="material-icons">{{ isDarkMode() ? 'light_mode' : 'dark_mode' }}</span>
            </button>
            <button class="export-all" (click)="exportAll()">
              <span class="material-icons">file_download</span>
              <span>Export Reports</span>
            </button>
          </div>
        </header>

        <!-- Insights Tab (Analytics) -->
        @if (activeTab() === 'insights') {
          <section class="kpi-section">
            <app-kpi-card 
              label="Total Premiums" 
              [value]="'₹' + (totalPremium().toLocaleString())" 
              subtitle="MTD vs Target: 85%"
              icon="payments"
              [trend]="12.5"
              color="#3B82F6">
            </app-kpi-card>
            
            <app-kpi-card 
              label="Policies Issued" 
              value="128" 
              subtitle="12 Pending approval"
              icon="description"
              [trend]="8.2"
              color="#A855F7">
            </app-kpi-card>

            <app-kpi-card 
              label="Est. Commission" 
              [value]="'₹' + (totalCommission().toLocaleString())" 
              subtitle="Scheduled payout: Apr 5"
              icon="token"
              [trend]="-2.4"
              color="#10B981">
            </app-kpi-card>

            <app-kpi-card 
              label="Claims Ratio" 
              value="4.2%" 
              subtitle="Industry avg: 5.1%"
              icon="analytics"
              [trend]="0.5"
              color="#EF4444">
            </app-kpi-card>
          </section>

          <section class="charts-grid">
            <div class="grid-item span-2">
              <app-chart-performance [data]="performanceData()"></app-chart-performance>
            </div>
            <div class="grid-item">
              <app-chart-commission [data]="commissionData()"></app-chart-commission>
            </div>
            <div class="grid-item">
              <app-chart-tasks-sla [data]="taskData()"></app-chart-tasks-sla>
            </div>
            <div class="grid-item">
              <app-chart-funnel [data]="funnelData()"></app-chart-funnel>
            </div>
            <div class="grid-item">
              <app-chart-claims-agent [data]="claimsData()"></app-chart-claims-agent>
            </div>
            <div class="grid-item">
              <app-chart-top-customers [data]="topCustomers()"></app-chart-top-customers>
            </div>
            <div class="grid-item">
              <app-chart-portfolio-bubble [data]="riskData()"></app-chart-portfolio-bubble>
            </div>
            <div class="grid-item">
              <app-chart-branch-performance [data]="branchData()"></app-chart-branch-performance>
            </div>
          </section>
        }

        <!-- Applications Tab -->
        @if (activeTab() === 'applications') {
            <div class="header-pixel">
              <h2 class="pixel-title">Policy Applications</h2>
              <span class="count-badge">{{ applications().length }} Total</span>
            </div>
            
            @if (applications().length === 0) {
              <div class="empty-state-pixel">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity: 0.2; margin-bottom: 16px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <p>No applications assigned yet</p>
              </div>
            } @else {
              <div class="list-container-pixel">
                @for (app of applications(); track app.id) {
                  <div class="list-item-card-pixel flex-column">
                    <div class="card-top-row">
                      <div class="item-info-left">
                        <div class="id-badge">#{{ app.id }}</div>
                        <h3>Customer ID: {{ app.customerId }}</h3>
                        <span class="status-pill" [ngClass]="{
                          'purple': app.status === 'Approved',
                          'grey': app.status === 'Pending' || app.status === 'Assigned',
                          'orange': app.status === 'UnderReview',
                          'red': app.status === 'Rejected'
                        }">{{ app.status }}</span>
                      </div>
                      <div class="item-actions-pixel">
                        @if (app.documentId) {
                          <button (click)="verifyCustomer(app.id)" class="btn-icon-pixel purple-btn" title="Verify Identity">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                            <span>Verify</span>
                          </button>
                          <button (click)="viewDocument(app)" class="btn-icon-pixel" title="View Document">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                            <span>View Doc</span>
                          </button>
                        }
                        @if (app.status === 'Pending' || app.status === 'Assigned') {
                          <button (click)="approveApplication(app.id)" class="btn-action-pixel success">Approve</button>
                          <button (click)="openRejectModal(app.id)" class="btn-action-pixel danger">Reject</button>
                        } @else if (app.status === 'Approved') {
                          <button (click)="viewInvoiceForRelated('PolicyApplication', app.id)" class="btn-icon-pixel purple-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            <span>Invoice</span>
                          </button>
                        }
                      </div>
                    </div>
                    
                    <div class="metrics-grid-pixel">
                      <div class="metric-item-pixel">
                        <div class="metric-icon purple-soft">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        </div>
                        <div>
                          <span class="metric-label">Asset</span>
                          <span class="metric-value">{{ app.assetType }} (₹{{ app.assetValue.toLocaleString() }})</span>
                        </div>
                      </div>
                      <div class="metric-item-pixel">
                        <div class="metric-icon purple-soft">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        </div>
                        <div>
                          <span class="metric-label">Coverage</span>
                          <span class="metric-value">₹{{ app.coverageAmount.toLocaleString() }}</span>
                        </div>
                      </div>
                      <div class="metric-item-pixel">
                        <div class="metric-icon purple-soft">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        </div>
                        <div>
                          <span class="metric-label">Premium</span>
                          <span class="metric-value premium-text">₹{{ app.calculatedPremium.toLocaleString() }}</span>
                        </div>
                      </div>
                      <div class="metric-item-pixel">
                        <div class="metric-icon" [ngClass]="app.riskScore > 70 ? 'red-soft' : app.riskScore > 40 ? 'amber-soft' : 'green-soft'">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                        </div>
                        <div>
                          <span class="metric-label">Risk Score</span>
                          <span class="metric-value" [ngStyle]="{'color': app.riskScore > 70 ? '#EF4444' : app.riskScore > 40 ? '#F59E0B' : '#10B981'}">
                            {{ app.riskScore }}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
        }

        <!-- Customers Tab -->
        @if (activeTab() === 'customers') {
          <div class="content-card">
            <div class="card-header">
              <h2 class="card-title">Customer Directory</h2>
              <span class="count-badge">{{ customers().length }} Customers</span>
            </div>
            
            @if (customers().length === 0) {
              <div class="empty-state">
                <span class="material-icons lg-icon">group_off</span>
                <p>No customers assigned to you yet</p>
              </div>
            } @else {
              <div class="customers-grid">
                @for (customer of customers(); track customer.id) {
                  <div class="customer-card">
                    <div class="cust-header">
                      <div class="cust-avatar">{{ customer.fullName.charAt(0) }}</div>
                      <div class="cust-info">
                        <h3 class="cust-name">{{ customer.fullName }}</h3>
                        <p class="cust-email">{{ customer.email }}</p>
                      </div>
                    </div>
                    <div class="cust-stats">
                      <div class="c-stat">
                        <span class="l">ID</span>
                        <span class="v">{{ customer.customerId }}</span>
                      </div>
                      <div class="c-stat">
                        <span class="l">Policies</span>
                        <span class="v">{{ customer.policies?.length || 0 }}</span>
                      </div>
                      <button (click)="viewCustomerInvoices(customer)" class="action-btn secondary btn-sm" style="margin-top: 10px; width: 100%; justify-content: center;">
                        <span class="material-icons" style="font-size: 16px;">receipt</span>
                        Invoices
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Invoices Tab -->
        @if (activeTab() === 'invoices') {
          <div class="content-card">
            <div class="card-header">
              <h2 class="card-title">Global Invoice Search</h2>
            </div>
            
            <div class="search-filters" style="margin-bottom: 20px; display: flex; gap: 12px;">
               <div class="form-group" style="flex: 1;">
                 <input type="text" [(ngModel)]="invoiceSearchTerm" class="form-control" placeholder="Search by Invoice # or Customer ID..." style="width: 100%; background: var(--card-bg); color: var(--text); border: 1px solid var(--border); padding: 10px; border-radius: 8px;">
               </div>
            </div>

            @if (selectedCustomerIdForInvoices()) {
               <div class="selected-context" style="margin-bottom: 12px; display: flex; align-items: center; gap: 10px; background: rgba(59, 130, 246, 0.1); padding: 10px; border-radius: 8px; border: 1px solid var(--primary);">
                 <span class="material-icons" style="color: var(--primary);">person</span>
                 <span>Viewing Invoices for Customer <strong>#{{ selectedCustomerIdForInvoices() }}</strong></span>
                 <button (click)="clearInvoiceFilter()" class="btn-icon" style="margin-left: auto;">&times;</button>
               </div>
               <app-invoice-list [customerId]="selectedCustomerIdForInvoices()!"></app-invoice-list>
            } @else {
               <div class="empty-state">
                 <span class="material-icons lg-icon">find_in_page</span>
                 <p>Select a customer from the Portfolio tab or search to view specific invoices.</p>
               </div>
            }
          </div>
        }


        <!-- Verification Modal -->
        @if (showVerifyModal()) {
          <div class="modal-overlay" (click)="closeVerifyModal()">
            <div class="modal-box verify-modal" (click)="$event.stopPropagation()">
              <header class="modal-header">
                <div class="header-content">
                  <h3 class="modal-title">🛡️ Identity Verification Report</h3>
                  <p class="modal-subtitle">Application #{{ verificationResult()?.applicationId }}</p>
                </div>
                <button (click)="closeVerifyModal()" class="close-btn">&times;</button>
              </header>
              
              <div class="modal-body custom-scrollbar">
                @if (isVerifying()) {
                  <div class="verification-loading">
                    <div class="scanning-animation">
                      <div class="scan-bar"></div>
                      <span class="material-icons doc-icon">contact_page</span>
                    </div>
                    <p class="loading-text">AI is validating identity document content...</p>
                  </div>
                } @else if (verificationResult()) {
                  <div class="verification-report">
                    <!-- Main Score -->
                    <div class="score-card-main" [ngClass]="{
                      'score-high': verificationResult().averageMatchScore >= 80,
                      'score-med': verificationResult().averageMatchScore >= 50 && verificationResult().averageMatchScore < 80,
                      'score-low': verificationResult().averageMatchScore < 50
                    }">
                      <div class="score-label">Identity Match Confidence</div>
                      <div class="score-value">{{ verificationResult().averageMatchScore }}%</div>
                      <div class="score-status">{{ verificationResult().averageMatchScore >= 80 ? 'Verified' : 'Manual Review Recommended' }}</div>
                    </div>

                    <div class="report-grid">
                      <!-- Matching Breakdown -->
                      <div class="report-section">
                        <h4 class="section-label">Identity Matching</h4>
                        <div class="match-item">
                          <span class="match-name">Name Accuracy</span>
                          <div class="match-bar-bg"><div class="match-bar" [style.width.%]="verificationResult().nameMatchScore"></div></div>
                          <span class="match-percent">{{ verificationResult().nameMatchScore }}%</span>
                        </div>
                        <div class="match-item">
                          <span class="match-name">Address Accuracy</span>
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
                            <span class="match-value-small">{{ verificationResult().extractedDOB }}</span>
                          </div>
                        }
                      </div>

                      <!-- Risk Analysis -->
                      <div class="report-section">
                        <h4 class="section-label">Risk Context</h4>
                        <div class="risk-stats">
                          <div class="risk-item">
                            <span class="risk-label">Existing Policies</span>
                            <span class="risk-val">{{ verificationResult().existingPoliciesCount }}</span>
                          </div>
                          <div class="risk-item">
                            <span class="risk-label">Risk Assessment</span>
                            <span class="status-pill" [ngClass]="{
                              'green': verificationResult().riskAssessment === 'Low',
                              'orange': verificationResult().riskAssessment === 'Medium',
                              'red': verificationResult().riskAssessment === 'High'
                            }">{{ verificationResult().riskAssessment }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Recommendation -->
                    <div class="ai-box">
                      <div class="ai-header">
                        <span class="material-icons">psychology</span>
                        <span class="ai-title">AI Recommendation</span>
                        <span class="status-pill" [ngClass]="{
                          'green': verificationResult().recommendation === 'Approve',
                          'amber': verificationResult().recommendation === 'Manual Review',
                          'red': verificationResult().recommendation === 'Reject'
                        }">{{ verificationResult().recommendation }}</span>
                      </div>
                      <p class="ai-reason">{{ verificationResult().reasoning }}</p>
                    </div>

                    <!-- OCR Text -->
                    <div class="ocr-details">
                      <h4 class="detail-title">Extracted Document Text (Raw)</h4>
                      <div class="text-snippet">{{ verificationResult().extractedText }}</div>
                    </div>
                  </div>
                }
              </div>
              
              <footer class="modal-footer">
                <button (click)="closeVerifyModal()" class="btn-cancel">Close</button>
                @if (verificationResult()?.recommendation === 'Approve') {
                  <button (click)="approveFromVerification()" class="btn-confirm success">Proceed to Approval</button>
                }
              </footer>
            </div>
          </div>
        }

      </main>

      <!-- Document Preview Modal -->
      @if (showDocModal()) {
        <div class="modal-overlay" (click)="closeDocModal()">
          <div class="modal-box doc-modal" (click)="$event.stopPropagation()">
            <header class="modal-header">
              <h3>📄 {{ docModalFileName() }}</h3>
              <button class="close-btn" (click)="closeDocModal()">&times;</button>
            </header>
            <div class="modal-body doc-preview">
              @if (docBlobUrl()) {
                @if (docIsImage()) {
                  <img [src]="docBlobUrl()" class="preview-img" />
                } @else {
                  <iframe [src]="docBlobUrl()" class="preview-iframe"></iframe>
                }
              } @else {
                <div class="loader">Loading document...</div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Reject Modal -->
      @if (showRejectModal()) {
        <div class="modal-overlay" (click)="closeRejectModal()">
          <div class="modal-box reject-modal-premium" (click)="$event.stopPropagation()">
            <header class="modal-header-reject">
              <div class="header-icon-reject"><span class="material-icons">report_gmailerrorred</span></div>
              <div class="header-text">
                <h3>Reject Application #{{ rejectingAppId() }}</h3>
                <p>Please specify why this application cannot be approved.</p>
              </div>
              <button class="close-btn-pixel" (click)="closeRejectModal()">&times;</button>
            </header>
            
            <div class="modal-body">
              <div class="form-group-premium">
                <label class="label-premium">Reason for Rejection <span class="required">*</span></label>
                <textarea 
                  [(ngModel)]="rejectionReason" 
                  class="textarea-premium" 
                  rows="5" 
                  placeholder="E.g., Invalid document, low credit score, mismatched address..."
                  maxlength="500">
                </textarea>
                <div class="textarea-footer">
                  <span class="char-count" [class.danger-text]="rejectionReason.length > 450">{{ rejectionReason.length }}/500 characters</span>
                </div>
              </div>
              
              <div class="warning-banner">
                <span class="material-icons">info</span>
                <p>This reason will be shared with the customer and cannot be changed once submitted.</p>
              </div>
            </div>
            
            <footer class="modal-footer-reject">
              <button class="btn-ghost" (click)="closeRejectModal()">Cancel</button>
              <button 
                class="btn-reject-confirm" 
                (click)="submitRejection()" 
                [disabled]="!rejectionReason.trim() || rejectionReason.length < 5">
                <span class="material-icons">gavel</span>
                Confirm Rejection
              </button>
            </footer>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { 
      --primary: #7C3AED; 
      --secondary: #A855F7; 
      --success: #10B981; 
      --danger: #EF4444; 
      --warning: #F59E0B; 
      --bg: #F8FAFC; 
      --text: #1E293B; 
      --text-muted: #64748B; 
      --card-bg: #FFFFFF; 
      --border: #F1F5F9; 
      --shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .dark-mode { --bg: #0F172A; --text: #F1F5F9; --text-muted: #94A3B8; --card-bg: #1E293B; --border: #334155; }

    .dashboard-wrapper { display: flex; min-height: 100vh; background-color: var(--bg); transition: all 0.3s ease; font-family: 'Inter', sans-serif; }
    .main-content { 
      flex: 1; padding: 48px; 
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .toast-notification { position: fixed; top: 20px; right: 20px; z-index: 2000; padding: 16px 24px; border-radius: 12px; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); color: white; }
    .toast-notification.success { background: var(--success); }
    .toast-notification.error { background: var(--danger); }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
    .greeting { font-size: 32px; font-weight: 800; color: var(--text); margin: 0; letter-spacing: -0.5px; }
    .subtitle { color: var(--text-muted); margin: 4px 0 0 0; font-size: 16px; font-weight: 500; }

    .header-actions { display: flex; gap: 16px; align-items: center; }
    .date-range-picker { background: var(--card-bg); padding: 10px 16px; border-radius: 12px; display: flex; align-items: center; gap: 8px; font-weight: 600; color: var(--text); border: 1px solid var(--border); cursor: pointer; box-shadow: var(--shadow); }
    
    .theme-toggle, .export-all { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 10px; cursor: pointer; color: var(--text); display: flex; align-items: center; gap: 8px; transition: all 0.2s; box-shadow: var(--shadow); }
    .export-all { background: var(--primary); color: white; border: none; padding: 10px 24px; font-weight: 700; }

    .kpi-section { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 32px; }
    .charts-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .grid-item { min-height: 350px; }
    .span-2 { grid-column: span 2; }

    /* Unified Pixel UI Elements */
    .header-pixel { margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center; }
    .pixel-title { font-size: 24px; font-weight: 800; color: var(--text); margin: 0; }
    .count-badge { background: #EDE9FE; color: var(--primary); padding: 6px 16px; border-radius: 999px; font-size: 14px; font-weight: 700; }

    .list-container-pixel { display: flex; flex-direction: column; gap: 20px; }
    .list-item-card-pixel { 
      background: white; border-radius: 20px; border: 1px solid var(--border); padding: 32px; 
      display: flex; flex-direction: column; gap: 24px; box-shadow: var(--shadow);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .list-item-card-pixel:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    .card-top-row { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .item-info-left { display: flex; align-items: center; gap: 20px; }
    .id-badge { background: #F3F4F6; color: #6B7280; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; }
    .item-info-left h3 { font-size: 20px; font-weight: 700; color: var(--text); margin: 0; }

    .status-pill { padding: 6px 20px; border-radius: 99px; font-size: 13px; font-weight: 700; line-height: 1; }
    .status-pill.purple { background: #EDE9FE; color: var(--primary); }
    .status-pill.grey { background: #F1F5F9; color: #475569; }
    .status-pill.orange { background: #FFF7ED; color: #EA580C; }
    .status-pill.red { background: #FEF2F2; color: #EF4444; }

    .item-actions-pixel { display: flex; gap: 12px; }
    .btn-action-pixel { padding: 10px 20px; border-radius: 12px; border: none; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; }
    .btn-action-pixel.success { background: #10B981; color: white; }
    .btn-action-pixel.danger { background: #EF4444; color: white; }
    
    .btn-icon-pixel { 
      display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 12px; 
      background: #F8FAFC; border: 1px solid #E2E8F0; color: #475569; font-size: 14px; font-weight: 600; cursor: pointer;
    }
    .btn-icon-pixel.purple-btn { background: #EDE9FE; border-color: #DDD6FE; color: var(--primary); }

    .metrics-grid-pixel { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; border-top: 1px solid #F3F4F6; pt: 24px; margin-top: 4px; padding-top: 24px; }
    .metric-item-pixel { display: flex; align-items: center; gap: 16px; }
    .metric-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .metric-label { display: block; font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
    .metric-value { font-size: 15px; font-weight: 700; color: var(--text); }
    .premium-text { color: var(--primary); }

    .purple-soft { background: #F5F3FF; color: var(--primary); }
    .amber-soft { background: #FFF7ED; color: #EA580C; }
    .green-soft { background: #F0FDF4; color: #16A34A; }
    .red-soft { background: #FEF2F2; color: #EF4444; }

    .empty-state-pixel { padding: 80px; text-align: center; color: var(--text-muted); font-weight: 600; border: 2px dashed #E2E8F0; border-radius: 24px; background: white; }

    .customers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .customer-card { background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 16px; padding: 20px; }
    .cust-header { display: flex; gap: 16px; align-items: center; margin-bottom: 16px; }
    .cust-avatar { width: 48px; height: 48px; background: var(--secondary); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; }
    .cust-name { font-size: 16px; margin: 0; }
    .cust-email { font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0; }
    .cust-stats { display: flex; justify-content: space-around; border-top: 1px solid var(--border); pt: 12px; mt: 12px;}
    .c-stat { display: flex; flex-direction: column; align-items: center; }
    .l { font-size: 10px; color: var(--text-muted); text-transform: uppercase; }
    .v { font-weight: 700; }

    .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
    .product-card { background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 20px; padding: 32px 24px; text-align: center; }
    .p-icon { font-size: 48px; margin-bottom: 20px; }
    .p-name { font-size: 20px; margin: 0 0 12px 0; }
    .p-desc { font-size: 14px; color: var(--text-muted); margin-bottom: 24px; }
    .p-price { background: rgba(255,255,255,0.05); padding: 16px; border-radius: 12px; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 3000; }
    .modal-box { background: var(--bg); border: 1px solid var(--border); border-radius: 20px; width: 500px; max-width: 90vw; color: var(--text); }
    .modal-box.doc-modal { width: 900px; height: 85vh; display: flex; flex-direction: column; }
    .modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .modal-body { padding: 24px; flex: 1; overflow-y: auto; }
    .doc-preview { background: #1e293b; padding: 0; display: flex; justify-content: center; align-items: center; }
    .preview-img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .preview-iframe { width: 100%; height: 100%; border: none; }

    .badge { padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge.pending { background: #FEF3C7; color: #92400E; }
    .badge.approved { background: #D1FAE5; color: #065F46; }
    .badge.rejected { background: #FEE2E2; color: #991B1B; }

    /* Rejection Modal Premium */
    .reject-modal-premium { 
      background: white; border-radius: 24px; width: 550px; 
      box-shadow: 0 25px 50px -12px rgba(239, 68, 68, 0.15); border: 1px solid #FEE2E2;
      overflow: hidden;
    }
    .modal-header-reject { padding: 32px; background: #FEF2F2; display: flex; align-items: flex-start; gap: 20px; position: relative; }
    .header-icon-reject { width: 56px; height: 56px; background: #EF4444; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 8px 16px rgba(239, 68, 68, 0.2); }
    .header-text h3 { font-size: 20px; font-weight: 800; color: #991B1B; margin: 0; }
    .header-text p { font-size: 14px; color: #EF4444; opacity: 0.8; margin: 4px 0 0 0; font-weight: 500; }
    .close-btn-pixel { position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 24px; color: #991B1B; cursor: pointer; opacity: 0.5; transition: opacity 0.2s; }
    .close-btn-pixel:hover { opacity: 1; }

    .form-group-premium { margin-bottom: 24px; }
    .label-premium { font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 8px; display: block; }
    .label-premium .required { color: #EF4444; }
    
    .textarea-premium { 
      width: 100%; background: #F9FAFB; border: 2px solid #F3F4F6; border-radius: 16px; padding: 16px; 
      font-size: 15px; color: #1F2937; transition: all 0.2s; font-family: inherit; line-height: 1.5;
    }
    .textarea-premium:focus { outline: none; border-color: #FCA5A5; background: white; box-shadow: 0 0 0 4px rgba(254, 202, 202, 0.2); }
    .textarea-footer { display: flex; justify-content: flex-end; margin-top: 8px; }
    .char-count { font-size: 12px; color: #9CA3AF; font-weight: 600; }
    .danger-text { color: #EF4444; }

    .warning-banner { background: #FFF7ED; padding: 16px; border-radius: 12px; display: flex; gap: 12px; align-items: flex-start; border: 1px solid #FFEDD5; }
    .warning-banner .material-icons { color: #EA580C; font-size: 20px; }
    .warning-banner p { font-size: 13px; color: #9A3412; margin: 0; font-weight: 500; line-height: 1.4; }

    .modal-footer-reject { padding: 24px 32px; background: #F9FAFB; display: flex; justify-content: flex-end; gap: 16px; border-top: 1px solid #F3F4F6; }
    .btn-ghost { background: transparent; border: none; color: #6B7280; font-weight: 700; cursor: pointer; padding: 12px 24px; border-radius: 12px; transition: background 0.2s; }
    .btn-ghost:hover { background: #F3F4F6; color: #374151; }
    
    .btn-reject-confirm { 
      background: #EF4444; color: white; border: none; padding: 12px 28px; border-radius: 12px; 
      font-weight: 700; font-size: 15px; cursor: pointer; display: flex; align-items: center; gap: 10px;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); transition: all 0.2s;
    }
    .btn-reject-confirm:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3); background: #DC2626; }
    .btn-reject-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

    .empty-state { text-align: center; padding: 60px; color: var(--text-muted); }
    .lg-icon { font-size: 64px; opacity: 0.3; margin-bottom: 16px; }

    /* Verification Modal & Scanners */
    .verify-modal { width: 750px !important; max-height: 90vh; }
    .modal-subtitle { font-size: 13px; color: var(--text-muted); margin: 4px 0 0 0; }
    
    .verification-loading { padding: 60px 40px; text-align: center; }
    .scanning-animation { position: relative; width: 80px; height: 100px; background: var(--bg); margin: 0 auto 24px; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid var(--border); }
    .doc-icon { font-size: 40px; color: var(--primary); }
    .scan-bar { position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: var(--primary); box-shadow: 0 0 15px var(--primary); animation: scan 2s ease-in-out infinite; }
    @keyframes scan { 0%, 100% { top: 0; } 50% { top: 96%; } }
    .loading-text { color: var(--primary); font-weight: 600; letter-spacing: 0.5px; margin-top: 16px; }

    .score-card-main { padding: 32px; border-radius: 20px; text-align: center; margin-bottom: 24px; color: white; }
    .score-high { background: linear-gradient(135deg, #10B981 0%, #059669 100%); }
    .score-med { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); }
    .score-low { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); }
    .score-label { font-size: 13px; opacity: 0.9; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; }
    .score-value { font-size: 52px; font-weight: 800; margin: 8px 0; }
    .score-status { font-size: 15px; font-weight: 600; background: rgba(255,255,255,0.2); display: inline-block; padding: 4px 16px; border-radius: 99px; }

    .report-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; margin-bottom: 24px; }
    .report-section { background: rgba(0,0,0,0.02); padding: 24px; border-radius: 16px; border: 1px solid var(--border); }
    .section-label { font-size: 14px; font-weight: 800; color: var(--text); margin: 0 0 20px 0; border-left: 4px solid var(--primary); padding-left: 12px; }

    .match-item { margin-bottom: 16px; }
    .match-name { font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 6px; font-weight: 600; }
    .match-bar-bg { height: 8px; background: var(--border); border-radius: 4px; width: 120px; display: inline-block; margin: 0 12px; vertical-align: middle; }
    .match-bar { height: 100%; background: var(--primary); border-radius: 4px; }
    .match-percent { font-size: 13px; font-weight: 800; color: var(--text); }
    .match-value-small { font-size: 14px; font-weight: 700; color: var(--text); }

    .ai-box { background: rgba(124, 58, 237, 0.08); padding: 24px; border-radius: 16px; border: 1px solid rgba(124, 58, 237, 0.2); margin-bottom: 24px; }
    .ai-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .ai-title { font-weight: 800; color: var(--primary); flex: 1; }
    .ai-reason { font-size: 14px; color: var(--text); line-height: 1.6; margin: 0; }

    .ocr-details { }
    .detail-title { font-size: 13px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px; }
    .text-snippet { font-family: 'Courier New', monospace; font-size: 11px; color: var(--text-muted); background: var(--border); padding: 16px; border-radius: 12px; max-height: 120px; overflow-y: auto; line-height: 1.4; }

    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
    
    .status-pill.green { background: #D1FAE5; color: #065F46; }
    .status-pill.amber { background: #FEF3C7; color: #92400E; }

    @media (max-width: 1200px) { .charts-grid { grid-template-columns: repeat(2, 1fr); } .span-2 { grid-column: span 2; } }
    @media (max-width: 768px) { .charts-grid { grid-template-columns: 1fr; } .span-2 { grid-column: span 1; } }
  `]
})
export class AgentDashboardComponent implements OnInit {
  // Services
  private agentService = inject(AgentService);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private sanitizer = inject(DomSanitizer);
  private invoiceService = inject(InvoiceService);

  // Status & UI Signals
  agentName = signal('Agent Name');
  activeTab = signal('insights');
  isSidebarCollapsed = signal(false);
  isDarkMode = signal(false);
  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  contentMargin = computed(() => this.isSidebarCollapsed() ? 80 : 250);

  // Dashboard Metrics Signals
  performanceData = signal<AgentPerformance | undefined>(undefined);
  commissionData = signal<CommissionBreakdown | undefined>(undefined);
  taskData = signal<TaskSummary | undefined>(undefined);
  claimsData = signal<ClaimsSummary | undefined>(undefined);
  funnelData = signal<FunnelData | undefined>(undefined);
  topCustomers = signal<TopCustomer[]>([]);
  riskData = signal<RiskBubble[]>([]);
  branchData = signal<BranchPerformance | undefined>(undefined);

  // Legacy Data Signals
  applications = signal<any[]>([]);
  customers = signal<any[]>([]);
  policyProducts = signal<any[]>([]);

  // Modal Signals
  showDocModal = signal(false);
  docBlobUrl = signal<SafeResourceUrl | null>(null);
  docModalFileName = signal<string>('');
  docIsImage = signal(false);
  showRejectModal = signal(false);
  rejectingAppId = signal<number | null>(null);
  rejectionReason: string = '';
  
  // Invoice Signals
  selectedCustomerIdForInvoices = signal<number | null>(null);
  invoiceSearchTerm: string = '';
  
  // Verification Signals
  showVerifyModal = signal(false);
  isVerifying = signal(false);
  verificationResult = signal<any>(null);

  // Computed Values
  totalPremium = computed(() => this.performanceData()?.premiums.reduce((a, b) => a + b, 0) || 0);
  totalCommission = computed(() => this.commissionData()?.totalCommission || 0);

  sidebarItems: any[] = [
    { id: 'insights', label: 'Performance Insights', icon: 'auto_graph' },
    { id: 'applications', label: 'Policy Applications', icon: 'description' },
    { id: 'customers', label: 'Customer Portfolio', icon: 'people' },
    { id: 'invoices', label: 'Invoices', icon: 'receipt' }
  ];

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.agentName.set(user.fullName);
      const agentId = user.agentId || user.id;
      this.loadDashboardData(agentId);
      this.loadLegacyData();
    }
  }

  loadDashboardData(agentId: number) {
    this.agentService.getPerformance(agentId).subscribe(data => this.performanceData.set(data));
    this.agentService.getCommissionBreakdown(agentId).subscribe(data => this.commissionData.set(data));
    this.agentService.getTasksSummary(agentId).subscribe(data => this.taskData.set(data));
    this.agentService.getClaimsSummary(agentId).subscribe(data => this.claimsData.set(data));
    this.agentService.getFunnel(agentId).subscribe(data => this.funnelData.set(data));
    this.agentService.getTopCustomers(agentId).subscribe(data => this.topCustomers.set(data));
    this.agentService.getPortfolioRisk(agentId).subscribe(data => this.riskData.set(data));
    this.agentService.getBranchesPerformance(agentId).subscribe(data => this.branchData.set(data));
  }

  loadLegacyData() {
    this.apiService.getAgentApplications().subscribe(data => this.applications.set(data));
    this.apiService.getAgentCustomers().subscribe(data => this.customers.set(data));
    this.apiService.getAllPolicyProducts().subscribe(data => this.policyProducts.set(data));
  }

  getPageSubtitle(): string {
    const subtitles: any = {
      insights: "Real-time performance analytics and portfolio health.",
      applications: "Review and manage pending policy applications.",
      customers: "Manage your client relationships and policies.",
      invoices: "Search and track customer invoices and payments.",
      browse: "Explore and compare the latest insurance products."
    };
    return subtitles[this.activeTab()] || "";
  }

  onTabChange(tabId: string) {
    this.activeTab.set(tabId);
  }

  toggleDarkMode() {
    this.isDarkMode.set(!this.isDarkMode());
  }

  showNotification(message: string, type: 'success' | 'error') {
    this.notification.set({ show: true, message, type });
    setTimeout(() => this.notification.set({ show: false, message: '', type: 'success' }), 3000);
  }

  // Application Actions
  approveApplication(id: number) {
    if (!confirm('Approve this application?')) return;
    this.apiService.approveApplication(id).subscribe({
      next: () => {
        this.showNotification('Application approved!', 'success');
        this.loadLegacyData();
      },
      error: (err) => this.showNotification(err.error?.message || 'Failed to approve', 'error')
    });
  }

  openRejectModal(id: number) {
    this.rejectingAppId.set(id);
    this.rejectionReason = '';
    this.showRejectModal.set(true);
  }

  closeRejectModal() {
    this.showRejectModal.set(false);
  }

  submitRejection() {
    const id = this.rejectingAppId();
    if (!id || !this.rejectionReason.trim()) return;
    this.apiService.rejectApplication(id, this.rejectionReason).subscribe({
      next: () => {
        this.showNotification('Application rejected', 'success');
        this.closeRejectModal();
        this.loadLegacyData();
      },
      error: (err) => this.showNotification(err.error?.message || 'Failed to reject', 'error')
    });
  }

  // Document Management
  viewDocument(app: any) {
    if (!app.documentId) return;
    this.docModalFileName.set(app.documentFileName || `Doc #${app.documentId}`);
    this.docIsImage.set(app.documentContentType?.startsWith('image/') || false);
    this.showDocModal.set(true);
    this.docBlobUrl.set(null);
    this.apiService.fetchDocumentBlob(app.documentId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.docBlobUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      },
      error: () => {
        this.showNotification('Failed to load document', 'error');
        this.closeDocModal();
      }
    });
  }

  closeDocModal() {
    this.showDocModal.set(false);
    this.docBlobUrl.set(null);
  }

  // Verification Methods
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

  getPolicyIcon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('home')) return '🏠';
    if (n.includes('car')) return '🚗';
    if (n.includes('health')) return '🏥';
    return '🛡️';
  }

  viewCustomerInvoices(customer: any) {
    this.selectedCustomerIdForInvoices.set(customer.customerId || customer.id);
    this.activeTab.set('invoices');
  }

  clearInvoiceFilter() {
    this.selectedCustomerIdForInvoices.set(null);
  }

  exportAll() { window.print(); }

  viewInvoiceForRelated(type: string, relatedId: number): void {
    this.invoiceService.getInvoiceByRelatedId(type, relatedId).subscribe({
      next: (invoice: any) => {
        if (invoice && (invoice.id || invoice.Id)) {
          this.invoiceService.viewPdf(invoice.id || invoice.Id);
        } else {
          this.showNotification('Invoice not found or still being generated.', 'error');
        }
      },
      error: () => this.showNotification('Could not find invoice for this item.', 'error')
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
