import { Component, Input, OnInit, ViewChild, ElementRef, OnDestroy, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../services/api.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-chart-claims',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Claims by Status</h3>
          <p class="card-subtitle">Track your claims progress over time</p>
        </div>
        <div class="card-actions">
          <div class="toggle-group">
            <button class="toggle-btn" [class.active]="viewMode() === 'counts'" (click)="setViewMode('counts')">Counts</button>
            <button class="toggle-btn" [class.active]="viewMode() === 'amounts'" (click)="setViewMode('amounts')">Amounts</button>
          </div>
          <select class="period-select" [value]="months()" (change)="onPeriodChange($event)">
            <option value="6">6M</option>
            <option value="12">12M</option>
          </select>
          <button class="btn-icon" (click)="loadData()" aria-label="Refresh Data" title="Refresh">
            🔄
          </button>
          <button class="btn-icon" (click)="exportChart()" aria-label="Export Chart" title="Download PNG">
            📥
          </button>
        </div>
      </div>

      <div class="card-body relative">
        @if (isLoading()) {
          <div class="skeleton-chart pulse"></div>
        }
        
        <div class="canvas-container" [class.hidden]="isLoading()">
          <canvas #chartCanvas aria-label="Claims stacked bar chart" role="img" (click)="onCanvasClick($event)"></canvas>
        </div>

        @if (!isLoading() && error()) {
          <div class="error-overlay">
            <p>{{ error() }}</p>
            <button class="btn btn-sm btn-secondary" (click)="loadData()">Retry</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .chart-card {
      background: white; border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
      border: 1px solid #E2E8F0; overflow: hidden; height: 100%;
      display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s;
    }
    .chart-card:hover {
      transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
    }
    .card-header { padding: 20px 24px 16px; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #F1F5F9; }
    .card-title { margin: 0; font-size: 16px; font-weight: 600; color: #1E293B; }
    .card-subtitle { margin: 4px 0 0; font-size: 13px; color: #64748B; }
    .card-actions { display: flex; gap: 8px; align-items: center; }
    
    .toggle-group { display: flex; background: #F1F5F9; border-radius: 6px; padding: 2px; }
    .toggle-btn {
      background: transparent; border: none; padding: 4px 10px; font-size: 12px;
      color: #64748B; border-radius: 4px; cursor: pointer; transition: all 0.2s;
    }
    .toggle-btn.active { background: white; color: #0EA5E9; box-shadow: 0 1px 2px rgba(0,0,0,0.05); font-weight: 500; }
    
    .period-select { padding: 4px 8px; border: 1px solid #E2E8F0; border-radius: 6px; background: white; color: #334155; font-size: 12px; cursor: pointer; }
    .btn-icon { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px; transition: background 0.2s; }
    .btn-icon:hover { background: #F1F5F9; }
    
    .card-body { padding: 20px 24px; flex: 1; min-height: 250px; }
    .canvas-container { position: relative; height: 100%; width: 100%; min-height: 250px; }
    .canvas-container canvas { cursor: pointer; }
    .hidden { opacity: 0; position: absolute; pointer-events: none; }
    
    .skeleton-chart { height: 250px; width: 100%; border-radius: 8px; background: #E2E8F0; }
    .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
    
    .error-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.9); border-radius: 8px; color: #DC2626; gap: 12px;
    }
    .btn-secondary { background: #E2E8F0; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
    .btn-secondary:hover { background: #CBD5E1; }
  `]
})
export class ChartClaimsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) customerId!: number;
  @Output() statusFiltered = new EventEmitter<string>();
  
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  chart: any = null;
  months = signal<number>(12);
  viewMode = signal<'counts' | 'amounts'>('counts');
  
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  private rawData: any = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
  }

  setViewMode(mode: 'counts' | 'amounts') {
    if (this.viewMode() !== mode) {
      this.viewMode.set(mode);
      if (this.rawData) this.renderChart(this.rawData);
    }
  }

  onPeriodChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.months.set(parseInt(target.value, 10));
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.error.set(null);

    this.apiService.getCustomerClaimsSummary(this.customerId, this.months()).subscribe({
      next: (data) => {
        this.rawData = data;
        this.isLoading.set(false);
        setTimeout(() => this.renderChart(data), 0);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set('Failed to load claims history');
        console.error('Error fetching claims data', err);
      }
    });
  }

  // Pre-defined color palette for statues
  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending': return '#94A3B8'; // Slate 400
      case 'underreview': return '#38BDF8'; // Sky 400
      case 'approved': return '#34D399'; // Emerald 400
      case 'rejected': return '#F87171'; // Red 400
      case 'settled': return '#A78BFA'; // Violet 400
      default: return '#CBD5E1';
    }
  }

  renderChart(data: any) {
    if (this.chart) {
      this.chart.destroy();
    }

    if (!this.chartCanvas) return;
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const datasets = data.datasets.map((ds: any) => ({
      label: ds.status,
      data: this.viewMode() === 'counts' ? ds.counts : ds.amounts,
      backgroundColor: this.getStatusColor(ds.status),
      borderRadius: 4,
      borderSkipped: false
    }));

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              boxWidth: 8,
              font: { family: 'Inter, sans-serif', size: 12 },
              color: '#475569'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#FFFFFF',
            bodyColor: '#F8FAFC',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context: any) => {
                const val = context.parsed.y ?? 0;
                return this.viewMode() === 'amounts' 
                  ? ` ${context.dataset.label}: ₹${val.toLocaleString()}`
                  : ` ${context.dataset.label}: ${val} claim(s)`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: '#64748B', font: { family: 'Inter, sans-serif' } }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: '#F1F5F9' },
            ticks: {
              color: '#64748B',
              font: { family: 'Inter, sans-serif' },
              callback: (value) => this.viewMode() === 'amounts' ? '₹' + value : value
            }
          }
        }
      }
    });
  }

  onCanvasClick(event: MouseEvent) {
    if (!this.chart) return;
    
    const elements = this.chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
    if (elements.length > 0) {
      const firstElement = elements[0];
      const datasetIndex = firstElement.datasetIndex;
      const statusLabel = this.chart.data.datasets[datasetIndex].label as string;
      this.statusFiltered.emit(statusLabel);
    }
  }

  exportChart() {
    if (!this.chart) return;
    const base64Img = this.chart.toBase64Image();
    const link = document.createElement('a');
    link.href = base64Img;
    link.download = `claims-summary-${this.viewMode()}.png`;
    link.click();
  }
}
