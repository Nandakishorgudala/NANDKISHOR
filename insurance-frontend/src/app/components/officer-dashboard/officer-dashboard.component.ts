import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SidebarComponent, SidebarItem } from '../shared/sidebar.component';
import { InvoiceListComponent } from '../shared/invoices/invoice-list.component';
import { InvoiceService } from '../../services/invoice.service';

@Component({
  selector: 'app-officer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, InvoiceListComponent],
  template: `
    <div class="dashboard-container">
      <app-sidebar
        [userName]="officerName()"
        [userRole]="'Claims Officer'"
        [items]="sidebarItems"
        [activeItem]="activeTab()"
        (itemClick)="onTabChange($event)"
        (toggle)="isSidebarCollapsed.set($event)"
        (logout)="logout()">
      </app-sidebar>

      <div class="main-content" [style.margin-left]="contentMargin()">
        <div class="content-header">
          <h1 class="page-title">{{ getPageTitle() }}</h1>
        </div>

        @if (notification().show) {
          <div class="toast-pixel" [class.success]="notification().type === 'success'" [class.error]="notification().type === 'error'">
            <span class="toast-icon">{{ notification().type === 'success' ? '✓' : '✗' }}</span>
            <span>{{ notification().message }}</span>
          </div>
        }

        <div class="content-body">
          <div class="stats-grid-pixel">
            <div class="stat-card-pixel">
              <div class="stat-icon-pixel purple-soft">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <div class="stat-info-pixel">
                <span class="stat-label-pixel">Total Assigned</span>
                <span class="stat-value-pixel">{{ assignedClaims().length }}</span>
              </div>
            </div>
            <div class="stat-card-pixel">
              <div class="stat-icon-pixel amber-soft">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <div class="stat-info-pixel">
                <span class="stat-label-pixel">Under Review</span>
                <span class="stat-value-pixel">{{ getCountByStatus('UnderReview') }}</span>
              </div>
            </div>
            <div class="stat-card-pixel">
              <div class="stat-icon-pixel emerald-soft">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div class="stat-info-pixel">
                <span class="stat-label-pixel">Approved</span>
                <span class="stat-value-pixel">{{ getCountByStatus('Approved') }}</span>
              </div>
            </div>
            <div class="stat-card-pixel">
              <div class="stat-icon-pixel rose-soft">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </div>
              <div class="stat-info-pixel">
                <span class="stat-label-pixel">Rejected</span>
                <span class="stat-value-pixel">{{ getCountByStatus('Rejected') }}</span>
              </div>
            </div>
          </div>

          <div class="card-pixel">
            <h2 class="card-title-pixel">Assigned Claims</h2>
            
            @if (assignedClaims().length === 0) {
              <div class="empty-state-pixel">
                <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
                No claims assigned to you yet.
              </div>
            } @else {
              <div class="list-container-pixel">
                @for (claim of assignedClaims(); track claim.id) {
                  <div class="claim-item-pixel">
                    <div class="item-header-pixel">
                      <div class="item-identity">
                        <span class="id-tag">CLAIM #{{ claim.id }}</span>
                        <div>
                          <h3 class="item-title">{{ claim.policyName }}</h3>
                          <p class="item-subtitle">Policy Number: {{ claim.policyNumber }}</p>
                        </div>
                      </div>
                      <span class="status-pill" [class]="'pill-' + claim.status.toLowerCase()">
                        {{ claim.status }}
                      </span>
                    </div>

                    <div class="metrics-row-pixel">
                      <div class="metric-pixel">
                        <span class="m-label">Incident Date</span>
                        <div class="flex-row-center">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          <span class="m-value">{{ claim.incidentDate | date:'mediumDate' }}</span>
                        </div>
                      </div>
                      <div class="metric-pixel">
                        <span class="m-label">Claimed Amount</span>
                        <div class="flex-row-center">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                          <span class="m-value price">₹{{ claim.claimedAmount.toLocaleString() }}</span>
                        </div>
                      </div>
                      <div class="metric-pixel">
                        <span class="m-label">Location</span>
                        <div class="flex-row-center">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          <span class="m-value">{{ claim.incidentLocation }}</span>
                        </div>
                      </div>
                      <div class="metric-pixel">
                        <span class="m-label">Zip Code</span>
                        <div class="flex-row-center">
                          <span class="m-value" style="color: #64748b;">📍 {{ claim.incidentZipCode }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="desc-block-pixel">
                      <span class="m-label" style="display: block; margin-bottom: 8px;">Incident Description</span>
                      <p class="desc-text">{{ claim.incidentDescription }}</p>
                    </div>

                    @if (claim.documentId) {
                      <div style="display: flex; gap: 12px;">
                        <button (click)="viewProof(claim.documentId)" class="btn-pixel secondary">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                          View Attached Proof
                        </button>
                      </div>
                    }

                      <div style="display: flex; gap: 12px; margin-bottom: 8px;">
                        <button (click)="analyzeClaim(claim.id)" class="btn-pixel purple-btn" style="padding: 10px 20px;">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                          AI Analyze Claim
                        </button>
                        <button (click)="startReview(claim)" class="btn-pixel primary" style="padding: 10px 20px;">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                          Start Official Review
                        </button>
                      </div>

                    @if (claim.status === 'UnderReview') {
                      <div class="review-panel-pixel">
                        <h4 class="review-h">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                          Disaster Risk AI Insights
                        </h4>
                        <div class="risk-grid-pixel">
                          <div class="risk-box-pixel">
                            <span class="m-label">Fraud Risk</span>
                            <span class="risk-score-val" [style.color]="claim.fraudRiskScore > 50 ? 'var(--danger)' : 'var(--success)'">
                              {{ claim.fraudRiskScore }}%
                            </span>
                            <div class="risk-bar">
                              <div class="risk-fill" [style.width.%]="claim.fraudRiskScore" 
                                   [style.background]="claim.fraudRiskScore > 50 ? 'var(--danger)' : 'var(--success)'"></div>
                            </div>
                          </div>
                          <div class="risk-box-pixel" style="background: #f0f9ff;">
                            <span class="m-label">Impact Score</span>
                            <span class="risk-score-val" style="color: #0369a1">{{ (claim.disasterImpactScore * 100).toFixed(0) }}%</span>
                            <small style="color: #0369a1; font-weight: 600;">Area: {{ claim.incidentZipCode }}</small>
                          </div>
                          <div class="risk-box-pixel" style="background: #f5f3ff;">
                            <span class="m-label">Regional Pulse</span>
                            <span class="risk-score-val" style="color: #6d28d9">{{ claim.regionalClaimCount }}</span>
                            <small style="color: #6d28d9; font-weight: 600;">Similar Zip Claims</small>
                          </div>
                        </div>

                        <h4 class="review-h" style="margin-top: 32px;">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
                          Smart Loss Adjuster
                        </h4>
                        <form (ngSubmit)="approveClaim(claim.id)" class="review-form">
                          <div class="form-grid">
                            <div class="metric-pixel">
                              <label class="m-label">Damage Severity ({{ reviewData[claim.id].propertyLoss }}%)</label>
                              <input type="range" [(ngModel)]="reviewData[claim.id].propertyLoss" 
                                name="propertyLoss{{claim.id}}" min="0" max="100" step="5"
                                (input)="onCalculatorChange(claim.id, claim.claimedAmount)"
                                style="accent-color: var(--primary); height: 8px; cursor: pointer;">
                            </div>
                            <div class="metric-pixel">
                              <label class="m-label">Local Severity Index (0-1)</label>
                              <input type="number" [(ngModel)]="reviewData[claim.id].disasterImpact" 
                                name="disasterImpact{{claim.id}}" min="0" max="1" step="0.1"
                                (input)="onCalculatorChange(claim.id, claim.claimedAmount)"
                                class="input-pixel">
                            </div>
                            <div class="calc-box-pixel" style="grid-column: span 2;">
                              <span class="calc-label">Suggested Payout Based on AI Analysis</span>
                              <span class="calc-val">₹{{ (reviewData[claim.id].suggestedPayout || 0).toLocaleString() }}</span>
                            </div>
                            <div class="metric-pixel" style="grid-column: span 2;">
                              <label class="m-label">Final Approved Payout *</label>
                              <input type="number" [(ngModel)]="reviewData[claim.id].approvedAmount" 
                                name="approvedAmount{{claim.id}}" required
                                [max]="claim.claimedAmount" min="1"
                                class="input-pixel" style="border-width: 2px; border-color: var(--primary); font-size: 20px;">
                              <small style="margin-top: 4px; color: var(--text-muted);">Max Claimable: ₹{{ claim.claimedAmount.toLocaleString() }}</small>
                            </div>
                            <div class="metric-pixel" style="grid-column: span 2;">
                              <label class="m-label">Official Review Notes *</label>
                              <textarea [(ngModel)]="reviewData[claim.id].reviewNotes" 
                                name="reviewNotes{{claim.id}}" rows="3" minlength="10" required
                                placeholder="Explain the rationale for this adjustment..."
                                class="input-pixel" style="resize: none;"></textarea>
                            </div>
                          </div>
                          <div style="display: flex; gap: 16px; margin-top: 24px;">
                            <button type="submit" class="btn-pixel success">
                              Approve Payout
                            </button>
                            <button type="button" (click)="rejectClaim(claim.id)" class="btn-pixel danger">
                              Reject Claim
                            </button>
                          </div>
                        </form>
                      </div>
                    }

                    @if (claim.status === 'Approved' || claim.status === 'Settled') {
                      <div class="review-panel-pixel emerald-soft" style="border: none; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                          <span class="m-label">Final Payout Confirmed</span>
                          <h4 style="margin: 4px 0 0 0; font-size: 24px;">₹{{ claim.approvedAmount.toLocaleString() }}</h4>
                        </div>
                        <button (click)="viewInvoiceForRelated('Claim', claim.id)" class="btn-pixel secondary">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2L18 4l-2-2-2 2-2-2-2 2-2-2-2 2Z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>
                          View Invoice
                        </button>
                      </div>
                    }

                    @if (claim.status === 'Rejected') {
                      <div class="review-panel-pixel rose-soft" style="border: none;">
                        <span class="m-label">Claim Rejected</span>
                        <p style="margin: 8px 0 0 0; font-weight: 700;">Reason: {{ claim.reviewNotes }}</p>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>

          @if (activeTab() === 'invoices') {
            <div class="card-pixel">
              <h2 class="card-title-pixel">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 8px;" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2L18 4l-2-2-2 2-2-2-2 2-2-2-2 2Z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>
                Customer Invoices
              </h2>
              
              <div style="margin-bottom: 32px; background: #f8fafc; padding: 24px; border-radius: 16px;">
                <label class="m-label" style="display: block; margin-bottom: 12px;">Search by Customer ID</label>
                <div style="display: flex; gap: 12px;">
                  <input type="text" [(ngModel)]="officerInvoiceSearch" class="input-pixel" placeholder="Enter ID (e.g. 101)..." style="max-width: 400px;">
                </div>
              </div>

              @if (officerInvoiceSearch) {
                <app-invoice-list [customerId]="+officerInvoiceSearch"></app-invoice-list>
              } @else {
                <div class="empty-state-pixel">
                  Search for a customer to manage their claim invoices.
                </div>
              }
            </div>
          }

          @if (documentViewer().url) {
            <div class="modal-overlay" (click)="closeDocument()">
              <div class="modal-box doc-modal" (click)="$event.stopPropagation()">
                <div class="modal-header">
                  <h3 class="pixel-title" style="font-size: 20px; display: flex; align-items: center; gap: 8px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    Document Preview
                  </h3>
                  <button class="close-btn" (click)="closeDocument()">&times;</button>
                </div>
                <div class="modal-body doc-preview">
                  @if (documentViewer().isImage) {
                    <img [src]="documentViewer().url" class="preview-img">
                  } @else {
                    <iframe [src]="documentViewer().url" class="preview-iframe" title="Document Preview"></iframe>
                  }
                </div>
              </div>
            </div>
          }

          @if (showAnalysisModal()) {
            <div class="modal-overlay" (click)="closeAnalysis()">
              <div class="modal-box analysis-modal-premium" (click)="$event.stopPropagation()">
                <div class="modal-header">
                  <div class="header-main">
                    <h3 class="pixel-title" style="font-size: 20px; color: var(--primary);">🛡️ Claim AI Analysis Report</h3>
                    <p style="font-size: 13px; color: var(--text-muted); margin: 4px 0 0 0;">Verifying Invoice #{{ analysisResult()?.claimId }}</p>
                  </div>
                  <button class="close-btn" (click)="closeAnalysis()">&times;</button>
                </div>
                
                <div class="modal-body custom-scrollbar">
                  @if (isAnalyzing()) {
                    <div class="scanner-container">
                      <div class="scanner-view">
                        <div class="scan-line"></div>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5"><path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2L18 4l-2-2-2 2-2-2-2 2-2-2-2 2Z"/></svg>
                      </div>
                      <p class="scanning-text">Analyzing Policy Invoice via AI...</p>
                    </div>
                  } @else if (analysisResult()) {
                    <div class="analysis-report">
                      <div class="rec-banner" [ngClass]="'rec-' + analysisResult().recommendation?.toLowerCase().replace(' ', '-')">
                        <span class="rec-label">AI Final Recommendation</span>
                        <h4 class="rec-value">{{ analysisResult().recommendation }}</h4>
                      </div>

                      <div class="report-grid-pixel">
                        <div class="report-item">
                          <span class="m-label">Name Match</span>
                          <div class="flex-row-center" style="gap: 8px;">
                            <span class="status-icon">{{ analysisResult().isNameMatch ? '✅' : '❌' }}</span>
                            <span class="m-value">{{ analysisResult().nameMatchScore }}%</span>
                          </div>
                        </div>
                        <div class="report-item">
                          <span class="m-label">Policy period</span>
                          <div class="flex-row-center" style="gap: 8px;">
                            <span class="status-icon">{{ analysisResult().isWithinPolicyPeriod ? '✅' : '❌' }}</span>
                            <span class="m-value">Valid tenure</span>
                          </div>
                        </div>
                        <div class="report-item" [class.danger-item]="!analysisResult().passesWaitingPeriod">
                          <span class="m-label">15-Day rule</span>
                          <div class="flex-row-center" style="gap: 8px;">
                            <span class="status-icon">{{ analysisResult().passesWaitingPeriod ? '✅' : '❌' }}</span>
                            <span class="m-value">{{ analysisResult().daysSincePolicyStart }} Days</span>
                          </div>
                        </div>
                        <div class="report-item">
                          <span class="m-label">Claim Date</span>
                          <span class="m-value">{{ analysisResult().claimDate | date:'shortDate' }}</span>
                        </div>
                      </div>

                      <div class="ai-reason-box">
                        <h5 class="reason-h">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"/></svg>
                          Analysis Rationale
                        </h5>
                        <p class="reason-text-val">{{ analysisResult().reasoning }}</p>
                      </div>

                      <div class="ocr-snippet-box">
                        <span class="m-label">Extracted Text Preview</span>
                        <div class="ocr-text-view">{{ analysisResult().extractedText }}</div>
                      </div>
                    </div>
                  }
                </div>
                <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end;">
                   <button (click)="closeAnalysis()" class="btn-pixel secondary">Close Report</button>
                </div>
              </div>
            </div>
          }
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary: #7c3aed;
      --primary-hover: #6d28d9;
      --primary-soft: #f3e8ff;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
    }

    .dashboard-container { display: flex; min-height: 100vh; background: var(--bg); font-family: 'Inter', sans-serif; }
    .main-content { flex: 1; min-width: 0; transition: margin-left 0.3s ease; display: flex; flex-direction: column; }
    .content-header { background: white; padding: 32px 40px; border-bottom: 1px solid var(--border); }
    .page-title { font-size: 32px; font-weight: 850; color: var(--text); letter-spacing: -1px; margin: 0; }
    .content-body { padding: 40px; flex: 1; }

    /* Modern Stats Grid */
    .stats-grid-pixel { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 40px; }
    .stat-card-pixel { 
      background: white; padding: 28px; border-radius: 20px; border: 1px solid var(--border); 
      display: flex; align-items: center; gap: 20px; box-shadow: var(--shadow);
    }
    .stat-icon-pixel { 
      width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center;
      font-size: 24px; flex-shrink: 0;
    }
    .stat-info-pixel { display: flex; flex-direction: column; }
    .stat-label-pixel { font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value-pixel { font-size: 30px; font-weight: 850; color: var(--text); line-height: 1; margin-top: 4px; }

    /* List Containers */
    .list-container-pixel { display: flex; flex-direction: column; gap: 24px; }
    .card-pixel { 
      background: white; border-radius: 24px; border: 1px solid var(--border); padding: 32px; 
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
    }
    .card-title-pixel { font-size: 24px; font-weight: 800; color: var(--text); margin: 0 0 32px 0; display: flex; align-items: center; gap: 12px; }

    /* Claim Item Styling */
    .claim-item-pixel { 
      background: white; border: 1px solid var(--border); border-radius: 20px; padding: 32px; 
      display: flex; flex-direction: column; gap: 28px; transition: transform 0.2s;
    }
    .claim-item-pixel:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
    
    .item-header-pixel { display: flex; justify-content: space-between; align-items: center; }
    .item-identity { display: flex; align-items: center; gap: 16px; }
    .id-tag { background: #f1f5f9; color: #475569; padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; }
    .item-title { font-size: 22px; font-weight: 850; color: var(--text); margin: 0; }
    .item-subtitle { color: var(--text-muted); font-size: 14px; margin-top: 2px; }

    .status-pill { padding: 6px 18px; border-radius: 100px; font-size: 13px; font-weight: 700; }
    .pill-submitted { background: #fffbeb; color: #b45309; }
    .pill-underreview { background: #eff6ff; color: #1d4ed8; }
    .pill-approved { background: #ecfdf5; color: #047857; }
    .pill-rejected { background: #fef2f2; color: #b91c1c; }
    .pill-settled { background: #f5f3ff; color: #6d28d9; }

    .metrics-row-pixel { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
    .metric-pixel { display: flex; flex-direction: column; gap: 6px; }
    .m-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .m-value { font-size: 16px; font-weight: 750; color: var(--text); }
    .m-value.price { color: var(--primary); }

    .desc-block-pixel { background: #f8fafc; padding: 20px; border-radius: 16px; border-left: 4px solid var(--primary); }
    .desc-text { font-size: 15px; color: #475569; line-height: 1.6; }

    /* Review Sections */
    .review-panel-pixel { background: #f8fafc; border-radius: 20px; padding: 32px; border: 1px solid var(--border); margin-top: 12px; }
    .review-h { font-size: 18px; font-weight: 800; color: var(--text); margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
    
    .risk-grid-pixel { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; }
    .risk-box-pixel { background: white; padding: 20px; border-radius: 16px; border: 1px solid var(--border); }
    .risk-score-val { font-size: 24px; font-weight: 900; color: var(--text); display: block; margin: 4px 0; }
    .risk-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 12px; }
    .risk-fill { height: 100%; transition: width 0.5s ease; }

    .calc-box-pixel { background: var(--primary); color: white; padding: 24px; border-radius: 16px; margin-bottom: 32px; text-align: center; }
    .calc-label { font-size: 13px; opacity: 0.8; font-weight: 600; text-transform: uppercase; }
    .calc-val { display: block; font-size: 32px; font-weight: 850; margin-top: 4px; }

    .input-pixel { 
      background: white; border: 1px solid var(--border); padding: 14px 20px; border-radius: 12px; 
      font-size: 15px; font-weight: 600; color: var(--text); width: 100%; transition: all 0.2s;
    }
    .input-pixel:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 4px var(--primary-soft); }
    
    .btn-pixel { 
      padding: 14px 28px; border-radius: 12px; font-weight: 750; border: none; cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center; gap: 10px;
    }
    .btn-pixel.primary { background: var(--primary); color: white; }
    .btn-pixel.primary:hover { transform: translateY(-2px); box-shadow: 0 8px 15px rgba(124, 58, 237, 0.25); }
    .btn-pixel.success { background: var(--success); color: white; width: 100%; }
    .btn-pixel.danger { background: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2; width: 100%; }
    .btn-pixel.secondary { background: white; color: var(--text); border: 1px solid var(--border); font-size: 13px; padding: 8px 16px; }

    /* Helper Classes */
    .purple-soft { background: #f5f3ff; color: var(--primary); }
    .amber-soft { background: #fff7ed; color: #b45309; }
    .emerald-soft { background: #ecfdf5; color: #047857; }
    .rose-soft { background: #fff1f2; color: #be123c; }

    /* Modal Styles from Agent Dashboard */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 3000; }
    .modal-box { background: var(--bg); border: 1px solid var(--border); border-radius: 20px; width: 500px; max-width: 90vw; color: var(--text); }
    .modal-box.doc-modal { width: 900px; height: 85vh; display: flex; flex-direction: column; }
    .modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .modal-body { padding: 24px; flex: 1; overflow-y: auto; }
    .doc-preview { background: #1e293b; padding: 0; display: flex; justify-content: center; align-items: center; }
    .preview-img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .preview-iframe { width: 100%; height: 100%; border: none; }
    .close-btn { background: transparent; border: none; font-size: 24px; cursor: pointer; color: #64748b; font-weight: 700; padding: 0 4px; }
    .btn-pixel.purple-btn { background: #f5f3ff; color: var(--primary); border: 1px solid #ddd6fe; }
    .btn-pixel.purple-btn:hover { background: #ede9fe; }

    /* Analysis Modal Premium */
    .analysis-modal-premium { width: 700px !important; max-height: 85vh; display: flex; flex-direction: column; background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid var(--border); overflow: hidden;}
    .scanner-container { padding: 80px 40px; text-align: center; }
    .scanner-view { position: relative; width: 100px; height: 120px; background: #f8fafc; margin: 0 auto 24px; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid #e2e8f0; }
    .scan-line { position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: var(--primary); box-shadow: 0 0 15px var(--primary); animation: scanClaim 2s ease-in-out infinite; z-index: 10; }
    @keyframes scanClaim { 0%, 100% { top: 0; } 50% { top: 100%; } }
    .scanning-text { color: var(--primary); font-weight: 750; font-size: 16px; margin-top: 16px; }

    .rec-banner { padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 24px; }
    .rec-approve { background: #ecfdf5; border: 1px solid #10b981; color: #047857; }
    .rec-reject { background: #fef2f2; border: 1px solid #ef4444; color: #b91c1c; }
    .rec-manual-review { background: #fffbeb; border: 1px solid #f59e0b; color: #b45309; }
    .rec-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; }
    .rec-value { margin: 8px 0 0 0; font-size: 28px; font-weight: 850; }

    .report-grid-pixel { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
    .report-item { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .report-item.danger-item { background: #fef2f2; border-color: #fecaca; }
    .report-item.danger-item .m-value { color: #dc2626; }

    .ai-reason-box { background: #f5f3ff; padding: 24px; border-radius: 16px; border: 1px solid #ddd6fe; margin-bottom: 24px; }
    .reason-h { margin: 0 0 12px 0; font-size: 16px; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 8px; }
    .reason-text-val { font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0; font-weight: 500; }

    .ocr-snippet-box { background: #fdfdfd; padding: 16px; border-radius: 12px; border: 1px dashed #cbd5e1; }
    .ocr-text-view { font-family: 'Courier New', monospace; font-size: 11px; color: #64748b; margin-top: 8px; max-height: 80px; overflow-y: auto; line-height: 1.4; }
  `]
})
export class OfficerDashboardComponent implements OnInit {
  // UI State
  documentViewer = signal<{ url: SafeResourceUrl | null; rawUrl: string | null; isImage?: boolean }>({ url: null, rawUrl: null, isImage: false });
  activeTab = signal<string>('assigned');
  officerName = signal('Claims Officer');
  isSidebarCollapsed = signal(false);
  contentMargin = computed(() => this.isSidebarCollapsed() ? '80px' : '280px');
  assignedClaims = signal<any[]>([]);
  reviewData: { [key: number]: { approvedAmount: number; reviewNotes: string; propertyLoss: number; disasterImpact: number; suggestedPayout: number } } = {};
  
