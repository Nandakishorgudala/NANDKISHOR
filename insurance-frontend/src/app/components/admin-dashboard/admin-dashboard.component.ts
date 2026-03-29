import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SidebarComponent, SidebarItem } from '../shared/sidebar.component';
import { InvoiceListComponent } from '../shared/invoices/invoice-list.component';
import { ChartWidgetComponent } from '../shared/charts/chart-widget.component';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, ChartWidgetComponent, InvoiceListComponent],
  template: `
    <div class="dashboard-container">
      <!-- Sidebar -->
      <app-sidebar
        [userName]="'Admin'"
        [userRole]="'Administrator'"
        [items]="sidebarItems"
        [activeItem]="activeTab()"
        (itemClick)="onTabChange($event)"
        (logout)="logout()">
      </app-sidebar>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Header -->
        @if (activeTab() !== 'overview' && activeTab() !== 'users' && activeTab() !== 'agents' && activeTab() !== 'policies' && activeTab() !== 'customers') {
          <div class="content-header">
            <h1 class="page-title">{{ getPageTitle() }}</h1>
          </div>
        }

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
            <!-- Welcome Header -->
            <div class="overview-header" style="margin-bottom: 24px;">
              <h1 style="font-size: 28px; font-weight: 700; color: #1F2937; margin: 0;">System Overview</h1>
              <p style="color: #6B7280; margin: 4px 0 0 0;">Monitor your platform at a glance.</p>
            </div>

            <!-- Stats Cards Grid -->
            <div class="stats-grid">
              <!-- Total Customers -->
              <div class="stat-card stat-card--purple">
                <div class="stat-info">
                  <h3 class="stat-label">TOTAL CUSTOMERS</h3>
                  <p class="stat-value">{{ stats().totalCustomers || 0 }}</p>
                </div>
                <div class="stat-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
              </div>
              <!-- Total Agents -->
              <div class="stat-card stat-card--orange">
                <div class="stat-info">
                  <h3 class="stat-label">TOTAL AGENTS</h3>
                  <p class="stat-value">{{ stats().totalAgents || 0 }}</p>
                </div>
                <div class="stat-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
              </div>
              <!-- Claims Officers -->
              <div class="stat-card stat-card--blue">
                <div class="stat-info">
                  <h3 class="stat-label">CLAIMS OFFICERS</h3>
                  <p class="stat-value">{{ stats().totalClaimsOfficers || 0 }}</p>
                </div>
                <div class="stat-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20h2"/><path d="M6 3v11c0 2.2 1.8 4 4 4h4c2.2 0 4-1.8 4-4V3"/><path d="M18 7H6"/><path d="M12 18v2"/></svg>
                </div>
              </div>
              <!-- Pending Policy Apps -->
              <div class="stat-card stat-card--orange-light">
                <div class="stat-info">
                  <h3 class="stat-label">PENDING POLICY APPS</h3>
                  <p class="stat-value">{{ stats().pendingApplications || 0 }}</p>
                </div>
                <div class="stat-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
              </div>
              <!-- Pending Claims -->
              <div class="stat-card stat-card--red-light">
                <div class="stat-info">
                  <h3 class="stat-label">PENDING CLAIMS</h3>
                  <p class="stat-value">{{ stats().pendingClaims || 0 }}</p>
                </div>
                <div class="stat-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
              </div>
              <!-- System Revenue -->
              <div class="stat-card stat-card--green">
                <div class="stat-info">
                  <h3 class="stat-label">SYSTEM REVENUE</h3>
                  <p class="stat-value">{{ (stats().totalSystemRevenue || 0) | currency:'INR':'symbol':'1.0-0' }}</p>
                </div>
                <div class="stat-icon-wrapper">
                  <span style="font-size: 18px; font-weight: 600; color: #9CA3AF;">₹</span>
                </div>
              </div>
            </div>

            <!-- Pending Sections Grid -->
            <div class="pending-grid">
              <!-- Pending Applications Card -->
              <div class="card pending-card">
                <div class="section-header">
                  <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <h2 class="card-title">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      Pending Policy Applications
                      <span class="count-badge">{{ unassignedApplications().length }}</span>
                    </h2>
                  </div>
                  <p class="section-desc">Applications awaiting agent assignment</p>
                </div>
                
                @if (unassignedApplications().length === 0) {
                  <div class="empty-state-check">
                    <div class="check-circle">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p>All policy applications have been assigned!</p>
                  </div>
                } @else {
                  <div class="compact-list">
                    @for (app of unassignedApplications().slice(0, 5); track app.id) {
                      <div class="list-item">
                        <div class="item-info">
                          <span class="item-name">{{ app.customerName }}</span>
                          <span class="item-sub">{{ app.policyProductName }}</span>
                        </div>
                        <div class="item-actions">
                          <button (click)="scrollToSection('detailed-applications')" class="btn-text">Assign Now</button>
                        </div>
                      </div>
                    }
                    @if (unassignedApplications().length > 5) {
                      <div class="view-more">And {{ unassignedApplications().length - 5 }} more...</div>
                    }
                  </div>
                }
              </div>

              <!-- Pending Claims Card -->
              <div class="card pending-card">
                <div class="section-header">
                  <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <h2 class="card-title">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      Pending Claims
                      <span class="count-badge count-badge--red">{{ unassignedClaims().length }}</span>
                    </h2>
                  </div>
                  <p class="section-desc">Claims awaiting claims officer assignment</p>
                </div>

                @if (unassignedClaims().length === 0) {
                  <div class="empty-state-check">
                    <div class="check-circle">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p>All claims have been assigned to officers!</p>
                  </div>
                } @else {
                  <div class="compact-list">
                    @for (claim of unassignedClaims().slice(0, 5); track claim.id) {
                      <div class="list-item">
                        <div class="item-info">
                          <span class="item-name">{{ claim.customerName || 'N/A' }}</span>
                          <span class="item-sub">{{ claim.policyProductName || 'N/A' }}</span>
                        </div>
                        <div class="item-actions">
                          <button (click)="scrollToSection('detailed-claims')" class="btn-text">Assign Now</button>
                        </div>
                      </div>
                    }
                    @if (unassignedClaims().length > 5) {
                      <div class="view-more">And {{ unassignedClaims().length - 5 }} more...</div>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Detailed Pending Sections -->
            @if (unassignedApplications().length > 0) {
              <div id="detailed-applications" class="card" style="margin-bottom: 24px;">
                <div class="section-header">
                  <h2 class="card-title">Detailed Pending Applications</h2>
                </div>
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer Name</th>
                        <th>Policy Name</th>
                        <th>Asset Type</th>
                        <th>Coverage</th>
                        <th>Premium</th>
                        <th>Submitted</th>
                        <th>Assign Agent</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (app of unassignedApplications(); track app.id) {
                        <tr>
                          <td><span class="id-badge">#{{ app.id }}</span></td>
                          <td><span class="customer-name">{{ app.customerName }}</span></td>
                          <td><span class="policy-name">{{ app.policyProductName || app.assetType }}</span></td>
                          <td>{{ app.assetType }}</td>
                          <td>{{ '₹' + app.coverageAmount.toLocaleString() }}</td>
                          <td class="price">{{ '₹' + app.calculatedPremium.toLocaleString() }}</td>
                          <td>{{ app.submittedAt | date:'mediumDate' }}</td>
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

            @if (unassignedClaims().length > 0) {
              <div id="detailed-claims" class="card" style="margin-bottom: 24px;">
                <div class="section-header">
                  <h2 class="card-title">Detailed Pending Claims</h2>
                </div>
                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Claim ID</th>
                        <th>Customer Name</th>
                        <th>Policy Name</th>
                        <th>Policy No.</th>
                        <th>Agent</th>
                        <th>Requested Claim Amount</th>
                        <th>Total Coverage</th>
                        <th>Incident Date</th>
                        <th>Assign Officer</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (claim of unassignedClaims(); track claim.id) {
                        <tr>
                          <td><span class="id-badge id-badge--red">#{{ claim.id }}</span></td>
                          <td><span class="customer-name">{{ claim.customerName || 'N/A' }}</span></td>
                          <td><span class="policy-name">{{ claim.policyProductName || 'N/A' }}</span></td>
                          <td>{{ claim.policyNumber }}</td>
                          <td>
                            @if (claim.agentName) {
                              <span class="agent-name">{{ claim.agentName }}</span>
                            } @else {
                              <span class="text-muted">Not Assigned</span>
                            }
                          </td>
                          <td class="price">{{ '₹' + claim.claimedAmount.toLocaleString() }}</td>
                          <td>{{ '₹' + (claim.totalCoverage || 0).toLocaleString() }}</td>
                          <td>{{ claim.incidentDate | date:'mediumDate' }}</td>
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

            <!-- Charts Section -->
            <div class="card charts-card">
              <div class="charts-header">
                <div>
                  <h2 class="card-title">Analytics & Insights</h2>
                  <p class="section-desc">Performance visualizations and trend analysis</p>
                </div>
                <div class="date-range-selector">
                  <span class="text-sm text-gray-500 mr-2">Range:</span>
                  <select [(ngModel)]="chartDays" (change)="loadChartData()" class="form-input-sm">
                    <option [value]="7">Last 7 Days</option>
                    <option [value]="30">Last 30 Days</option>
                    <option [value]="90">Last 90 Days</option>
                    <option [value]="365">Last Year</option>
                  </select>
                </div>
              </div>

              @if (isChartsLoading()) {
                <div class="charts-loading">
                  <div class="spinner"></div>
                  <p>Loading analytics data...</p>
                </div>
              } @else {
                <div class="charts-grid">
                  <!-- 1. Policies Over Time -->
                  <app-chart-widget
                    title="Policies Over Time"
                    [subtitle]="'Last ' + chartDays() + ' Days'"
                    chartType="line"
                    [chartData]="policiesOverTimeData()"
                    [chartOptions]="lineChartOptions"
                    (exportData)="handleChartExport($event, 'PoliciesOverTime')">
                  </app-chart-widget>

                  <!-- 2. Claims Trend & Resolution -->
                  <app-chart-widget
                    title="Claims Trend & Resolution"
                    [subtitle]="'Opened vs Resolved'"
                    chartType="bar"
                    [chartData]="claimsTrendData()"
                    [chartOptions]="comboChartOptions"
                    (exportData)="handleChartExport($event, 'ClaimsTrend')">
                  </app-chart-widget>

                  <!-- 3. Policy Status Breakdown -->
                  <app-chart-widget
                    title="Policy Applications by Status"
                    subtitle="Distribution over selected period"
                    chartType="bar"
                    [chartData]="policyStatusData()"
                    [chartOptions]="stackedBarOptions"
                    (exportData)="handleChartExport($event, 'PolicyStatus')">
                  </app-chart-widget>

                  <!-- 4. Profit & Revenue -->
                  <app-chart-widget
                    title="Profit & Revenue Breakdown"
                    subtitle="Revenue vs Costs"
                    chartType="doughnut"
                    [chartData]="revenueData()"
                    [chartOptions]="doughnutOptions"
                    (chartClicked)="onProfitChartClick($event)"
                    (exportData)="handleChartExport($event, 'RevenueBreakdown')">
                  </app-chart-widget>

                  <!-- 5. Top Agents -->
                  <app-chart-widget
                    title="Top Agents by Revenue"
                    subtitle="Leading performers"
                    chartType="bar"
                    [chartData]="topAgentsData()"
                    [chartOptions]="horizontalBarOptions"
                    (exportData)="handleChartExport($event, 'TopAgents')">
                  </app-chart-widget>

                  <!-- 6. Policies by Product -->
                  <app-chart-widget
                    title="Policies by Product"
                    subtitle="Market share"
                    chartType="doughnut"
                    [chartData]="policiesByProductData()"
                    [chartOptions]="doughnutOptions"
                    (exportData)="handleChartExport($event, 'PoliciesByProduct')">
                  </app-chart-widget>
                </div>
              }
            </div>
          }

          @if (activeTab() === 'users') {
            <div class="user-management-header" style="margin-bottom: 32px;">
              <h1 style="font-size: 28px; font-weight: 700; color: #1F2937; margin: 0;">User Management</h1>
              <p style="color: #6B7280; margin: 4px 0 0 0;">Create and manage staff accounts.</p>
            </div>

            <div class="user-management-grid">
              <!-- Left Column: Create Staff -->
              <div class="card creation-card">
                <div class="card-header-icon">
                  <div class="icon-box icon-box--purple">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                  </div>
                  <div>
                    <h2 class="card-title">Create Staff</h2>
                    <p class="section-desc">Add a new team member</p>
                  </div>
                </div>

                <form (ngSubmit)="submitCreateStaff()" #staffNgForm="ngForm" class="form-vertical" style="margin-top: 24px;" autocomplete="off">
                  <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" [(ngModel)]="staffForm.fullName" name="fullName" required class="form-input" placeholder="Enter full name" autocomplete="off">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" [(ngModel)]="staffForm.email" name="email" required email class="form-input" placeholder="name@shieldsure.com" #emailCtrl="ngModel" autocomplete="off">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Password</label>
                    <div class="password-input">
                      <input [type]="showStaffPassword() ? 'text' : 'password'" [(ngModel)]="staffForm.password" name="password" required minlength="8" class="form-input" placeholder="••••••••" #pwdCtrl="ngModel" autocomplete="new-password">
                      <button type="button" (click)="showStaffPassword.set(!showStaffPassword())" class="password-toggle">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Role</label>
                    <select [(ngModel)]="staffForm.role" name="role" required class="form-input">
                      <option value="" disabled selected>Select a role</option>
                      <option value="agent">Agent</option>
                      <option value="claimsOfficer">Claims Officer</option>
                    </select>
                  </div>
                  <button type="submit" class="btn btn-primary btn-block" style="background: #C4B5FD; color: white; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 12px;" [disabled]="!staffNgForm.valid || isCreatingStaff()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                    <span>{{ isCreatingStaff() ? 'Creating...' : 'Create Staff' }}</span>
                  </button>
                </form>
              </div>

              <!-- Right Column: Staff Members List -->
              <div class="card list-card">
                <div class="card-header-icon" style="margin-bottom: 24px;">
                  <div class="icon-box icon-box--blue">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <div>
                    <h2 class="card-title">Staff Members</h2>
                    <p class="section-desc">{{ allStaff().length }} total members</p>
                  </div>
                </div>

                <div class="search-box-modern" style="margin-bottom: 24px;">
                  <div class="search-input-wrapper">
                    <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" [ngModel]="staffSearch()" (ngModelChange)="staffSearch.set($event)" placeholder="Search by name or email..." class="search-input">
                  </div>
                </div>

                <div class="table-container-modern">
                  <table class="data-table-modern">
                    <thead>
                      <tr>
                         <th>Name</th>
                         <th>Email</th>
                         <th>Role</th>
                         <th>Status</th>
                         <th>Joined</th>
                         <th class="text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody>
                      @for (member of filteredStaff(); track member.id) {
                        <tr>
                          <td class="font-bold">{{ member.fullName }}</td>
                          <td class="text-gray">{{ member.email }}</td>
                             <td>
                             <span [class]="'role-badge role-badge--' + (member.role === 'Agent' ? 'purple' : 'gray')">
                               {{ member.role }}
                             </span>
                           </td>
                           <td>
                             <span [class]="'badge-pill ' + (member.isActive ? 'badge-pill--green' : 'badge-pill--red')">
                               {{ member.isActive ? 'Active' : 'Inactive' }}
                             </span>
                           </td>
                           <td class="text-gray">{{ member.joined }}</td>
                           <td class="text-right">
                             <button (click)="toggleStaffStatus(member)"
                               [class]="'btn btn-sm ' + (member.isActive ? 'btn-outline-red' : 'btn-outline-green')"
                               style="min-width: 100px;">
                               {{ member.isActive ? 'Deactivate' : 'Activate' }}
                             </button>
                           </td>
                         </tr>
                      }
                      @if (filteredStaff().length === 0) {
                        <tr>
                          <td colspan="6" class="empty-msg">No staff members found matching "{{ staffSearch() }}"</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          }

          @if (activeTab() === 'agents') {
            <!-- Agent Performance Header -->
            <div class="agent-performance-header" style="margin-bottom: 32px;">
              <h1 style="font-size: 28px; font-weight: 700; color: #1F2937; margin: 0;">Agent Performance</h1>
              <p style="color: #6B7280; margin: 4px 0 0 0;">Monitor and manage insurance agents</p>
            </div>

            <!-- Agent Stats Row -->
            <div class="agent-stats-grid" style="margin-bottom: 32px;">
              <div class="stat-card-mini stat-card-mini--purple">
                <div class="icon-box-mini icon-box-mini--purple">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div class="stat-mini-info">
                  <span class="stat-mini-label">Total Agents</span>
                  <span class="stat-mini-value">{{ agentStats().totalAgents }}</span>
                </div>
              </div>
              <div class="stat-card-mini stat-card-mini--green">
                <div class="icon-box-mini icon-box-mini--green">
                  <span style="font-size: 18px; font-weight: 600;">₹</span>
                </div>
                <div class="stat-mini-info">
                  <span class="stat-mini-label">Total Earnings</span>
                  <span class="stat-mini-value">{{ agentStats().totalEarnings | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
              </div>
              <div class="stat-card-mini stat-card-mini--blue">
                <div class="icon-box-mini icon-box-mini--blue">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                </div>
                <div class="stat-mini-info">
                  <span class="stat-mini-label">Active Policies</span>
                  <span class="stat-mini-value">{{ agentStats().activePolicies }}</span>
                </div>
              </div>
              <div class="stat-card-mini stat-card-mini--orange">
                <div class="icon-box-mini icon-box-mini--orange">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                </div>
                <div class="stat-mini-info">
                  <span class="stat-mini-label">Top Performer</span>
                  <span class="stat-mini-value font-semibold">{{ agentStats().topPerformer }}</span>
                </div>
              </div>
            </div>

            <!-- Agent Performance Table -->
            <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 32px; border: 1px solid #F3F4F6;">
              <div class="card-header-row" style="padding: 24px; border-bottom: 1px solid #F3F4F6;">
                <h2 class="card-title" style="margin: 0; font-size: 18px;">Agent Performance</h2>
                <div class="search-input-wrapper" style="width: 300px;">
                  <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" [ngModel]="agentSearch()" (ngModelChange)="agentSearch.set($event)" placeholder="Search agents..." class="search-input" style="padding: 8px 8px 8px 40px; font-size: 13px;">
                </div>
              </div>

              <div class="table-container">
                <table class="data-table-modern">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th class="text-center">Applications</th>
                      <th class="text-center">Approved</th>
                      <th class="text-center">Pending</th>
                      <th class="text-center">Policies</th>
                      <th class="text-right">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (agent of filteredAgents(); track agent.agentId; let i = $index) {
                      <tr>
                        <td class="text-gray">#{{ i + 1 }}</td>
                        <td class="font-bold">{{ agent.fullName }}</td>
                        <td class="text-gray">{{ agent.email }}</td>
                        <td class="text-center">{{ agent.totalApplications || 0 }}</td>
                        <td class="text-center">
                          <span class="badge-round badge-round--green">{{ agent.approvedApplications || 0 }}</span>
                        </td>
                        <td class="text-center">
                          <span class="badge-round badge-round--orange">{{ agent.pendingApplications || 0 }}</span>
                        </td>
                        <td class="text-center">
                          <span class="badge-round badge-round--blue">{{ agent.activePolicies || 0 }}</span>
                        </td>
                        <td class="text-right font-bold">{{ (agent.totalCommissions || 0) | currency:'INR':'symbol':'1.0-0' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Commission Earnings Card -->
            <div class="card" style="padding: 24px; border: 1px solid #F3F4F6;">
              <h2 class="card-title" style="margin-bottom: 24px; font-size: 18px;">Commission Earnings by Agent</h2>
              <div class="chart-container-modern">
                @for (agent of agentPerformance(); track agent.agentId) {
                  <div class="bar-row-modern">
                    <span class="bar-label">{{ agent.fullName }}</span>
                    <div class="bar-track-modern">
                      <div class="bar-fill-gradient" [style.width.%]="getCommissionPercentage(agent.totalCommissions)"></div>
                    </div>
                    <span class="bar-value">{{ (agent.totalCommissions || 0) | currency:'INR':'symbol':'1.0-0' }}</span>
                  </div>
                }
              </div>
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
            <!-- Policy Products Header -->
            <div class="agent-performance-header" style="margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h1 style="font-size: 28px; font-weight: 700; color: #1F2937; margin: 0;">Policy Products</h1>
                <p style="color: #6B7280; margin: 4px 0 0 0;">Manage insurance policy products and pricing</p>
              </div>
              <button (click)="openCreatePolicyModal()" class="btn-purple" style="padding: 10px 24px; border-radius: 12px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">+</span> Add New Policy
              </button>
            </div>

            <!-- Policy Products Management Card -->
            <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 32px; border: 1px solid #F3F4F6;">
              <div class="card-header-row" style="padding: 24px; border-bottom: 1px solid #F3F4F6;">
                <h2 class="card-title" style="margin: 0; font-size: 18px;">Policy Products Management</h2>
                <div class="search-input-wrapper" style="width: 300px;">
                  <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" [ngModel]="policySearch()" (ngModelChange)="policySearch.set($event)" placeholder="Search policies..." class="search-input" style="padding: 8px 8px 8px 40px; font-size: 13px;">
                </div>
              </div>

              <div class="table-container">
                <table class="data-table-modern">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Policy Name</th>
                      <th>Base Premium</th>
                      <th>Coverage</th>
                      <th>Tenure</th>
                      <th>Status</th>
                      <th class="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (policy of filteredPolicies(); track policy.id; let i = $index) {
                      <tr>
                        <td class="text-gray">#{{ i + 1 }}</td>
                        <td class="font-bold">{{ policy.name }}</td>
                        <td class="font-bold">{{ (policy.basePremium || 0) | currency:'INR':'symbol':'1.0-0' }}</td>
                        <td class="font-bold">{{ (policy.coverageAmount || 0) | currency:'INR':'symbol':'1.0-0' }}</td>
                        <td class="text-gray">{{ policy.tenureMonths || (policy.tenureYears * 12) }} months</td>
                        <td>
                          <span class="badge-pill badge-pill--green">Active</span>
                        </td>
                        <td class="text-right">
                          <div class="action-icons">
                            <button (click)="editPolicyProduct(policy)" class="icon-btn icon-btn--purple" title="Edit">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button class="icon-btn icon-btn--orange" title="Duplicate">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            </button>
                            <button (click)="deletePolicyProduct(policy.id)" class="icon-btn icon-btn--red" title="Delete">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                    @if (filteredPolicies().length === 0) {
                      <tr>
                        <td colspan="7" class="empty-msg">No policy products found matching "{{ policySearch() }}"</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          <!-- Create/Edit Policy Modal -->
          @if (showPolicyModal()) {
            <div class="modal-overlay" (click)="closePolicyModal()">
              <div class="modal-content" (click)="$event.stopPropagation()" style="max-width: 700px; padding: 0; overflow: hidden; border-radius: 20px;">
                <!-- Modal Close -->
                <button class="modal-close-new" (click)="closePolicyModal()">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>

                <div style="padding: 40px;">
                  <h2 style="font-size: 24px; font-weight: 700; color: #7C3AED; margin-bottom: 32px;">Create New Policy Product</h2>

                  <form (ngSubmit)="savePolicyProduct()" class="form-grid-modern">
                    <div class="form-field">
                      <label>Policy Name *</label>
                      <input type="text" [(ngModel)]="policyProduct.name" name="name" required placeholder="e.g., Home Insurance">
                    </div>

                    <div class="form-field">
                      <label>Base Premium (₹) *</label>
                      <input type="number" [(ngModel)]="policyProduct.basePremium" name="basePremium" required>
                    </div>

                    <div class="form-field full-width">
                      <label>Description *</label>
                      <textarea [(ngModel)]="policyProduct.description" name="description" required rows="4" placeholder="Describe the policy coverage and benefits"></textarea>
                    </div>

                    <div class="form-field">
                      <label>Coverage Amount (₹) *</label>
                      <input type="number" [(ngModel)]="policyProduct.coverageAmount" name="coverageAmount" required>
                    </div>

                    <div class="form-field">
                      <label>Tenure (Months) *</label>
                      <input type="number" [(ngModel)]="policyProduct.tenureMonths" name="tenureMonths" required>
                    </div>

                    <div class="form-field">
                      <label>Status</label>
                      <select [(ngModel)]="policyProduct.isActive" name="isActive">
                        <option [ngValue]="true">Active</option>
                        <option [ngValue]="false">Inactive</option>
                      </select>
                    </div>

                    <div class="full-width" style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
                      <button type="button" (click)="closePolicyModal()" class="btn-cancel">Cancel</button>
                      <button type="submit" class="btn-purple">Create Policy</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          }

          @if (activeTab() === 'customers') {
            <!-- Customers Header -->
            <div class="agent-performance-header" style="margin-bottom: 32px;">
              <h1 style="font-size: 28px; font-weight: 700; color: #1F2937; margin: 0;">Customer Management</h1>
              <p style="color: #6B7280; margin: 4px 0 0 0;">View and manage all registered customers</p>
            </div>

            <!-- Customer Search & Filter -->
            <div class="search-box-modern" style="margin-bottom: 24px;">
              <div class="search-input-wrapper" style="max-width: 500px;">
                <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" [ngModel]="customerSearch()" (ngModelChange)="customerSearch.set($event)" placeholder="Search customers by name, email or location..." class="search-input">
              </div>
            </div>

            <!-- Customers Table -->
            <div class="card" style="padding: 0; overflow: hidden; border: 1px solid #F3F4F6;">
              <div class="table-container">
                <table class="data-table-modern">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Contact Info</th>
                      <th>Personal Details</th>
                      <th>Location</th>
                      <th>Account Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (customer of filteredCustomers(); track customer.id) {
                      <tr>
                        <td>
                          <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: #F3F4F6; display: flex; align-items: center; justify-content: center; color: #7C3AED; font-weight: 700;">
                              {{ customer.fullName?.charAt(0) }}
                            </div>
                            <span class="font-bold">{{ customer.fullName }}</span>
                          </div>
                        </td>
                        <td>
                          <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span class="text-gray" style="font-size: 13px;">{{ customer.email }}</span>
                            <span class="text-gray" style="font-size: 13px;">{{ customer.phoneNumber || 'No phone' }}</span>
                          </div>
                        </td>
                        <td>
                          <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-size: 13px;"><span class="text-gray">Age:</span> {{ customer.age || 'N/A' }}</span>
                          </div>
                        </td>
                        <td>
                          <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-size: 13px;">{{ customer.city }}, {{ customer.state }}</span>
                            <span class="text-gray" style="font-size: 12px;">{{ customer.zipCode }}</span>
                          </div>
                        </td>
                        <td>
                          <span [class]="'badge-pill ' + (customer.isActive ? 'badge-pill--green' : 'badge-pill--red')">
                            {{ customer.isActive ? 'Active' : 'Inactive' }}
                          </span>
                        </td>
                      </tr>
                    }
                    @if (filteredCustomers().length === 0) {
                      <tr>
                        <td colspan="5" class="empty-msg">
                          @if (customerSearch()) {
                            No customers found matching "{{ customerSearch() }}"
                          } @else {
                            No customers registered in the system yet.
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          @if (activeTab() === 'applications') {
            <div class="agent-performance-header" style="margin-bottom: 32px;">
              <h1 style="font-size: 28px; font-weight: 700; color: #1F2937; margin: 0;">Policy Applications</h1>
              <p style="color: #6B7280; margin: 4px 0 0 0;">Review and assign agents to policy requests</p>
            </div>

            <div class="card" style="padding: 0; overflow: hidden; border: 1px solid #F3F4F6;">
              <div class="table-container">
                <table class="data-table-modern">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Product / Asset</th>
                      <th>Coverage / Premium</th>
                      <th>Status / Agent</th>
                      <th class="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (app of allApplications(); track app.id) {
                      <tr>
                        <td><span class="id-badge">#{{ app.id }}</span></td>
                        <td>
                          <div style="display: flex; flex-direction: column;">
                            <span class="font-bold">{{ app.customerName }}</span>
                            <span class="text-gray" style="font-size: 12px;">{{ app.customerEmail }}</span>
                          </div>
                        </td>
                        <td>
                          <div style="display: flex; flex-direction: column;">
                            <span class="font-bold">{{ app.policyProductName }}</span>
                            <span class="text-gray" style="font-size: 12px;">{{ app.assetType }} (₹{{ app.assetValue?.toLocaleString() }})</span>
                          </div>
                        </td>
                        <td>
                          <div style="display: flex; flex-direction: column;">
                            <span class="font-bold">₹{{ app.coverageAmount?.toLocaleString() }}</span>
                            <span class="text-gray" style="font-size: 12px;">Premium: ₹{{ app.calculatedPremium?.toLocaleString() }}</span>
                          </div>
                        </td>
                        <td>
                          <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span class="status-pill status-pill--{{ app.status.toLowerCase() == 'pending' ? 'orange' : 'green' }}">
                              {{ app.status }}
                            </span>
                            @if (app.agentName) {
                              <span class="text-gray" style="font-size: 11px;">Assigned: {{ app.agentName }}</span>
                            } @else {
                              <span class="text-gray" style="font-size: 11px; color: #EF4444;">Unassigned</span>
                            }
                          </div>
                        </td>
                        <td class="text-right">
                          @if (!app.agentId) {
                            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                              <select [(ngModel)]="selectedAgents[app.id]" class="search-input" style="padding: 4px 8px; width: 150px; border-radius: 8px;">
                                <option [ngValue]="undefined">Select Agent...</option>
                                @for (agent of availableAgents(); track agent.id) {
                                  <option [ngValue]="agent.id">{{ agent.fullName }}</option>
                                }
                              </select>
                              <button (click)="assignAgent(app.id)" class="btn-purple" style="padding: 6px 12px; font-size: 12px;">Assign</button>
                            </div>
                          } @else {
                             <span class="text-gray" style="font-size: 12px;">Agent Assigned</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          @if (activeTab() === 'invoices') {
            <div class="card">
              <div class="section-header">
                <h2 class="card-title">🧾 System-Wide Invoices</h2>
                <p class="section-desc">Search and manage invoices for any customer in the system</p>
              </div>

              <div class="search-box" style="margin-bottom: 24px;">
                <label class="form-label">Search Customer ID or Name</label>
                <div style="display: flex; gap: 12px;">
                  <input type="text" [(ngModel)]="adminInvoiceSearch" class="form-input" placeholder="Enter Customer ID..." style="flex: 1;">
                </div>
              </div>

              @if (adminInvoiceSearch) {
                <app-invoice-list [customerId]="+adminInvoiceSearch"></app-invoice-list>
              } @else {
                <div class="empty-state-box">
                  <span class="empty-icon">🔍</span>
                  <p>Enter a Customer ID to view their invoices.</p>
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
    }

    /* User Management Redesign Styles */
    .user-management-grid {
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: 32px;
      align-items: start;
    }

    .card-header-icon {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-box--purple {
      background: #F5F3FF;
      color: #7C3AED;
    }

    .icon-box--blue {
      background: #EFF6FF;
      color: #3B82F6;
    }

    .creation-card, .list-card {
      background: white;
      border: 1px solid #F3F4F6;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 16px;
      color: #9CA3AF;
    }

    .search-input {
      width: 100%;
      padding: 12px 12px 12px 48px;
      border: 1px solid #F3F4F6;
      border-radius: 10px;
      background: #F9FAFB;
      font-size: 14px;
      transition: all 0.2s;
    }

    .search-input:focus {
      outline: none;
      border-color: #7C3AED;
      background: white;
      box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.05);
    }

    .table-container-modern {
      overflow-x: auto;
    }

    .data-table-modern {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table-modern th {
      text-align: left;
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 600;
      color: #4B5563;
      border-bottom: 1px solid #F3F4F6;
    }

    .data-table-modern td {
      padding: 16px;
      font-size: 14px;
      color: #1F2937;
      border-bottom: 1px solid #F3F4F6;
    }

    .data-table-modern tr:last-child td {
      border-bottom: none;
    }

    .role-badge {
      display: inline-flex;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }

    .role-badge--purple {
      background: #7C3AED;
      color: white;
    }

    .role-badge--gray {
      background: #F3F4F6;
      color: #374151;
    }

    .text-gray { color: #6B7280; }
    .font-bold { font-weight: 700; }
    .empty-msg {
      text-align: center;
      padding: 32px;
      color: #9CA3AF;
      font-style: italic;
    }

    /* Agent Performance Redesign Styles */
    .agent-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    .stat-card-mini {
      background: white;
      padding: 16px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid #F3F4F6;
      border-left-width: 4px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .stat-card-mini--purple { border-left-color: #8B5CF6; }
    .stat-card-mini--green  { border-left-color: #10B981; }
    .stat-card-mini--blue   { border-left-color: #3B82F6; }
    .stat-card-mini--orange { border-left-color: #F59E0B; }

    .icon-box-mini {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-box-mini--purple { background: #F5F3FF; color: #7C3AED; }
    .icon-box-mini--green  { background: #ECFDF5; color: #10B981; }
    .icon-box-mini--blue   { background: #EFF6FF; color: #3B82F6; }
    .icon-box-mini--orange { background: #FFFBEB; color: #D97706; }

    .stat-mini-info {
      display: flex;
      flex-direction: column;
    }

    .stat-mini-label {
      font-size: 11px;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .stat-mini-value {
      font-size: 18px;
      font-weight: 700;
      color: #1F2937;
    }

    .badge-round {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-round--green  { background: #ECFDF5; color: #10B981; }
    .badge-round--orange { background: #FFF7ED; color: #C2410C; }
    .badge-round--blue   { background: #EFF6FF; color: #1D4ED8; }

    .text-center { text-align: center; }
    .text-right { text-align: right; }

    .chart-container-modern {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .bar-row-modern {
      display: grid;
      grid-template-columns: 140px 1fr 100px;
      align-items: center;
      gap: 16px;
    }

    .bar-label {
      font-size: 13px;
      color: #4B5563;
    }

    .bar-track-modern {
      height: 8px;
      background: #F3F4F6;
      border-radius: 999px;
      overflow: hidden;
    }

    .bar-fill-gradient {
      height: 100%;
      background: linear-gradient(90deg, #8B5CF6 0%, #3B82F6 100%);
      border-radius: 999px;
      transition: width 1s ease-out;
    }

    .bar-value {
      font-size: 13px;
      font-weight: 600;
      color: #1F2937;
      text-align: right;
    }

    /* Original Styles Integration */

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
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-left: 5px solid #265C98;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.1);
    }

    .stat-card--purple { border-left-color: #8B5CF6; }
    .stat-card--orange { border-left-color: #F59E0B; }
    .stat-card--blue   { border-left-color: #3B82F6; }
    .stat-card--orange-light { border-left-color: #FB923C; }
    .stat-card--red-light { border-left-color: #F87171; }
    .stat-card--green  { border-left-color: #10B981; }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .stat-label {
      font-size: 11px;
      font-weight: 700;
      color: #9CA3AF;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 800;
      color: #1F2937;
      margin: 0;
      line-height: 1;
    }

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #F3F4F6;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9CA3AF;
    }

    /* Pending Grid */
    .pending-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }

    .pending-card {
      min-height: 300px;
      display: flex;
      flex-direction: column;
    }

    /* Empty State Check */
    .empty-state-check {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 20px;
      color: #6B7280;
    }

    .check-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #ECFDF5;
      color: #10B981;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .empty-state-check p {
      font-weight: 500;
      font-size: 15px;
      max-width: 200px;
      line-height: 1.5;
    }

    /* Compact List Styling */
    .compact-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .list-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: #F9FAFB;
      border-radius: 10px;
      transition: background 0.2s;
    }

    .item-info {
      display: flex;
      flex-direction: column;
    }

    .item-name {
      font-weight: 600;
      font-size: 14px;
      color: #1F2937;
    }

    .item-sub {
      font-size: 12px;
      color: #6B7280;
    }

    .btn-text {
      background: none;
      border: none;
      color: #7C3AED;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .btn-text:hover {
      background: #EDE9FE;
    }

    .view-more {
      text-align: center;
      font-size: 12px;
      color: #9CA3AF;
      margin-top: 8px;
    }

    /* Section header inside card */
    .section-header {
      margin-bottom: 20px;
    }

    .card-title {
      font-size: 18px;
      font-weight: 700;
      color: #1F2937;
      margin: 0;
      display: flex;
      align-items: center;
    }

    .section-desc {
      font-size: 13px;
      color: #9CA3AF;
      margin: 4px 0 0 0;
    }

    /* Count badge next to title */
    .count-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      border-radius: 50%;
      background: #F3F4F6;
      color: #6B7280;
      font-size: 11px;
      font-weight: 700;
      margin-left: 8px;
    }

    .count-badge--red {
      background: #FEE2E2;
      color: #EF4444;
    }

    /* Table cell decorators */
    .id-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      background: #F3F4F6;
      color: #6B7280;
      font-size: 11px;
      font-weight: 600;
    }

    .id-badge--red {
      background: #FEF2F2;
      color: #EF4444;
    }

    .customer-name {
      font-weight: 600;
      color: #374151;
    }

    .policy-name {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 8px;
      background: #F5F3FF;
      color: #7C3AED;
      font-size: 12px;
      font-weight: 600;
    }

    .text-muted {
      color: #9CA3AF;
      font-style: italic;
      font-size: 13px;
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

    .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .card-header-row .card-title {
      margin: 0;
    }

    .btn-icon {
      font-size: 18px;
      margin-right: 4px;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .badge-inactive {
      background: #F3F4F6;
      color: #6B7280;
    }

    .btn-warning {
      background: #F59E0B;
      color: white;
    }

    .btn-warning:hover {
      background: #D97706;
    }

    .btn-success {
      background: #10B981;
      color: white;
    }

    .btn-success:hover {
      background: #059669;
    }

    .btn-danger {
      background: #EF4444;
      color: white;
    }

    .btn-danger:hover {
      background: #DC2626;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 600px;
      width: 100%;
      position: relative;
      animation: slideUp 0.3s ease;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-large {
      max-width: 800px;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-close {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(0, 0, 0, 0.05);
      color: #64748b;
      font-size: 20px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-close:hover {
      background: rgba(0, 0, 0, 0.1);
      transform: rotate(90deg);
    }

    .modal-header {
      margin-bottom: 24px;
    }

    .modal-title {
      font-size: 24px;
      font-weight: 700;
      color: #265C98;
      margin: 0;
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

    .agent-name {
      color: #3A7EB4;
      font-weight: 500;
    }

    .text-muted {
      color: #A872C2;
      font-style: italic;
    }

    /* Charts Layout Grid */
    .charts-card {
      padding: 0;
      overflow: hidden;
    }

    .charts-header {
      padding: 24px;
      border-bottom: 1px solid #E5E7EB;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #F9FAFB;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      padding: 24px;
    }

    @media (max-width: 1024px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }

    .charts-loading {
      padding: 60px;
      text-align: center;
      color: #6B7280;
    }

    .spinner {
      margin: 0 auto 10px;
      width: 32px;
      height: 32px;
      border: 3px solid rgba(58, 126, 180, 0.2);
      border-radius: 50%;
      border-top-color: #3A7EB4;
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Policy Products Specific */
    .btn-purple {
      background: #7C3AED;
      color: white;
      border: none;
      transition: background 0.2s;
      cursor: pointer;
    }

    .btn-purple:hover {
      background: #6D28D9;
    }

    .btn-cancel {
      background: #F3F4F6;
      color: #374151;
      padding: 10px 24px;
      border-radius: 12px;
      border: none;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-cancel:hover {
      background: #E5E7EB;
    }

    .badge-pill {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-pill--green {
      background: #D1FAE5;
      color: #065F46;
    }

    .badge-pill--red {
      background: #FEE2E2;
      color: #991B1B;
    }

    .btn-outline-red {
      background: transparent;
      border: 1px solid #EF4444;
      color: #EF4444;
    }

    .btn-outline-red:hover {
      background: #FEE2E2;
    }

    .btn-outline-green {
      background: transparent;
      border: 1px solid #10B981;
      color: #10B981;
    }

    .btn-outline-green:hover {
      background: #D1FAE5;
    }

    .action-icons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .icon-btn {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s;
    }

    .icon-btn:hover {
      opacity: 0.7;
    }

    .icon-btn--purple { color: #8B5CF6; }
    .icon-btn--orange { color: #F59E0B; }
    .icon-btn--red { color: #EF4444; }

    /* Modal New Styles */
    .modal-close-new {
      position: absolute;
      top: 24px;
      right: 24px;
      background: none;
      border: none;
      color: #9CA3AF;
      cursor: pointer;
      transition: color 0.2s;
      z-index: 10;
    }

    .modal-close-new:hover {
      color: #4B5563;
    }

    .form-grid-modern {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-field.full-width {
      grid-column: span 2;
    }

    .form-field label {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .form-field input, .form-field textarea, .form-field select {
      padding: 12px 16px;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      font-size: 14px;
      transition: border-color 0.2s, box-shadow 0.2s;
      background: #F9FAFB;
    }

    .form-field input:focus, .form-field textarea:focus, .form-field select:focus {
      outline: none;
      border-color: #8B5CF6;
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
      background: white;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  activeTab = signal('overview');
  stats = signal<any>({});
  staffForm: any = { fullName: '', email: '', password: '', role: 'agent' };
  isCreatingStaff = signal(false);
  policyProduct: any = {
    name: '',
    description: '',
    basePremium: 0,
        coverageAmount: 0,
        tenureMonths: 12,
        isActive: true
      };
      allPolicyProducts = signal<any[]>([]);
      showPolicyModal = signal(false);
      isEditMode = signal(false);
      editingPolicyId: number | null = null;
      allApplications = signal<any[]>([]);
      unassignedApplications = signal<any[]>([]);
      availableAgents = signal<any[]>([]);
      selectedAgents: { [key: number]: number } = {};
      selectedPolicyAgents: { [key: number]: number } = {};
      unassignedClaims = signal<any[]>([]);
      availableOfficers = signal<any[]>([]);
      selectedOfficers: { [key: number]: number } = {};
      allPolicies = signal<any[]>([]);
      agentPerformance = signal<any[]>([]);
      officerPerformance = signal<any[]>([]);
      showStaffPassword = signal(false);
      adminInvoiceSearch: string = '';
      staffSearch = signal('');
      allCustomers = signal<any[]>([]);
      customerSearch = signal('');

      filteredCustomers = computed(() => {
        const search = this.customerSearch().toLowerCase();
        const customers = this.allCustomers();
        if (!search) return customers;
        return customers.filter(c => 
          c.fullName?.toLowerCase().includes(search) || 
          c.email?.toLowerCase().includes(search) ||
          c.city?.toLowerCase().includes(search) ||
          c.state?.toLowerCase().includes(search)
        );
      });

      // Combined Staff Data
      allStaff = computed(() => {
        const agents = this.agentPerformance().map(a => ({
          id: a.agentId,
          fullName: a.fullName,
          email: a.email,
          role: 'Agent',
          joined: '2024-03-15',
          isActive: a.isActive
        }));
        const officers = this.officerPerformance().map(o => ({
          id: o.officerId,
          fullName: o.fullName,
          email: o.email,
          role: 'Claims Officer',
          joined: '2024-03-10',
          isActive: o.isActive
        }));
        return [...agents, ...officers];
      });

      filteredStaff = computed(() => {
        const search = this.staffSearch().toLowerCase();
        if (!search) return this.allStaff();
        return this.allStaff().filter(s => 
          s.fullName.toLowerCase().includes(search) || 
          s.email.toLowerCase().includes(search)
        );
      });

      agentSearch = signal('');
      
      agentStats = computed(() => {
        const agents = this.agentPerformance();
        const totalAgents = agents.length;
        const totalEarnings = agents.reduce((sum, a) => sum + (a.totalCommissions || 0), 0);
        const activePolicies = agents.reduce((sum, a) => sum + (a.activePolicies || 0), 0);
        
        let topPerformer = 'N/A';
        if (agents.length > 0) {
          const top = [...agents].sort((a, b) => (b.totalCommissions || 0) - (a.totalCommissions || 0))[0];
          topPerformer = top.fullName;
        }

        return { totalAgents, totalEarnings, activePolicies, topPerformer };
      });

      filteredAgents = computed(() => {
        const search = this.agentSearch().toLowerCase();
        if (!search) return this.agentPerformance();
        return this.agentPerformance().filter(a => 
          a.fullName.toLowerCase().includes(search) || 
          a.email.toLowerCase().includes(search)
        );
      });

      policySearch = signal('');
      filteredPolicies = computed(() => {
        const search = this.policySearch().toLowerCase();
        if (!search) return this.allPolicyProducts();
        return this.allPolicyProducts().filter(p => 
          p.name.toLowerCase().includes(search) || 
          p.description.toLowerCase().includes(search)
        );
      });

      notification = signal<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
      });

      // Charts Data & Config
      chartDays = signal(30);
      isChartsLoading = signal(true);
      
      policiesOverTimeData = signal<ChartConfiguration['data']>({ datasets: [] });
      claimsTrendData = signal<ChartConfiguration['data']>({ datasets: [] });
      policyStatusData = signal<ChartConfiguration['data']>({ datasets: [] });
      revenueData = signal<ChartConfiguration['data']>({ datasets: [] });
      topAgentsData = signal<ChartConfiguration['data']>({ datasets: [] });
      policiesByProductData = signal<ChartConfiguration['data']>({ datasets: [] });

      lineChartOptions: any = {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: { mode: 'index', intersect: false }
        },
        elements: { line: { tension: 0.4 } }
      };

      stackedBarOptions: any = {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { stacked: true },
          y: { stacked: true }
        }
      };

      doughnutOptions: any = {
        responsive: true,
        plugins: {
          legend: { position: 'right' }
        }
      };

      horizontalBarOptions: any = {
        responsive: true,
        indexAxis: 'y',
        plugins: { legend: { display: false } }
      };

      comboChartOptions: any = {
        responsive: true,
        scales: {
          y: { type: 'linear', display: true, position: 'left' },
          y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } }
        }
      };
      sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'System Overview', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'agents', label: 'Agents', icon: '🤵' },
    { id: 'officers', label: 'Claims Officers', icon: '👨‍💼' },
    { id: 'applications', label: 'Policy Applications', icon: '📝' },
    { id: 'customers', label: 'Customers', icon: '👤' },
    { id: 'policies', label: 'Policy Products', icon: '📋' },
    { id: 'invoices', label: 'System Invoices', icon: '🧾' }
  ];

  constructor(private authService: AuthService, private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadStats();
    this.loadAllApplications();
    this.loadAllPolicies();
    this.loadAgentPerformance();
    this.loadOfficerPerformance();
    this.loadAvailableAgents();
    this.loadAvailableOfficers();
    this.loadUnassignedClaims();
    this.loadAllPolicyProducts();
    this.loadAllCustomers();
    this.loadChartData();
  }

  getPageTitle(): string {
    const titles: any = {
      overview: 'System Overview',
      users: 'User Management',
      agents: 'Agent Performance',
      officers: 'Claims Officer Performance',
      customers: 'Customer Management',
      policies: 'Policy Products Management',
      invoices: 'System Invoices'
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

  assignAgentToPolicy(policyId: number): void {
    const agentId = this.selectedPolicyAgents[policyId];
    if (!agentId) {
      this.showNotification('Please select an agent', 'error');
      return;
    }

    this.apiService.assignAgentToPolicy(policyId, agentId).subscribe({
      next: () => {
        this.showNotification('Agent assigned to policy successfully!', 'success');
        this.loadAllPolicies();
        this.loadAgentPerformance();
        delete this.selectedPolicyAgents[policyId];
      },
      error: (err) => this.showNotification(err.error?.message || 'Failed to assign agent to policy', 'error')
    });
  }

  reassignPolicyAgent(policy: any): void {
    const currentAgent = policy.agentName || 'Unknown';
    if (!confirm(`Current agent: ${currentAgent}\n\nDo you want to reassign this policy to a different agent?`)) {
      return;
    }

    // Set the policy to allow reassignment
    policy.agentId = null;
    this.selectedPolicyAgents[policy.id] = 0;
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

  loadAllCustomers(): void {
    this.apiService.getAllCustomers().subscribe({
      next: (data) => this.allCustomers.set(data),
      error: () => this.allCustomers.set([])
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

  submitCreateStaff(): void {
    if (!this.staffForm.fullName || !this.staffForm.email || !this.staffForm.password || !this.staffForm.role) {
      this.showNotification('Please fill all required fields.', 'error');
      return;
    }
    
    this.isCreatingStaff.set(true);
    this.apiService.createStaff(this.staffForm).subscribe({
      next: () => {
        const createdRole = this.staffForm.role;
        const roleDisplay = createdRole === 'agent' ? 'Agent' : 'Claims Officer';
        this.showNotification(`${roleDisplay} created successfully!`, 'success');
        this.staffForm = { fullName: '', email: '', password: '', role: 'agent' };
        this.isCreatingStaff.set(false);
        this.loadStats();
        
        if (createdRole === 'agent') {
            this.loadAvailableAgents();
            this.loadAgentPerformance();
        } else {
            this.loadAvailableOfficers();
            this.loadOfficerPerformance();
        }
      },
      error: (err) => {
        this.isCreatingStaff.set(false);
        const errMsg = err.error?.message || 'Failed to create staff - try again';
        this.showNotification(errMsg, 'error');
      }
    });
  }

  createPolicyProduct(): void {
    this.apiService.createPolicyProduct(this.policyProduct).subscribe({
      next: () => {
        this.showNotification('Policy Product created successfully!', 'success');
        this.policyProduct = { name: '', description: '', basePremium: 0, coverageAmount: 0, tenureMonths: 12, isActive: true };
        this.loadAllPolicyProducts();
      },
      error: (err) => this.showNotification(err.error?.message || 'Failed to create policy product', 'error')
    });
  }

  loadAllPolicyProducts(): void {
    this.apiService.getAllPolicyProducts().subscribe({
      next: (data) => this.allPolicyProducts.set(data),
      error: () => this.allPolicyProducts.set([])
    });
  }

  openCreatePolicyModal(): void {
    this.isEditMode.set(false);
    this.editingPolicyId = null;
    this.policyProduct = {
      name: '',
      description: '',
      basePremium: 0,
      coverageAmount: 0,
      tenureMonths: 12,
      isActive: true
    };
    this.showPolicyModal.set(true);
  }

  editPolicyProduct(policy: any): void {
    this.isEditMode.set(true);
    this.editingPolicyId = policy.id;
    this.policyProduct = { ...policy };
    this.showPolicyModal.set(true);
  }

  closePolicyModal(): void {
    this.showPolicyModal.set(false);
    this.isEditMode.set(false);
    this.editingPolicyId = null;
    this.policyProduct = {
      name: '',
      description: '',
      basePremium: 0,
      coverageAmount: 0,
      tenureMonths: 12,
      isActive: true
    };
  }

  savePolicyProduct(): void {
    if (this.isEditMode() && this.editingPolicyId) {
      // Update existing policy
      this.apiService.updatePolicyProduct(this.editingPolicyId, this.policyProduct).subscribe({
        next: () => {
          this.showNotification('Policy Product updated successfully!', 'success');
          this.closePolicyModal();
          this.loadAllPolicyProducts();
        },
        error: (err) => this.showNotification(err.error?.message || 'Failed to update policy product', 'error')
      });
    } else {
      // Create new policy
      this.createPolicyProduct();
      this.closePolicyModal();
    }
  }

  togglePolicyStatus(policy: any): void {
    const newStatus = !policy.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    if (!confirm(`Are you sure you want to ${action} "${policy.name}"?`)) {
      return;
    }

    this.apiService.updatePolicyProduct(policy.id, { ...policy, isActive: newStatus }).subscribe({
      next: () => {
        this.showNotification(`Policy ${action}d successfully!`, 'success');
        this.loadAllPolicyProducts();
      },
      error: (err) => this.showNotification(err.error?.message || `Failed to ${action} policy`, 'error')
    });
  }

  deletePolicyProduct(policyId: number): void {
    const policy = this.allPolicyProducts().find(p => p.id === policyId);
    if (!confirm(`Are you sure you want to delete "${policy?.name}"? This action cannot be undone.`)) {
      return;
    }

    this.apiService.deletePolicyProduct(policyId).subscribe({
      next: () => {
        this.showNotification('Policy Product deleted successfully!', 'success');
        this.loadAllPolicyProducts();
      },
      error: (err) => this.showNotification(err.error?.message || 'Failed to delete policy product', 'error')
    });
  }

  toggleStaffStatus(member: any): void {
    const action = member.isActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} ${member.fullName}?`)) {
        return;
    }

    const request = member.role === 'Agent' 
        ? this.apiService.toggleAgentStatus(member.id)
        : this.apiService.toggleOfficerStatus(member.id);

    request.subscribe({
        next: () => {
            this.showNotification(`${member.role} ${action}d successfully!`, 'success');
            if (member.role === 'Agent') {
                this.loadAgentPerformance();
                this.loadAvailableAgents();
            } else {
                this.loadOfficerPerformance();
                this.loadAvailableOfficers();
            }
        },
        error: (err) => this.showNotification(err.error?.message || `Failed to ${action} staff`, 'error')
    });
  }

  logout(): void {
    this.authService.logout();
  }

  getCommissionPercentage(commission: number): number {
    if (!commission || commission <= 0) return 0;
    const allExpectedCommissions = this.agentPerformance().map(a => a.totalCommissions || 0);
    const maxVal = Math.max(...allExpectedCommissions, 1);
    return (commission / maxVal) * 100;
  }

  loadChartData(): void {
    this.isChartsLoading.set(true);
    this.apiService.getAdminChartData(this.chartDays()).subscribe({
      next: (data) => {
        // 1. Policies Over Time
        this.policiesOverTimeData.set({
          labels: data.policiesOverTime.map((d: any) => d.date),
          datasets: [
            { data: data.policiesOverTime.map((d: any) => d.newPolicies), label: 'New Policies', borderColor: '#3A7EB4', backgroundColor: 'rgba(58,126,180,0.1)', fill: true },
            { data: data.policiesOverTime.map((d: any) => d.renewals), label: 'Renewals', borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true }
          ]
        });

        // 2. Claims Trend
        this.claimsTrendData.set({
          labels: data.claimsTrend.map((d: any) => d.date),
          datasets: [
            { type: 'bar', label: 'Opened', data: data.claimsTrend.map((d: any) => d.opened), backgroundColor: '#F87171', yAxisID: 'y' },
            { type: 'bar', label: 'Resolved', data: data.claimsTrend.map((d: any) => d.resolved), backgroundColor: '#34D399', yAxisID: 'y' },
            { type: 'line', label: 'Avg Resolution Time (Days)', data: data.claimsTrend.map((d: any) => d.avgResolutionDays), borderColor: '#8B5CF6', yAxisID: 'y1' }
          ]
        });

        // 3. Policy Status Breakdown
        this.policyStatusData.set({
          labels: ['Total Applications'],
          datasets: [
            { data: [data.policyStatusBreakdown.approved], label: 'Approved', backgroundColor: '#34D399' },
            { data: [data.policyStatusBreakdown.pending], label: 'Pending', backgroundColor: '#FBBF24' },
            { data: [data.policyStatusBreakdown.rejected], label: 'Rejected', backgroundColor: '#F87171' }
          ]
        });

        // 4. Revenue Breakdown
        this.revenueData.set({
          labels: ['Agent Commission', 'Net Profit'],
          datasets: [
            {
              data: [data.profitAndRevenue.agentCommission, data.profitAndRevenue.profit],
              backgroundColor: ['#F59E0B', '#10B981']
            }
          ]
        });

        // 5. Top Agents
        this.topAgentsData.set({
          labels: data.topAgents.map((a: any) => a.agentName),
          datasets: [
            { data: data.topAgents.map((a: any) => a.revenue), label: 'Revenue Generated', backgroundColor: '#3B82F6' },
            { data: data.topAgents.map((a: any) => a.commission), label: 'Commission Earned', backgroundColor: '#F59E0B' }
          ]
        });

        // 6. Policies By Product
        this.policiesByProductData.set({
          labels: data.policiesByProduct.map((p: any) => p.productName),
          datasets: [
            {
              data: data.policiesByProduct.map((p: any) => p.count),
              backgroundColor: ['#6366F1', '#EC4899', '#8B5CF6', '#14B8A6', '#F59E0B']
            }
          ]
        });

        this.isChartsLoading.set(false);
      },
      error: () => {
        this.showNotification('Failed to load chart analytics.', 'error');
        this.isChartsLoading.set(false);
      }
    });
  }

  handleChartExport(format: string, chartName: string) {
     this.showNotification(`Exported ${chartName} as ${format.toUpperCase()}`, 'success');
  }

  onProfitChartClick(activeElements: any) {
     // Optional Drilldown feature placeholder
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
