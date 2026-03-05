import { Component, Input, Output, EventEmitter } from '@angular/core';
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
    <div class="sidebar">
      <!-- Logo -->
      <div class="sidebar-header">
        <div class="logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 2L4 8V14C4 21.18 9.84 27.92 16 30C22.16 27.92 28 21.18 28 14V8L16 2Z" fill="white"/>
          </svg>
          <span class="logo-text">CDIMS</span>
        </div>
      </div>

      <!-- User Info -->
      <div class="user-info">
        <div class="user-avatar">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#3A7EB4"/>
            <path d="M20 20C23.3137 20 26 17.3137 26 14C26 10.6863 23.3137 8 20 8C16.6863 8 14 10.6863 14 14C14 17.3137 16.6863 20 20 20Z" fill="white"/>
            <path d="M20 22C13.3726 22 8 25.134 8 29V32H32V29C32 25.134 26.6274 22 20 22Z" fill="white"/>
          </svg>
        </div>
        <div class="user-details">
          <p class="user-greeting">Welcome,</p>
          <p class="user-name">{{ userName }}</p>
        </div>
      </div>

      <!-- Navigation Items -->
      <nav class="sidebar-nav">
        @for (item of items; track item.id) {
          <button 
            class="nav-item"
            [class.active]="activeItem === item.id"
            (click)="onItemClick(item.id)">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
            @if (item.badge !== undefined && item.badge > 0) {
              <span class="nav-badge">{{ item.badge }}</span>
            }
          </button>
        }
      </nav>

      <!-- Logout Button -->
      <button class="logout-btn" (click)="onLogout()">
        <span class="nav-icon">🚪</span>
        <span class="nav-label">Logout</span>
      </button>
    </div>
  `,
  styles: [`
    .sidebar {
      width: 240px;
      height: 100vh;
      background: #17324F;
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 24px 20px;
      border-bottom: 1px solid rgba(168, 114, 194, 0.2);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 700;
      color: white;
      letter-spacing: 0.5px;
    }

    .user-info {
      padding: 24px 20px;
      border-bottom: 1px solid rgba(168, 114, 194, 0.2);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      flex-shrink: 0;
    }

    .user-details {
      flex: 1;
      min-width: 0;
    }

    .user-greeting {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      margin: 0;
    }

    .user-name {
      font-size: 16px;
      font-weight: 600;
      color: white;
      margin: 4px 0 0 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sidebar-nav {
      flex: 1;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: transparent;
      border: none;
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      text-align: left;
      width: 100%;
    }

    .nav-item:hover {
      background: rgba(58, 126, 180, 0.1);
      color: white;
    }

    .nav-item.active {
      background: #3A7EB4;
      color: white;
    }

    .nav-icon {
      font-size: 20px;
      flex-shrink: 0;
      width: 24px;
      text-align: center;
    }

    .nav-label {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
    }

    .nav-badge {
      background: #FF7B54;
      color: white;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      min-width: 20px;
      text-align: center;
    }

    .logout-btn {
      margin: 12px;
      padding: 12px 16px;
      background: transparent;
      border: 1px solid #E85656;
      border-radius: 8px;
      color: #E85656;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      font-weight: 500;
    }

    .logout-btn:hover {
      background: #E85656;
      color: white;
    }

    /* Scrollbar styling */
    .sidebar::-webkit-scrollbar {
      width: 6px;
    }

    .sidebar::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.1);
    }

    .sidebar::-webkit-scrollbar-thumb {
      background: rgba(168, 114, 194, 0.3);
      border-radius: 3px;
    }

    .sidebar::-webkit-scrollbar-thumb:hover {
      background: rgba(168, 114, 194, 0.5);
    }
  `]
})
export class SidebarComponent {
  @Input() userName: string = '';
  @Input() items: SidebarItem[] = [];
  @Input() activeItem: string = '';
  @Output() itemClick = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();

  onItemClick(itemId: string): void {
    this.itemClick.emit(itemId);
  }

  onLogout(): void {
    this.logout.emit();
  }
}
