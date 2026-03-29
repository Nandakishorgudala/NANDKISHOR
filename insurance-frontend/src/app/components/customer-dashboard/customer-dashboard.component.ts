import { Component, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SidebarComponent, SidebarItem } from '../shared/sidebar.component';
import { FileUploadComponent, UploadedDocumentInfo } from '../file-upload/file-upload.component';

// Chart Components (Imported but rendered carefully as per requirements)
import { ChartPremiumsComponent } from './charts/chart-premiums/chart-premiums.component';
import { ChartClaimsComponent } from './charts/chart-claims/chart-claims.component';
import { ChartPolicyMixComponent } from './charts/chart-policy-mix/chart-policy-mix.component';
import { ChartRenewalsComponent } from './charts/chart-renewals/chart-renewals.component';
import { MetricSavingsComponent } from './charts/metric-savings/metric-savings.component';
import { ChatbotComponent } from '../shared/chatbot/chatbot.component';
import { InvoiceListComponent } from '../shared/invoices/invoice-list.component';
import { InvoiceService } from '../../services/invoice.service';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    SidebarComponent, 
    FileUploadComponent,
    ChartPremiumsComponent,
    ChartClaimsComponent,
    ChartPolicyMixComponent,
    ChartRenewalsComponent,
    MetricSavingsComponent,
    InvoiceListComponent,
    ChatbotComponent
  ],
  template: `
    <div class="dashboard-container">
      <app-sidebar
        [userName]="customerName()"
        [userRole]="'Customer'"
        [items]="sidebarItems"
        [activeItem]="activeTab()"
        (itemClick)="onTabChange($event)"
        (logout)="logout()">
      </app-sidebar>

      <app-chatbot></app-chatbot>

      <div class="main-content">
        <div class="content-body">
          <!-- Overview Tab -->
          @if (activeTab() === 'overview') {
            <div class="header-pixel">
              <h1>Welcome back, {{ customerName() }}</h1>
              <p>Here's a summary of your insurance portfolio.</p>
            </div>

            <div class="stats-grid-pixel">
              <div class="stat-card-pixel">
                <div class="card-left"><span class="label">Active Policies</span><h2 class="value">{{ policies().length }}</h2></div>
                <div class="card-right"><div class="icon-box-pixel purple-soft"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div></div>
              </div>
              <div class="stat-card-pixel">
                <div class="card-left"><span class="label">Pending Claims</span><h2 class="value">{{ getPendingClaimsCount() }}</h2></div>
                <div class="card-right"><div class="icon-box-pixel amber-soft"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg></div></div>
              </div>
              <div class="stat-card-pixel">
                <div class="card-left"><span class="label">Total Coverage</span><h2 class="value">₹{{ formatLargeValue(getTotalCoverageValue()) }}</h2></div>
                <div class="card-right"><div class="icon-box-pixel green-soft"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div></div>
              </div>
              <div class="stat-card-pixel">
                <div class="card-left"><span class="label">Premium Due</span><h2 class="value">₹{{ totalPremiumDue().toLocaleString('en-IN') }}</h2></div>
                <div class="card-right"><div class="icon-box-pixel purple-soft"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg></div></div>
              </div>
            </div>

            <div class="layout-row-pixel">
              <div class="section-card-pixel">
                <h3 class="pixel-title">Recent Activity</h3>
                <div class="activity-list-pixel">
                  @for (act of recentActivities(); track act.date) {
                    <div class="activity-item-pixel">
                      <span class="activity-text">{{ act.text }}</span>
                      <span class="activity-time">{{ timeAgo(act.date) }}</span>
                    </div>
                  }
                  @if (recentActivities().length === 0) {
                    <div class="empty-state-pixel" style="padding: 20px; font-size: 14px; border: none;">No recent activity found.</div>
                  }
                </div>
              </div>
              <div class="section-card-pixel">
                <h3 class="pixel-title">Quick Actions</h3>
                <div class="grid-actions-pixel">
                  <div class="action-btn-pixel" (click)="activeTab.set('policies')">File a Claim</div>
                  <div class="action-btn-pixel" (click)="activeTab.set('browse')">Browse Plans</div>
                  <div class="action-btn-pixel" (click)="activeTab.set('invoices')">Pay Premium</div>
                  <div class="action-btn-pixel">Get Support</div>
                </div>
              </div>
            </div>
          }



          <!-- Profile Tab -->
          @if (activeTab() === 'profile') {
            <div class="header-pixel-flex">
              <h1>My Profile</h1>
              <button class="btn-pixel-outline" (click)="enableEditProfile()">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                 Edit Profile
              </button>
            </div>
            <div class="profile-card-main-pixel">
              <div class="avatar-pixel">{{ getInitials() }}</div>
              <div class="profile-info-meta">
                <h2>{{ customerName() }}</h2>
                <p class="email-muted">{{ authService.currentUser()?.email || 'user@insurance.com' }}</p>
                <div class="status-badge-inline"><span class="dot-green"></span> Active Account</div>
              </div>
            </div>
            <div class="profile-grid-pixel">
              <div class="info-item-pixel">
                <div class="info-icon-box purple-soft"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg></div>
                <div><span class="info-label">AGE</span><p class="info-value">{{ profile?.age || 22 }} years</p></div>
              </div>
              <div class="info-item-pixel">
                <div class="info-icon-box purple-soft"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07"/><path d="M8.09 9.91a16 16 0 0 0 6 6l1.27-1.27"/></svg></div>
                <div><span class="info-label">PHONE</span><p class="info-value">{{ profile?.phoneNumber || '4455662211' }}</p></div>
              </div>
              <div class="info-item-pixel full-width">
                <div class="info-icon-box purple-soft"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/></svg></div>
                <div><span class="info-label">ADDRESS</span><p class="info-value">{{ profile?.address || 'Hyd, Hyderabad, Telangana 500090' }}</p></div>
              </div>
            </div>
          }

          <!-- Browse Tab -->
          @if (activeTab() === 'browse') {
            <div class="header-pixel">
              <h1>Browse Policies</h1>
              <p>Explore available insurance plans.</p>
            </div>
            <div class="product-grid-pixel">
               @for (p of policyProducts(); track p.id) {
                 <div class="product-card-pixel">
                   <div class="product-icon-pixel purple-soft">
                     <ng-container [ngSwitch]="getPolicyIcon(p.name)">
                        <svg *ngSwitchCase="'flame'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                        <svg *ngSwitchCase="'shield'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        <svg *ngSwitchCase="'lock'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <svg *ngSwitchCase="'mountain'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3l4 8 5-5 5 15H2L8 3z"/></svg>
                        <svg *ngSwitchDefault width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
                     </ng-container>
                   </div>
                   <h3 class="product-name">{{ p.name }}</h3>
                   <p class="product-coverage">Coverage: ₹{{ p.coverageAmount | number:'1.0-0' }}</p>
                   <div class="product-footer">
                     <span class="product-price">₹{{ p.basePremium | number:'1.0-0' }}/mo</span>
                     <button class="btn-product-apply" (click)="startApplication(p)">Apply</button>
                   </div>
                 </div>
               }
            </div>
          }

          <!-- My Policies Tab -->
          @if (activeTab() === 'policies') {
            <div class="header-pixel">
              <h1>My Policies</h1>
              <p>Manage your active insurance policies.</p>
            </div>
            <div class="list-container-pixel">
               @for (p of policies(); track p.id) {
                 <div class="list-item-card-pixel" style="display: block;">
                   <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                     <div class="item-info-left">
                       <h3>{{ p.policyName || 'Insurance Policy' }}</h3>
                       <p class="meta-text">{{ p.policyNumber }} · Expires {{ p.endDate | date:'yyyy-MM-dd' }}</p>
                     </div>
                     <div class="item-info-right">
                       <div class="value-text-group">
                         <span class="value-text">₹{{ (p.totalCoverageAmount / 12) | number:'1.0-0' }}/mo</span>
                         <span class="status-pill purple">{{ p.status }}</span>
                       </div>
                       <div class="action-buttons-group" style="display: flex; gap: 8px;">
                         <button class="btn-pixel-outline" (click)="openPolicyDetails(p)">
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                           Show Details
                         </button>
                         <button class="btn-pixel-outline" (click)="openClaimModal(p)">
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                             <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 14l2 2 4-4"/></svg>
                           File Claim
                         </button>
                       </div>
                     </div>
                   </div>

                   <!-- Coverage Tracker -->
                   @if (p.totalCoverageAmount) {
                     <div class="coverage-tracker-pixel">
                       <div class="tracker-header">
                         <span class="tracker-label">Coverage Utilization</span>
                         <span class="tracker-values">
                           <strong>₹{{ p.remainingCoverageAmount | number:'1.0-0' }}</strong> left of ₹{{ p.totalCoverageAmount | number:'1.0-0' }}
                         </span>
                       </div>
                       <div class="tracker-bar-bg">
                         <div class="tracker-bar-fill" [style.width.%]="(p.remainingCoverageAmount / p.totalCoverageAmount) * 100"
                              [ngClass]="{
                                'safe': (p.remainingCoverageAmount / p.totalCoverageAmount) > 0.5,
                                'warning': (p.remainingCoverageAmount / p.totalCoverageAmount) > 0.2 && (p.remainingCoverageAmount / p.totalCoverageAmount) <= 0.5,
                                'danger': (p.remainingCoverageAmount / p.totalCoverageAmount) <= 0.2
                              }">
                         </div>
                       </div>
                     </div>
                   }
                 </div>
               }
            </div>
          }

          <!-- My Applications Tab -->
          @if (activeTab() === 'applications') {
            <div class="header-pixel">
              <h1>My Applications</h1>
              <p>Track your policy applications.</p>
            </div>
            <div class="list-container-pixel">
               @for (app of applications(); track app.id) {
                 <div class="list-item-card-pixel">
                   <div class="item-info-left">
                     <h3>{{ app.productName || 'Insurance Application' }}</h3>
                     <p class="meta-text">{{ app.applicationNumber }} · Applied {{ app.submittedAt | date:'yyyy-MM-dd' }}</p>
                   </div>
                    <div class="item-info-right">
                      <span class="status-pill" [ngClass]="{
                        'purple': app.status === 'Approved' || app.status === 'AgentApproved',
                        'grey': app.status === 'Pending' || app.status === 'Assigned',
                        'orange': app.status === 'UnderReview',
                        'red': app.status === 'Rejected'
                      }">
                        {{ app.status === 'UnderReview' ? 'Under Review' : app.status === 'AgentApproved' ? 'Ready for Payment' : app.status }}
                      </span>
                      @if (app.status === 'AgentApproved') {
                        <button class="vessel-btn-primary btn-sm" (click)="payAndCreatePolicy(app)" style="margin-left: 12px; height: 32px; padding: 0 16px; font-size: 13px;">
                          Buy Now
                        </button>
                      }
                    </div>
                 </div>
               }
            </div>
          }

          <!-- My Claims Tab -->
          @if (activeTab() === 'claims') {
            <div class="header-pixel">
              <h1>My Claims</h1>
              <p>View and track your insurance claims.</p>
            </div>
            <div class="list-container-pixel">
               @for (c of claims(); track c.id) {
                 <div class="list-item-card-pixel">
                   <div class="item-info-left">
                     <h3>{{ c.policyName || 'Insurance Claim' }}</h3>
                     <p class="meta-text">{{ c.claimNumber }} · Filed {{ c.createdAt | date:'yyyy-MM-dd' }}</p>
                   </div>
                   <div class="item-info-right">
                     <span class="value-text">₹{{ c.claimedAmount | number:'1.0-0' }}</span>
                     <span class="status-pill" [ngClass]="c.status === 'Settled' ? 'purple' : 'grey'">
                       {{ c.status === 'Settled' ? 'Settled' : 'Processing' }}
                     </span>
                   </div>
                 </div>
               }
            </div>
          }

          <!-- Invoices Tab -->
          @if (activeTab() === 'invoices') {
            <div class="header-pixel-flex">
              <h1>My Invoices & Payouts</h1>
              <p>Keep track of your premiums and claim payments natively.</p>
            </div>
            
            <div style="margin-top: 24px;">
              <app-invoice-list 
                [customerId]="(profile?.id || profile?.Id)"
                [preloadedInvoices]="invoices()">
              </app-invoice-list>
            </div>
          }
        </div>
      </div>

      <!-- Policy Details Modal -->
      @if (selectedPolicyDetails()) {
        <div class="modal-root">
          <div class="modal-glass" (click)="closePolicyDetails()"></div>
          <div class="modal-vessel wide-vessel" style="max-width: 650px;" (click)="$event.stopPropagation()">
            <button class="vessel-close" (click)="closePolicyDetails()">✕</button>

            <div class="vessel-header" style="text-align: left; margin-bottom: 24px;">
              <h2 class="vessel-title">{{ selectedPolicyDetails()?.policyName }}</h2>
              <p class="vessel-subtitle">{{ selectedPolicyDetails()?.policyNumber }}</p>
            </div>

            <!-- Policy Details Grid -->
            <div class="detail-grid-pixel" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
              <div class="detail-box">
                <label>Start Date</label>
                <p>{{ selectedPolicyDetails()?.startDate | date:'longDate' }}</p>
              </div>
              <div class="detail-box">
                <label>End Date</label>
                <p>{{ selectedPolicyDetails()?.endDate | date:'longDate' }}</p>
              </div>
              <div class="detail-box">
                <label>Premium</label>
                <p>₹{{ (selectedPolicyDetails()?.totalCoverageAmount / 12) | number:'1.0-0' }} / mo</p>
              </div>
              <div class="detail-box">
                <label>Status</label>
                <p><span class="status-pill purple">{{ selectedPolicyDetails()?.status }}</span></p>
              </div>
            </div>

            <!-- Coverage utilization -->
            @if (selectedPolicyDetails()?.totalCoverageAmount) {
              <div class="coverage-tracker-pixel" style="margin-bottom: 24px;">
                <div class="tracker-header">
                  <span class="tracker-label">Coverage Utilization</span>
                  <span class="tracker-values">
                    <strong>₹{{ selectedPolicyDetails()?.remainingCoverageAmount | number:'1.0-0' }}</strong> left of ₹{{ selectedPolicyDetails()?.totalCoverageAmount | number:'1.0-0' }}
                  </span>
                </div>
                <div class="tracker-bar-bg">
                  <div class="tracker-bar-fill" [style.width.%]="(selectedPolicyDetails()?.remainingCoverageAmount / selectedPolicyDetails()?.totalCoverageAmount) * 100"
                       [ngClass]="{
                         'safe': (selectedPolicyDetails()?.remainingCoverageAmount / selectedPolicyDetails()?.totalCoverageAmount) > 0.5,
                         'warning': (selectedPolicyDetails()?.remainingCoverageAmount / selectedPolicyDetails()?.totalCoverageAmount) > 0.2 && (selectedPolicyDetails()?.remainingCoverageAmount / selectedPolicyDetails()?.totalCoverageAmount) <= 0.5,
                         'danger': (selectedPolicyDetails()?.remainingCoverageAmount / selectedPolicyDetails()?.totalCoverageAmount) <= 0.2
                       }">
                  </div>
                </div>
              </div>
            }

            <!-- Ledger of Claims -->
            <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 12px; border-top: 1px solid #e2e8f0; padding-top: 24px;">Claims Log & Deductions</h3>
            <div class="ledger-container">
              @if (mappedClaimsForSelectedPolicy().length === 0) {
                <p class="meta-text" style="padding: 16px; font-style: italic; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">No claims filed against this policy yet.</p>
              }
              @for (c of mappedClaimsForSelectedPolicy(); track c.id) {
                <div class="ledger-row">
                   <div class="ledger-date">{{ c.createdAt | date:'shortDate' }}</div>
                   <div class="ledger-desc" style="display: flex; align-items: center; gap: 8px;">
                     Claim {{ c.claimNumber }} 
                     <span class="status-pill" [ngClass]="{
                        'green': c.status === 'Approved' || c.status === 'Settled' || c.status === 'Accepted',
                        'grey': c.status === 'Pending' || c.status === 'Review',
                        'red': c.status === 'Rejected'
                     }" style="font-size: 11px; padding: 4px 8px;">{{ c.status === 'Settled' ? 'Settled' : c.status === 'Accepted' ? 'Settled' : c.status }}</span>
                   </div>
                   <div class="ledger-amount" [ngClass]="{'deducted': c.status === 'Approved' || c.status === 'Settled' || c.status === 'Accepted'}">
                     {{ (c.status === 'Approved' || c.status === 'Settled' || c.status === 'Accepted') ? '-' : '' }}₹{{ c.approvedAmount > 0 ? c.approvedAmount : c.claimedAmount | number:'1.0-0' }}
                   </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Claim Modal (Style copied from landing.component.ts) -->
      @if (showClaimModal()) {
        <div class="modal-root">
          <div class="modal-glass" (click)="closeClaimModal()"></div>
          <div class="modal-vessel" (click)="$event.stopPropagation()">
            <button class="vessel-close" (click)="closeClaimModal()">✕</button>

            <form (ngSubmit)="submitClaim()" class="vessel-form">
              <div class="modal-icon-center">
                <div class="modal-shield-orb">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" class="orb-icon">
                    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill="var(--primary)" fill-opacity="0.1" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>

              <div class="vessel-header" style="margin-bottom: 24px;">
                <h2 class="vessel-title">File a Claim</h2>
                <p class="vessel-subtitle">Against policy: {{ selectedPolicyForClaim()?.policyName }}</p>
              </div>

              <!-- Helpful context banner -->
              <div class="info-banner-pixel" style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 16px; border-radius: 12px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
                <div style="background: white; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #16a34a; font-weight: bold; flex-shrink: 0; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">₹</div>
                <div>
                  <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #166534;">Remaining Coverage</h4>
                  <p style="margin: 0; font-size: 12px; color: #15803d; line-height: 1.4;">You can request up to <strong>₹{{ selectedPolicyForClaim()?.remainingCoverageAmount | number:'1.0-0' }}</strong> for this incident.</p>
                </div>
              </div>

              <!-- Section 1: Incident Details -->
              <div class="form-section-pixel">
                <h3 class="section-title-pixel">Incident Details</h3>
                
                <div class="input-field">
                  <label>Incident Date</label>
                  <div class="input-orb">
                    <span class="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </span>
                    <input type="date" [(ngModel)]="claimForm.incidentDate" name="incidentDate" required>
                  </div>
                </div>

                <div class="dual-row-equal">
                  <div class="input-field">
                    <label>Incident Location</label>
                    <div class="input-orb">
                      <span class="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      </span>
                      <input type="text" [(ngModel)]="claimForm.incidentLocation" name="incidentLocation" placeholder="Address or City" required>
                    </div>
                  </div>
                  <div class="input-field">
                    <label>Zip Code</label>
                    <div class="input-orb">
                      <span class="input-icon">📍</span>
                      <input type="text" [(ngModel)]="claimForm.incidentZipCode" name="incidentZipCode" placeholder="12345" required>
                    </div>
                  </div>
                </div>

                <div class="input-field" style="margin-bottom: 0;">
                  <label>Detailed Description</label>
                  <div class="input-orb text-area-orb">
                    <textarea [(ngModel)]="claimForm.incidentDescription" name="incidentDescription" rows="3" placeholder="Describe what happened in detail..." required></textarea>
                  </div>
                </div>
              </div>

              <!-- Section 2: Financials & Proof -->
              <div class="form-section-pixel" style="margin-top: 20px;">
                <h3 class="section-title-pixel">Financials & Proof</h3>

                <div class="input-field">
                  <label>Requested Payout Amount (₹)</label>
                  <div class="input-orb" [class.invalid]="cAmount.invalid && cAmount.touched">
                    <span class="input-icon">₹</span>
                    <input type="number" [(ngModel)]="claimForm.claimedAmount" name="claimedAmount" #cAmount="ngModel" placeholder="e.g. 50000" required min="1" [max]="selectedPolicyForClaim()?.remainingCoverageAmount || 999999999">
                  </div>
                  @if (cAmount.invalid && cAmount.touched) {
                    <span class="error-msg">* Please enter a valid amount within your remaining coverage limits.</span>
                  }
                </div>

              <div class="input-field">
                <label>Supporting Document (Optional)</label>
                <div class="file-upload-row">
                  <input type="file" (change)="onClaimDocumentSelected($event)" class="file-input-pixel">
                  @if (isUploading()) {
                    <span class="upload-status">Uploading...</span>
                  }
                  @if (claimForm.documentId) {
                    <span class="upload-status success">✓ Ready</span>
                  }
                </div>
              </div>
            </div>

              @if (claimError()) {
                <div class="vessel-alert">
                  <span>⚠️</span> {{ claimError() }}
                </div>
              }

              <button type="submit" class="vessel-btn-primary" [disabled]="loadingClaim() || !claimForm.incidentDate || !claimForm.incidentLocation || !claimForm.claimedAmount">
                {{ loadingClaim() ? 'Submitting Claim...' : 'Submit Claim Application' }}
              </button>
            </form>
          </div>
        </div>
      }

      <!-- Edit Profile Modal -->
      @if (showEditProfileModal()) {
        <div class="modal-root">
          <div class="modal-glass" (click)="closeEditProfileModal()"></div>
          <div class="modal-vessel" (click)="$event.stopPropagation()">
            <button class="vessel-close" (click)="closeEditProfileModal()">✕</button>

            <form (ngSubmit)="saveProfile()" class="vessel-form">
              <div class="modal-icon-center">
                <div class="modal-shield-orb">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" class="orb-icon">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="var(--primary)" stroke-width="2.5"/><circle cx="12" cy="7" r="4" stroke="var(--primary)" stroke-width="2.5"/>
                  </svg>
                </div>
              </div>

              <div class="vessel-header">
                <h2 class="vessel-title">Update Profile</h2>
                <p class="vessel-subtitle">Keep your contact information up to date</p>
              </div>

              <div class="dual-row-equal">
                <div class="input-field">
                  <label>Age</label>
                  <div class="input-orb" [class.invalid]="edAge.invalid && edAge.touched">
                    <input type="number" [(ngModel)]="editProfileForm.age" name="age" id="edit-age" autocomplete="off" #edAge="ngModel" required min="18" max="120">
                  </div>
                  @if (edAge.invalid && edAge.touched) {
                    <span class="error-msg">* Age must be 18-120</span>
                  }
                </div>
                <div class="input-field">
                  <label>Phone Number</label>
                  <div class="input-orb" [class.invalid]="edPhone.invalid && edPhone.touched">
                    <input type="tel" [(ngModel)]="editProfileForm.phoneNumber" name="phone" id="edit-phone" autocomplete="tel" #edPhone="ngModel" required pattern="[0-9]{10}">
                  </div>
                  @if (edPhone.invalid && edPhone.touched) {
                    <span class="error-msg">* 10-digit number required</span>
                  }
                </div>
              </div>

              <div class="input-field">
                <label>Address</label>
                <div class="input-orb">
                  <input type="text" [(ngModel)]="editProfileForm.address" name="address" id="edit-address" autocomplete="street-address" required>
                </div>
              </div>

              <div class="triple-row">
                <div class="input-field">
                  <label>City</label>
                  <div class="input-orb" [class.invalid]="edCity.invalid && edCity.touched">
                    <input type="text" [(ngModel)]="editProfileForm.city" name="city" id="edit-city" autocomplete="address-level2" #edCity="ngModel" required>
                  </div>
                  @if (edCity.invalid && edCity.touched) {
                    <span class="error-msg">* Required</span>
                  }
                </div>
                <div class="input-field">
                  <label>State</label>
                  <div class="input-orb" [class.invalid]="edState.invalid && edState.touched">
                    <input type="text" [(ngModel)]="editProfileForm.state" name="state" id="edit-state" autocomplete="address-level1" #edState="ngModel" required>
                  </div>
                  @if (edState.invalid && edState.touched) {
                    <span class="error-msg">* Required</span>
                  }
                </div>
                <div class="input-field">
                  <label>Zip Code</label>
                  <div class="input-orb" [class.invalid]="edZip.invalid && edZip.touched">
                    <input type="text" [(ngModel)]="editProfileForm.zipCode" name="zip" id="edit-zip" autocomplete="postal-code" #edZip="ngModel" required pattern="[0-9]{6}">
                  </div>
                  @if (edZip.invalid && edZip.touched) {
                    <span class="error-msg">* 6-digit Zip</span>
                  }
                </div>
              </div>

              @if (profileError()) {
                <div class="vessel-alert">
                  <span>⚠️</span> {{ profileError() }}
                </div>
              }

              <button type="submit" class="vessel-btn-primary" [disabled]="loadingProfile() || !editProfileForm.phoneNumber || !editProfileForm.address">
                {{ loadingProfile() ? 'Saving Changes...' : 'Update Profile' }}
              </button>
            </form>
          </div>
        </div>
      }

      <!-- Application Modal (Similar style to claim modal) -->
      @if (showApplyModal()) {
        <div class="modal-root">
          <div class="modal-glass" (click)="closeApplyModal()"></div>
          <div class="modal-vessel wide-vessel" (click)="$event.stopPropagation()">
            <button class="vessel-close" (click)="closeApplyModal()">✕</button>

            <form (ngSubmit)="submitApplication()" class="vessel-form">
              <div class="modal-icon-center">
                <div class="modal-shield-orb">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" class="orb-icon">
                    <path d="M12 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <polyline points="14 2 14 8 20 8" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>

              <div class="vessel-header">
                <h2 class="vessel-title">Apply for {{ selectedPolicyForApply()?.name }}</h2>
                <p class="vessel-subtitle">Configure your plan and confirm your details</p>
              </div> <!-- Header Closed -->

              <!-- Plan Selection Buttons -->
              <div class="plan-selector-fancy">
                <label>Choose Your Plan Tier</label>
                <div class="plan-chips">
                  <div class="plan-chip" [class.active]="applyForm.planType === 'Basic'" (click)="applyForm.planType = 'Basic'">
                    <span class="p-name">Basic</span>
                    <span class="p-mult">1.0x</span>
                  </div>
                  <div class="plan-chip" [class.active]="applyForm.planType === 'Plus'" (click)="applyForm.planType = 'Plus'">
                    <span class="p-name">Plus</span>
                    <span class="p-mult">1.25x</span>
                  </div>
                  <div class="plan-chip" [class.active]="applyForm.planType === 'Advanced'" (click)="applyForm.planType = 'Advanced'">
                    <span class="p-name">Advanced</span>
                    <span class="p-mult">1.5x</span>
                  </div>
                </div>
              </div>

              <div class="form-scrollable-area">
                <div class="dual-row-equal">
                  <div class="input-field">
                    <label>Your Age</label>
                    <div class="input-orb">
                      <input type="number" [(ngModel)]="applyForm.customerAge" name="customerAge" required min="18" placeholder="25">
                    </div>
                  </div>
                  <div class="input-field">
                    <label>Asset Type</label>
                    <div class="input-orb">
                      <select [(ngModel)]="applyForm.assetType" name="assetType" required>
                        <option value="">Select...</option>
                        <option value="House">House</option>
                        <option value="Apartment">Apartment</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Vehicle">Vehicle</option>
                      </select>
                    </div>
                  </div>
                </div>

                 <div class="dual-row-equal">
                   <div class="input-field">
                     <label>Asset Value (₹)</label>
                     <div class="input-orb" [class.invalid]="aVal.invalid && aVal.touched">
                       <input type="number" [(ngModel)]="applyForm.assetValue" name="assetValue" #aVal="ngModel" required min="100" placeholder="500000">
                     </div>
                     @if (aVal.invalid && aVal.touched) {
                       <span class="error-msg">* Valid value required</span>
                     }
                   </div>
                   <div class="input-field">
                     <label>Year Built</label>
                     <div class="input-orb" [class.invalid]="yBuilt.invalid && yBuilt.touched">
                       <input type="number" [(ngModel)]="applyForm.yearBuilt" name="yearBuilt" #yBuilt="ngModel" required min="1800" max="2026" placeholder="2015">
                     </div>
                     @if (yBuilt.invalid && yBuilt.touched) {
                       <span class="error-msg">* 1800-2026 required</span>
                     }
                   </div>
                 </div>

                <div class="triple-row">
                  <div class="input-field">
                    <label>State</label>
                    <div class="input-orb">
                      <input type="text" [(ngModel)]="applyForm.state" name="state" required placeholder="State">
                    </div>
                  </div>
                  <div class="input-field">
                    <label>City</label>
                    <div class="input-orb">
                      <input type="text" [(ngModel)]="applyForm.city" name="city" required placeholder="City">
                    </div>
                  </div>
                  <div class="input-field">
                    <label>Zip Code</label>
                    <div class="input-orb">
                      <input type="text" [(ngModel)]="applyForm.zipCode" name="zipCode" required placeholder="12345">
                    </div>
                  </div>
                </div>

                <div class="dual-row-equal">
                  <div class="input-field">
                    <label>Risk Zone</label>
                    <div class="input-orb">
                      <select [(ngModel)]="applyForm.riskZone" name="riskZone" required>
                        <option value="Low">Low Risk</option>
                        <option value="Medium">Medium Risk</option>
                        <option value="High">High Risk</option>
                      </select>
                    </div>
                  </div>
                  <div class="input-field">
                    <label>Preferred Start Date</label>
                    <div class="input-orb" [class.invalid]="sDate.invalid && sDate.touched">
                      <input type="date" [(ngModel)]="applyForm.startDate" name="startDate" required [min]="minStartDate" [max]="maxStartDate" #sDate="ngModel">
                    </div>
                    @if (sDate.invalid && sDate.touched) {
                      <span class="error-msg">* Pick a date within 1 month from today</span>
                    }
                  </div>
                </div>

                <div class="input-field" style="margin-top: 16px;">
                  <label>Deductible (₹)</label>
                  <div class="input-orb">
                    <input type="number" [(ngModel)]="applyForm.deductible" name="deductible" required placeholder="5000">
                  </div>
                </div>

                <!-- Live Coverage Calculation -->
                @if (applyForm.assetValue && applyForm.customerAge) {
                  <div class="coverage-payout-box">
                    <span class="calc-text">Estimated Dynamic Coverage</span>
                    <h3 class="calc-value">{{ calculateEstimatedCoverage() }}</h3>
                    <p class="calc-note">Calculated including plan multipliers & age risk factors</p>
                  </div>
                }
              </div>

              <!-- Identity Document Upload -->
              <div class="input-field" style="margin-top: 24px;">
                <label>Identity Document (Aadhar/Voter ID/Passport)</label>
                <div style="margin-top: 8px;">
                  <app-file-upload (documentUploaded)="onDocumentUploaded($event)"></app-file-upload>
                </div>
              </div>

              @if (applyError()) {
                <div class="vessel-alert">
                  <span>⚠️</span> {{ applyError() }}
                </div>
              }

              <button type="submit" class="vessel-btn-primary" [disabled]="loadingApply() || !applyForm.assetValue || !applyForm.customerAge || !applyForm.documentId">
                {{ loadingApply() ? 'Processing...' : 'Submit Policy Application' }}
              </button>
            </form>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    :host {
      --primary: #7c3aed;
      --bg-body: #f8fafc;
      --text-main: #1e293b;
      --text-muted: #64748b;
      --border: #eef1f5;
      --shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .dashboard-container { display: flex; background: var(--bg-body); min-height: 100vh; font-family: 'Inter', sans-serif; }
    .main-content { padding-left: 260px; flex: 1; min-width: 0; }
    .content-body { padding: 48px; max-width: 1400px; margin: 0 auto; }

    /* Unified Headers */
    .header-pixel, .header-pixel-flex { margin-bottom: 40px; }
    .header-pixel-flex { display: flex; justify-content: space-between; align-items: center; }
    h1 { font-size: 32px; font-weight: 800; color: var(--text-main); margin: 0; letter-spacing: -0.5px; }
    p { color: var(--text-muted); font-size: 16px; font-weight: 500; margin-top: 4px; }

    /* Overview Stats */
    .stats-grid-pixel { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 32px; }
    .stat-card-pixel { 
      background: white; padding: 28px; border-radius: 16px; border: 1px solid var(--border); 
      display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow);
    }
    .stat-card-pixel .label { display: block; font-size: 14px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; }
    .stat-card-pixel .value { font-size: 28px; font-weight: 800; color: var(--text-main); margin: 0; }
    .icon-box-pixel { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }

    .layout-row-pixel { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 24px; }
    .section-card-pixel { background: white; border-radius: 16px; border: 1px solid var(--border); padding: 32px; box-shadow: var(--shadow); }
    .pixel-title { font-size: 20px; font-weight: 700; color: var(--text-main); margin: 0 0 24px 0; }
    .activity-item-pixel { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 1px solid #f8fafc; }
    .activity-item-pixel:last-child { border-bottom: none; }
    .activity-text { font-size: 15px; font-weight: 500; color: #334155; }
    .activity-time { font-size: 13px; color: #94a3b8; }

    .grid-actions-pixel { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .action-btn-pixel { 
      background: white; border: 1px solid var(--border); padding: 16px; border-radius: 12px; 
      text-align: center; font-size: 14px; font-weight: 600; color: var(--text-main); cursor: pointer; transition: all 0.2s;
    }
    .action-btn-pixel:hover { border-color: var(--primary); color: var(--primary); }

    /* Profile (Restored) */
    .profile-card-main-pixel { background: white; border-radius: 16px; border: 1px solid var(--border); padding: 35px; display: flex; align-items: center; gap: 30px; margin-bottom: 24px; box-shadow: var(--shadow); }
    .avatar-pixel { width: 90px; height: 90px; background: var(--primary); color: white; border-radius: 24px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; }
    .profile-grid-pixel { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .info-item-pixel { background: white; border: 1px solid var(--border); padding: 28px; border-radius: 16px; display: flex; align-items: center; gap: 20px; box-shadow: var(--shadow); }
    .full-width { grid-column: span 2; }
    .info-label { font-size: 12px; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 4px; display: block; }
    .info-value { font-size: 16px; font-weight: 600; color: var(--text-main); margin: 0; }
    .info-icon-box { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }

    /* Browse Products */
    .product-grid-pixel { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
    .product-card-pixel { background: white; border-radius: 16px; border: 1px solid var(--border); padding: 28px; box-shadow: var(--shadow); }
    .product-icon-pixel { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
    .product-name { font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 8px; }
    .product-coverage { font-size: 14px; color: var(--text-muted); margin-bottom: 24px; }
    .product-footer { display: flex; justify-content: space-between; align-items: center; }
    .product-price { font-size: 17px; font-weight: 800; color: var(--text-main); }
    .btn-product-apply { padding: 8px 18px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 14px; font-weight: 600; cursor: pointer; }

    /* UNIFIED LIST CARDS (Policies, Applications, Claims, Invoices) */
    .list-container-pixel { display: flex; flex-direction: column; gap: 16px; }
    .list-item-card-pixel { 
      background: white; border-radius: 12px; border: 1px solid var(--border); padding: 28px 32px; 
      display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow);
    }
    .item-info-left h3 { font-size: 19px; font-weight: 700; color: var(--text-main); margin: 0 0 4px 0; }
    .meta-text { font-size: 14px; color: var(--text-muted); font-weight: 500; }
    .item-info-right { display: flex; align-items: center; gap: 32px; }
    .value-text { font-size: 17px; font-weight: 800; color: var(--text-main); }
    
    .status-pill { padding: 6px 20px; border-radius: 99px; font-size: 13px; font-weight: 700; line-height: 1; }
    .status-pill.purple { background: var(--primary); color: white; }
    .status-pill.grey { background: #f1f5f9; color: #475569; }
    .status-pill.green { background: #f0fdf4; color: #16a34a; }
    .status-pill.orange { background: #fff7ed; color: #ea580c; }
    
    .btn-icon-minimal { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; display: flex; align-items: center; }
    .btn-pixel-outline { background: white; border: 1px solid var(--border); padding: 10px 18px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
    .btn-pixel-outline:hover { border-color: var(--primary); color: var(--primary); background: #fdfaff; }

    .value-text-group { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }

    /* Coverage Tracker */
    .coverage-tracker-pixel { background: #f8fafc; border-radius: 12px; padding: 16px 20px; border: 1px solid #e2e8f0; }
    .tracker-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .tracker-label { font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
    .tracker-values { font-size: 14px; color: #64748b; }
    .tracker-values strong { color: #0f172a; font-weight: 800; }
    .tracker-bar-bg { height: 10px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
    .tracker-bar-fill { height: 100%; border-radius: 99px; transition: width 1s ease-out; }
    .tracker-bar-fill.safe { background: linear-gradient(90deg, #10b981, #34d399); }
    .tracker-bar-fill.warning { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .tracker-bar-fill.danger { background: linear-gradient(90deg, #ef4444, #f87171); }

    /* Policy Details Modal Elements */
    .detail-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
    .detail-box label { display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .detail-box p { font-size: 15px; font-weight: 600; color: #0f172a; margin: 0; }
    .ledger-container { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .ledger-row { display: grid; grid-template-columns: 100px 1fr 120px; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; background: white; align-items: center; }
    .ledger-row:last-child { border-bottom: none; }
    .ledger-date { font-size: 13px; color: #64748b; font-weight: 500; }
    .ledger-desc { font-size: 14px; font-weight: 600; color: #1e293b; }
    .ledger-amount { text-align: right; font-size: 14px; font-weight: 700; color: #64748b; }
    .ledger-amount.deducted { color: #ef4444; }

    /* Form Sections inside Modals */
    .form-section-pixel { background: #f8fafc; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px; }
    .section-title-pixel { font-size: 13px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 20px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }

    /* Modal Styles (Adapted from landing.component.ts) */
    /* Modal Styles (Premium Refinement) */
    .modal-root { position: fixed; inset: 0; z-index: 1100; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .modal-glass { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
    .modal-vessel { 
      position: relative; background: white; width: 100%; max-width: 480px; border-radius: 20px; 
      padding: 32px 40px; box-shadow: 0 20px 40px -8px rgba(0,0,0,0.15);
      animation: vesselMove 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      max-height: 90vh; overflow-y: auto;
    }
    @keyframes vesselMove { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .vessel-close { position: absolute; top: 20px; right: 20px; background: #f8fafc; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color: #64748b; font-weight: 800; transition: background 0.2s; }
    .vessel-close:hover { background: #f1f5f9; color: #0f172a; }
    
    .modal-icon-center { display: flex; justify-content: center; margin-bottom: 20px; }
    .modal-shield-orb { width: 56px; height: 56px; background: #f3f0ff; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #7c3aed; }
    .modal-shield-orb svg { width: 26px; height: 26px; stroke-width: 2; }
    .vessel-header { text-align: center; margin-bottom: 28px; }
    .vessel-title { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 8px; letter-spacing: -0.5px; }
    .vessel-subtitle { color: #64748b; font-size: 13px; font-weight: 500; }

    .input-field { margin-bottom: 16px; }
    .input-field label { display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .input-orb { position: relative; display: flex; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; transition: all 0.2s ease; }
    .input-orb:focus-within { border-color: #a78bfa; background: #fff; box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.1); }
    .input-icon { padding-left: 14px; color: #94a3b8; display: flex; align-items: center; }
    .input-orb input, .input-orb select, .input-orb textarea { width: 100%; background: transparent; border: none; padding: 10px 14px; font-size: 14px; font-weight: 500; color: #1e293b; outline: none; }
    .text-area-orb { padding: 4px; }
    .dual-row { display: grid; grid-template-columns: 1.5fr 0.5fr; gap: 16px; }
    .dual-row-equal { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .triple-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .wide-vessel { max-width: 540px; padding: 36px 48px; }
    
    .form-scrollable-area { max-height: 480px; overflow-y: auto; padding-right: 8px; margin-bottom: 24px; }
    .form-scrollable-area::-webkit-scrollbar { width: 6px; }
    .form-scrollable-area::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
    .form-scrollable-area::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

    .plan-selector-fancy { margin-bottom: 24px; }
    .plan-selector-fancy label { display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .plan-chips { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .plan-chip { 
      background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 8px; border-radius: 12px; text-align: center; cursor: pointer; transition: all 0.2s ease;
      display: flex; flex-direction: column; gap: 4px; align-items: center;
    }
    .plan-chip:hover { border-color: #cbd5e1; background: #f1f5f9; }
    .plan-chip.active { background: #fcfaff; border-color: #8b5cf6; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1); }
    .plan-chip .p-name { font-weight: 700; font-size: 13px; color: #334155; }
    .plan-chip.active .p-name { color: #8b5cf6; }
    .plan-chip .p-mult { font-size: 11px; font-weight: 600; color: #94a3b8; }

    .coverage-payout-box { 
      background: #f0fdf4; border: 1px solid #dcfce7; padding: 16px; border-radius: 12px; text-align: center; margin-top: 16px;
    }
    .calc-text { font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; }
    .calc-value { font-size: 20px; font-weight: 800; color: #15803d; margin: 4px 0; }
    .calc-note { font-size: 10px; color: #3f6212; font-weight: 500; opacity: 0.8; }

    .vessel-btn-primary { 
      width: 100%; background: #a78bfa; color: white; border: none; padding: 14px; border-radius: 10px;
      font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; margin-top: 24px;
    }
    .vessel-btn-primary:hover:not(:disabled) { background: #8b5cf6; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25); }
    .vessel-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .file-upload-row { display: flex; align-items: center; gap: 12px; background: #fcfaff; padding: 12px 16px; border-radius: 12px; border: 2px dashed #c4b5fd; transition: all 0.2s; }
    .file-upload-row:hover { background: #f5f3ff; border-color: #a78bfa; }
    .file-input-pixel { font-size: 12Px; color: #64748b; font-weight: 500; }
    .upload-status { font-size: 12px; font-weight: 700; color: #8b5cf6; }
    .upload-status.success { color: #10b981; }

    .purple-soft { background: #f5f3ff; color: var(--primary); }
    .amber-soft { background: #fff7ed; color: #ea580c; }
    .green-soft { background: #f0fdf4; color: #16a34a; }
    .empty-state-pixel { padding: 40px; text-align: center; color: var(--text-muted); font-weight: 500; border: 1px dashed #cbd5e1; border-radius: 16px; }
    
    .error-msg { color: #ef4444; font-size: 11px; font-weight: 700; margin-top: 4px; display: block; }
    .input-orb.invalid { border-color: #fca5a5; background: #fffafb; }
  `]
})
export class CustomerDashboardComponent implements OnInit {
  sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'browse', label: 'Browse Policies', icon: 'search' },
    { id: 'policies', label: 'My Policies', icon: 'policy' },
    { id: 'applications', label: 'My Applications', icon: 'description' },
    { id: 'claims', label: 'My Claims', icon: 'report' },
    { id: 'invoices', label: 'Invoices', icon: 'receipt' }
  ];

  activeTab = signal('overview');
  customerName = signal('User');
  hasProfile = signal(false);
  profile: any = null;

  policies = signal<any[]>([]);
  applications = signal<any[]>([]);
  claims = signal<any[]>([]);
  invoices = signal<any[]>([]);
  policyProducts = signal<any[]>([]);
  totalPremiumDue = signal(0);

  minStartDate: string = new Date().toISOString().split('T')[0];
  maxStartDate: string = new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0];

  recentActivities = computed(() => {
    const list: any[] = [];
    
    this.applications().forEach(a => {
      list.push({
        text: `Application for ${a.productName} is ${a.status?.toLowerCase()}`,
        date: new Date(a.submittedAt || a.createdAt),
        type: 'application'
      });
    });
    
    this.policies().forEach(p => {
      list.push({
        text: `Policy ${p.policyNumber} is active`,
        date: new Date(p.startDate),
        type: 'policy'
      });
    });
    
    this.claims().forEach(c => {
      list.push({
        text: `Claim #${c.claimNumber} filed for ${c.policyName}`,
        date: new Date(c.createdAt),
        type: 'claim'
      });
    });
    
    this.invoices().forEach(i => {
      list.push({
        text: `Invoice ${i.invoiceNumber} generated (${i.status})`,
        date: new Date(i.generatedAt),
        type: 'invoice'
      });
    });
    
    return list.sort((a,b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  });

  // Application Modal State
  showApplyModal = signal(false);
  selectedPolicyForApply = signal<any>(null);
  loadingApply = signal(false);
  applyError = signal<string | null>(null);

  applyForm = {
    policyProductId: 0,
    customerAge: null as number | null,
    planType: 'Basic',
    assetType: '',
    assetValue: null as number | null,
    yearBuilt: null as number | null,
    state: '',
    city: '',
    zipCode: '',
    riskZone: 'Low',
    deductible: null as number | null,
    documentId: null as number | null,
    startDate: ''
  };

  // Profile Edit State
  showEditProfileModal = signal(false);
  loadingProfile = signal(false);
  profileError = signal<string | null>(null);
  editProfileForm = {
    age: 0,
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  };

  // Policy Details Modal State
  selectedPolicyDetails = signal<any>(null);
  mappedClaimsForSelectedPolicy = computed(() => {
    const p = this.selectedPolicyDetails();
    if (!p) return [];
    return this.claims()
      .filter((c: any) => c.policyId === p.id)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // descending
  });

  openPolicyDetails(policy: any) { this.selectedPolicyDetails.set(policy); }
  closePolicyDetails() { this.selectedPolicyDetails.set(null); }

  // Claim Modal State
  showClaimModal = signal(false);
  selectedPolicyForClaim = signal<any>(null);
  loadingClaim = signal(false);
  isUploading = signal(false);
  claimError = signal<string | null>(null);

  claimForm = {
    incidentDate: '',
    incidentLocation: '',
    incidentZipCode: '',
    incidentDescription: '',
    claimedAmount: null,
    documentId: null as number | null
  };

  constructor(
    public authService: AuthService,
    private apiService: ApiService,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.customerName.set(user.fullName || 'User');
      this.apiService.getActivePolicyProducts().subscribe(d => this.policyProducts.set(d));
      this.loadProfile();
    }
  }

  onTabChange(tabId: string): void { this.activeTab.set(tabId); }

  loadProfile(): void {
    this.apiService.getProfile().subscribe(p => {
      if (p) {
        this.profile = p;
        this.hasProfile.set(true);
        this.loadDashboardData();
      }
    });
  }

  loadDashboardData(): void {
    const custId = this.profile?.id || this.profile?.Id;
    this.apiService.getMyPolicies().subscribe(d => this.policies.set(d));
    this.apiService.getMyApplications().subscribe(d => this.applications.set(d));
    this.apiService.getMyClaims().subscribe(d => this.claims.set(d));
    if (custId) {
      this.invoiceService.getCustomerInvoices(custId).subscribe(invs => {
        this.invoices.set(invs);
        const unpaid = invs.filter((i: any) => i.status === 'Unpaid' || i.status === 'Overdue' || i.status === 'Generated');
        this.totalPremiumDue.set(unpaid.reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0));
      });
    }
  }

  getPolicyIcon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('wildfire')) return 'flame';
    if (n.includes('earthquake')) return 'mountain';
    if (n.includes('fire')) return 'shield';
    if (n.includes('theft')) return 'lock';
    return 'default';
  }

  getPendingClaimsCount(): number { return this.claims().filter(c => c.status !== 'Settled' && c.status !== 'Rejected').length; }
  getTotalCoverageValue(): number { return this.policies().reduce((s, p) => s + (p.coverageAmount || 0), 0); }
  formatLargeValue(val: number): string {
    if (val >= 100000) return (val / 100000).toFixed(1) + 'L';
    return val.toLocaleString('en-IN');
  }
  getInitials(): string { return this.customerName().split(' ').map(n => n[0]).join('').toUpperCase(); }
  
  timeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  }

  onDocumentUploaded(info: UploadedDocumentInfo) {
    this.applyForm.documentId = info.documentId;
    this.showNotification('Document attached successfully!', 'success');
  }

  payAndCreatePolicy(app: any) {
    if (!confirm(`Are you sure you want to buy this policy for ₹${app.calculatedPremium.toLocaleString('en-IN')}?`)) return;
    
    this.loadingApply.set(true);
    const paymentData = {
      applicationId: app.id,
      amount: app.calculatedPremium,
      paymentMethod: 'CreditCard', // Simulated for now
      transactionId: 'TXN-' + Math.random().toString(36).substring(7).toUpperCase()
    };

    this.apiService.payPolicy(paymentData).subscribe({
      next: (res) => {
        this.loadingApply.set(false);
        this.showNotification('Payment successful! Your policy is now active.', 'success');
        this.loadDashboardData(); // Refresh everything
        this.activeTab.set('invoices');
      },
      error: (err) => {
        this.loadingApply.set(false);
        this.showNotification(err.error?.message || 'Payment failed.', 'error');
      }
    });
  }

  showNotification(message: string, type: 'success' | 'error') {
    this.applyError.set(type === 'error' ? message : null);
    if (type === 'success') {
      alert(message); // Temporary until a real toast is added to customer dashboard
    }
  }

  logout(): void { this.authService.logout(); }
  
  enableEditProfile(): void { 
    if (this.profile) {
      this.editProfileForm = {
        age: this.profile.age || this.profile.Age || 0,
        phoneNumber: this.profile.phoneNumber || this.profile.PhoneNumber || '',
        address: this.profile.address || this.profile.Address || '',
        city: this.profile.city || this.profile.City || '',
        state: this.profile.state || this.profile.State || '',
        zipCode: this.profile.zipCode || this.profile.ZipCode || ''
      };
      this.showEditProfileModal.set(true);
      this.profileError.set(null);
    }
  }

  closeEditProfileModal(): void {
    this.showEditProfileModal.set(false);
  }

  saveProfile(): void {
    this.loadingProfile.set(true);
    this.profileError.set(null);

    this.apiService.updateProfile(this.editProfileForm).subscribe({
      next: (res) => {
        this.profile = res;
        this.loadingProfile.set(false);
        this.closeEditProfileModal();
      },
      error: (err) => {
        this.profileError.set(err.error?.message || 'Failed to update profile');
        this.loadingProfile.set(false);
      }
    });
  }

  startApplication(p: any): void {
    this.selectedPolicyForApply.set(p);
    this.applyForm = {
      policyProductId: p.id,
      customerAge: null,
      planType: 'Basic',
      assetType: '',
      assetValue: null,
      yearBuilt: null,
      state: '',
      city: '',
      zipCode: '',
      riskZone: 'Low',
      deductible: null,
      documentId: null,
      startDate: new Date().toISOString().split('T')[0]
    };
    this.applyError.set(null);
    this.showApplyModal.set(true);
  }

  closeApplyModal(): void {
    this.showApplyModal.set(false);
    this.selectedPolicyForApply.set(null);
  }

  calculateEstimatedCoverage(): string {
    if (!this.applyForm.assetValue || !this.applyForm.customerAge) return '₹0';
    
    const baseCoverage = this.applyForm.assetValue * 0.8;
    const planMultiplier = this.applyForm.planType === 'Basic' ? 1.0 :
                          this.applyForm.planType === 'Plus' ? 1.25 : 1.5;
    
    const age = this.applyForm.customerAge;
    const ageMultiplier = age <= 30 ? 1.2 :
                          age <= 40 ? 1.1 :
                          age <= 50 ? 1.0 :
                          age <= 60 ? 0.95 : 0.9;
    
    const finalCoverage = baseCoverage * planMultiplier * ageMultiplier;
    return '₹' + Math.round(finalCoverage).toLocaleString('en-IN');
  }

  submitApplication(): void {
    if (!this.selectedPolicyForApply()) return;

    this.loadingApply.set(true);
    this.applyError.set(null);

    this.apiService.applyPolicyWithPlan(this.applyForm).subscribe({
      next: () => {
        this.loadingApply.set(false);
        this.closeApplyModal();
        this.loadDashboardData(); // Refresh applications list
        this.activeTab.set('applications'); // Switch to applications tab
      },
      error: (err) => {
        let msg = err.error?.message || 'Failed to submit application';
        if (err.error?.errors) {
          const firstError = err.error.errors[0];
          msg += `: ${firstError.Field} - ${firstError.Errors[0]}`;
        }
        this.applyError.set(msg);
        this.loadingApply.set(false);
      }
    });
  }



  // Claim Methods
  openClaimModal(policy: any): void {
    this.selectedPolicyForClaim.set(policy);
    this.claimForm = {
      incidentDate: new Date().toISOString().split('T')[0],
      incidentLocation: '',
      incidentZipCode: '',
      incidentDescription: '',
      claimedAmount: null,
      documentId: null
    };
    this.claimError.set(null);
    this.showClaimModal.set(true);
  }

  closeClaimModal(): void {
    this.showClaimModal.set(false);
    this.selectedPolicyForClaim.set(null);
  }

  onClaimDocumentSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    this.isUploading.set(true);
    this.apiService.uploadClaimDocument(file).subscribe({
      next: (res) => {
        this.claimForm.documentId = res.documentId;
        this.isUploading.set(false);
      },
      error: () => {
        this.claimError.set('Failed to upload document');
        this.isUploading.set(false);
      }
    });
  }

  submitClaim(): void {
    if (!this.selectedPolicyForClaim()) return;

    this.loadingClaim.set(true);
    this.claimError.set(null);

    const claimData = {
      policyId: this.selectedPolicyForClaim().id,
      ...this.claimForm
    };

    this.apiService.createClaim(claimData).subscribe({
      next: () => {
        this.loadingClaim.set(false);
        this.closeClaimModal();
        this.loadDashboardData(); // Refresh claims list
        // Switch to claims tab to show success
        this.activeTab.set('claims');
      },
      error: (err) => {
        this.claimError.set(err.error?.message || 'Failed to submit claim');
        this.loadingClaim.set(false);
      }
    });
  }
}
