import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sidebar" [class.collapsed]="collapsed">
      <!-- Logo -->
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-shield">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="shield-svg">
              <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="#7C3AED" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill="#7C3AED" fill-opacity="0.1"/>
            </svg>
          </div>
          <span class="logo-text">ShieldSure</span>
        </div>
      </div>

      <!-- User Profile Section -->
      <div class="user-profile">
        <div class="avatar-circle">
          <span>{{ getInitials() }}</span>
        </div>
        <div class="user-meta">
          <h3 class="user-display-name">{{ userName }}</h3>
          <p class="user-display-role">{{ userRole }}</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        @for (item of items; track item.id) {
          <button 
            class="nav-item"
            [class.active]="activeItem === item.id"
            (click)="onItemClick(item.id)">
            <span class="nav-icon-wrapper">
              <ng-container [ngSwitch]="item.id">
                <!-- System & Agent Dashboards -->
                <svg *ngSwitchCase="'overview'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                <svg *ngSwitchCase="'insights'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                <svg *ngSwitchCase="'applications'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <svg *ngSwitchCase="'customers'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <svg *ngSwitchCase="'browse'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                
                <!-- Management -->
                <svg *ngSwitchCase="'users'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <svg *ngSwitchCase="'agents'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
                <svg *ngSwitchCase="'officers'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/><path d="M21 7V3h-4"/><path d="M3 11h4"/><path d="M3 17h4"/></svg>
                <svg *ngSwitchCase="'policies'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8V21a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><path d="M21 3H3"/><path d="M10 12h4"/></svg>
                <svg *ngSwitchCase="'invoices'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                
                <!-- Fallbacks -->
                <svg *ngSwitchCase="'profile'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <svg *ngSwitchCase="'claims'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                
                <span *ngSwitchDefault class="nav-icon">{{ item.icon }}</span>
              </ng-container>
            </span>
            <span class="nav-label">{{ item.label }}</span>
            @if (item.badge) {
              <span class="nav-badge">{{ item.badge }}</span>
            }
          </button>
        }
      </nav>

      <!-- Bottom Actions -->
      <div class="sidebar-footer">
        <button class="footer-btn action-collapse" (click)="toggleCollapse()">
          <span class="footer-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [style.transform]="collapsed ? 'rotate(180deg)' : 'none'">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </span>
          <span class="footer-label">Collapse</span>
        </button>
        <button class="footer-btn action-logout" (click)="onLogout()">
          <span class="footer-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span class="footer-label">Logout</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary: #7C3AED;
      --primary-soft: #EDE9FE;
      --text-main: #1F2937;
      --text-muted: #6B7280;
      --border-color: #F3F4F6;
      --sidebar-bg: #FFFFFF;
      --active-bg: #7C3AED;
      --active-text: #FFFFFF;
    }

    .sidebar {
      width: 250px;
      height: 100vh;
      background: var(--sidebar-bg);
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      border-right: 1px solid var(--border-color);
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 100;
      box-shadow: 4px 0 10px rgba(0,0,0,0.02);
    }

    .sidebar.collapsed {
      width: 80px;
    }

    /* Logo Section */
    .sidebar-header {
      padding: 32px 24px;
      margin-bottom: 8px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-shield {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
    }

    .logo-text {
      font-size: 22px;
      font-weight: 800;
      color: var(--text-main);
      letter-spacing: -0.5px;
      transition: opacity 0.2s;
    }

    /* User Profile Section */
    .user-profile {
      padding: 16px 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 16px;
    }

    .avatar-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #7C3AED;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      flex-shrink: 0;
      box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2);
    }

    .user-meta {
      flex: 1;
      min-width: 0;
      transition: opacity 0.2s;
    }

    .user-display-name {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-display-role {
      font-size: 11px;
      font-weight: 500;
      color: var(--text-muted);
      margin: 2px 0 0 0;
      text-transform: capitalize;
    }

    /* Navigation */
    .sidebar-nav {
      flex: 1;
      padding: 0 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      background: transparent;
      border: none;
      border-radius: 12px;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      text-align: left;
      font-family: inherit;
    }

    .nav-item:hover {
      background: #F9FAFB;
      color: var(--text-main);
    }

    .nav-item.active {
      background: var(--active-bg);
      color: var(--active-text);
      box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.2);
    }

    .nav-icon-wrapper {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .nav-label {
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: opacity 0.2s;
    }

    /* Footer Actions */
    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .footer-btn {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      background: transparent;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
      font-family: inherit;
    }

    .footer-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .footer-label {
      font-size: 14px;
      font-weight: 600;
    }

    .action-collapse {
      color: var(--text-muted);
    }

    .action-collapse:hover {
      background: #F9FAFB;
    }

    .action-logout {
      color: #EF4444;
    }

    .action-logout:hover {
      background: #FEF2F2;
    }

    /* Collapsed State Handling */
    .sidebar.collapsed .logo-text,
    .sidebar.collapsed .user-meta,
    .sidebar.collapsed .nav-label,
    .sidebar.collapsed .footer-label {
      opacity: 0;
      pointer-events: none;
      width: 0;
      margin: 0;
    }

    .sidebar.collapsed .sidebar-header,
    .sidebar.collapsed .user-profile {
      justify-content: center;
      padding: 16px 0;
    }

    .sidebar.collapsed .sidebar-nav,
    .sidebar.collapsed .sidebar-footer {
      padding: 16px 8px;
    }
  `]
})
export class SidebarComponent {
  @Input() userName: string = '';
  @Input() userRole: string = '';
  @Input() items: SidebarItem[] = [];
  @Input() activeItem: string = '';
  @Input() collapsed: boolean = false;
  @Output() itemClick = new EventEmitter<string>();
  @Output() toggle = new EventEmitter<boolean>();
  @Output() logout = new EventEmitter<void>();

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.toggle.emit(this.collapsed);
  }

  getInitials(): string {
    if (!this.userName) return 'AK';
    return this.userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  onItemClick(itemId: string): void {
    this.itemClick.emit(itemId);
  }

  onLogout(): void {
    this.logout.emit();
  }

  isEmoji(icon: string): boolean {
    if (!icon) return false;
    const charCount = [...icon].length;
    return charCount <= 2;
  }
}