  // Analysis Signals
  isAnalyzing = signal(false);
  analysisResult = signal<any>(null);
  showAnalysisModal = signal(false);
  notification = signal<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  sidebarItems: SidebarItem[] = [
    { id: 'assigned', label: 'Assigned Claims', icon: '📄' },
    { id: 'invoices', label: 'Invoices', icon: '🧾' }
  ];

  officerInvoiceSearch: string = '';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private invoiceService: InvoiceService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user?.fullName) {
      this.officerName.set(user.fullName);
    }

    this.loadAssignedClaims();
  }

  getPageTitle(): string {
    const titles: any = {
      claims: 'Assigned Claims',
      policies: 'All System Policies',
      browse: 'Browse Policies'
    };
    return titles[this.activeTab()] || 'Claims Officer Dashboard';
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
              approvedAmount: claim.approvedAmount || claim.claimedAmount,
              reviewNotes: claim.reviewNotes || '',
              propertyLoss: claim.propertyLossPercentage || 50,
              disasterImpact: claim.disasterImpactScore || 0.5,
              suggestedPayout: claim.estimatedLossAmount || (claim.claimedAmount * 0.5 * 0.5)
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
    switch (status?.toLowerCase()) {
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
      disasterImpactScore: this.reviewData[claim.id]?.disasterImpact || 0.5,
      propertyLossPercentage: this.reviewData[claim.id]?.propertyLoss || 50
    };

    this.apiService.reviewClaim(reviewData).subscribe({
      next: () => {
        this.showNotification('Review started successfully', 'success');
        this.loadAssignedClaims();
      },
      error: (err) => this.showNotification(err.error?.message || 'Failed to start review', 'error')
    });
  }

  onCalculatorChange(claimId: number, claimedAmount: number): void {
    const data = this.reviewData[claimId];
    // Simple Estimation Formula: Claimed Amount * (Loss % / 100) * Disaster Impact
    // This provides a "suggested" value to guide the officer
    data.suggestedPayout = claimedAmount * (data.propertyLoss / 100) * data.disasterImpact;
    // Auto-fill approved amount if it's currently at default
    data.approvedAmount = Math.round(data.suggestedPayout);
  }

  viewProof(documentId: number): void {
    if (!documentId) {
      this.showNotification('No proof document attached to this claim', 'error');
      return;
    }

    this.apiService.fetchClaimDocumentBlob(documentId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        const isImage = blob.type.startsWith('image/');
        this.documentViewer.set({ url: safeUrl, rawUrl: url, isImage });
      },
      error: (err) => {
        let errorMsg = 'Failed to load document';
        if (err.status === 403) errorMsg = 'You are not authorized to view this file';
        if (err.status === 404) errorMsg = 'File not found on server';
        this.showNotification(errorMsg, 'error');
      }
    });
  }

  closeDocument(): void {
    const currentUrl = this.documentViewer().rawUrl;
    if (currentUrl) {
      window.URL.revokeObjectURL(currentUrl);
    }
    this.documentViewer.set({ url: null, rawUrl: null });
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
        this.assignedClaims.update(claims => claims.map(c => c.id === claimId ? { ...c, status: 'Approved', approvedAmount: data.approvedAmount } : c));
        this.showNotification('Claim approved successfully! Payout confirmed.', 'success');
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
        this.assignedClaims.update(claims => claims.map(c => c.id === claimId ? { ...c, status: 'Rejected', reviewNotes: rejectData.reviewNotes } : c));
        this.showNotification('Claim rejected successfully', 'success');
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

  viewInvoiceForRelated(type: string, relatedId: number): void {
    this.invoiceService.getInvoiceByRelatedId(type, relatedId).subscribe({
      next: (invoice: any) => {
        if (invoice && (invoice.id || invoice.Id)) {
          this.invoiceService.viewPdf(invoice.id || invoice.Id);
        } else {
          alert('Invoice not found or still being generated.');
        }
      },
      error: () => alert('Could not find invoice for this item.')
    });
  }

  logout(): void {
    this.authService.logout();
  }

  // Claim Analysis Methods
  analyzeClaim(claimId: number): void {
    this.isAnalyzing.set(true);
    this.showAnalysisModal.set(true);
    this.analysisResult.set(null);

    this.apiService.analyzeClaim(claimId).subscribe({
      next: (data) => {
        this.analysisResult.set(data);
        this.isAnalyzing.set(false);
      },
      error: (err) => {
        this.showNotification(err.error?.message || 'AI Analysis failed', 'error');
        this.closeAnalysis();
      }
    });
  }

  closeAnalysis(): void {
    this.showAnalysisModal.set(false);
    this.isAnalyzing.set(false);
    this.analysisResult.set(null);
  }
}
