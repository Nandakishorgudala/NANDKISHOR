import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kpi-card" [ngStyle]="{'--accent-color': color}">
      <div class="kpi-icon-row">
        <div class="kpi-icon-box">
          <span class="material-icons">{{ icon }}</span>
        </div>
        <div class="kpi-trend" [class.up]="trend > 0" [class.down]="trend < 0">
          <span class="trend-value">{{ trend > 0 ? '+' : '' }}{{ trend }}%</span>
          <span class="material-icons trend-icon">{{ trend > 0 ? 'trending_up' : 'trending_down' }}</span>
        </div>
      </div>
      
      <div class="kpi-content">
        <h3 class="kpi-label">{{ label }}</h3>
        <div class="kpi-value-row">
          <span class="kpi-value">{{ value }}</span>
          @if (suffix) {
            <span class="kpi-suffix">{{ suffix }}</span>
          }
        </div>
        <p class="kpi-subtitle">{{ subtitle }}</p>
      </div>

      <div class="kpi-decoration"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .kpi-card {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 24px;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 8px 32px rgba(31, 38, 135, 0.07);
      transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
      height: 100%;
      cursor: pointer;
    }

    .kpi-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 40px rgba(31, 38, 135, 0.12);
      border-color: var(--accent-color, #3A7EB4);
    }

    .kpi-icon-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .kpi-icon-box {
      width: 48px;
      height: 48px;
      background: var(--accent-color, #3A7EB4);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .kpi-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
    }

    .kpi-trend.up {
      background: rgba(16, 185, 129, 0.1);
      color: #10B981;
    }

    .kpi-trend.down {
      background: rgba(239, 68, 68, 0.1);
      color: #EF4444;
    }

    .trend-icon {
      font-size: 16px;
    }

    .kpi-content {
      position: relative;
      z-index: 1;
    }

    .kpi-label {
      font-size: 14px;
      font-weight: 500;
      color: #64748B;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .kpi-value-row {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-bottom: 8px;
    }

    .kpi-value {
      font-size: 28px;
      font-weight: 800;
      color: #1E293B;
    }

    .kpi-suffix {
      font-size: 16px;
      color: #94A3B8;
      font-weight: 500;
    }

    .kpi-subtitle {
      font-size: 12px;
      color: #64748B;
      margin: 0;
    }

    .kpi-decoration {
      position: absolute;
      bottom: -20px;
      right: -20px;
      width: 100px;
      height: 100px;
      background: var(--accent-color, #3A7EB4);
      opacity: 0.05;
      border-radius: 50%;
      z-index: 0;
    }
  `]
})
export class KpiCardComponent {
  @Input() label: string = '';
  @Input() value: string = '';
  @Input() suffix: string = '';
  @Input() subtitle: string = '';
  @Input() icon: string = 'dashboard';
  @Input() trend: number = 0;
  @Input() color: string = '#3A7EB4';
}
