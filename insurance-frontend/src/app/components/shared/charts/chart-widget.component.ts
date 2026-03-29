import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType, ChartEvent } from 'chart.js';

@Component({
  selector: 'app-chart-widget',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="chart-card">
      <div class="chart-header">
        <div class="chart-title-box">
          <h3 class="chart-title">{{ title }}</h3>
          <p class="chart-subtitle">{{ subtitle }}</p>
        </div>
        
        <div class="chart-actions">
          <button class="kebab-menu" (click)="toggleMenu()">⋮</button>
          
          @if (showMenu) {
            <div class="dropdown-menu">
              <button class="menu-item" (click)="exportPNG()">Export to PNG</button>
              <button class="menu-item" (click)="exportCSV()">Export to CSV</button>
            </div>
          }
        </div>
      </div>
      
      <div class="chart-container" [style.height]="height">
        <canvas baseChart
          [data]="chartData"
          [options]="chartOptions"
          [type]="chartType"
          (chartClick)="onChartClick($event)"
          (chartHover)="onChartHover($event)">
        </canvas>
      </div>
    </div>
  `,
  styles: [`
    .chart-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #E5E7EB;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }

    .chart-title {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 4px 0;
    }

    .chart-subtitle {
      font-size: 12px;
      color: #6B7280;
      margin: 0;
    }

    .chart-actions {
      position: relative;
    }

    .kebab-menu {
      background: none;
      border: none;
      color: #9CA3AF;
      font-size: 20px;
      cursor: pointer;
      padding: 0 8px;
    }

    .kebab-menu:hover {
      color: #4B5563;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      z-index: 10;
      min-width: 140px;
      overflow: hidden;
    }

    .menu-item {
      display: block;
      width: 100%;
      text-align: left;
      padding: 10px 16px;
      background: none;
      border: none;
      font-size: 13px;
      color: #374151;
      cursor: pointer;
    }

    .menu-item:hover {
      background: #F3F4F6;
    }

    .chart-container {
      position: relative;
      width: 100%;
      flex: 1;
    }
  `]
})
export class ChartWidgetComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() chartType: ChartType = 'bar';
  @Input() chartData: ChartConfiguration['data'] = { datasets: [] };
  @Input() chartOptions: any = { responsive: true, maintainAspectRatio: false };
  @Input() height: string = '300px';

  @Output() chartClicked = new EventEmitter<any>();
  @Output() exportData = new EventEmitter<'png' | 'csv'>();

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  showMenu = false;

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  onChartClick(event: { event?: ChartEvent; active?: object[] }) {
    if (event.active && event.active.length > 0) {
      this.chartClicked.emit(event.active[0]);
    }
  }

  onChartHover(event: { event?: ChartEvent; active?: object[] }) {
    // Basic hover implementation
  }

  exportPNG() {
    this.showMenu = false;
    if (this.chart && this.chart.chart) {
      const base64 = this.chart.chart.toBase64Image();
      const link = document.createElement('a');
      link.href = base64;
      link.download = `${this.title.replace(/\s+/g, '_').toLowerCase()}.png`;
      link.click();
    }
  }

  exportCSV() {
    this.showMenu = false;
    this.exportData.emit('csv');
  }
}
