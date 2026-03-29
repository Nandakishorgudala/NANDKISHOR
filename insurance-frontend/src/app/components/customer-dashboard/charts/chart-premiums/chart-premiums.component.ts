import { Component, Input, OnInit, ViewChild, ElementRef, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../services/api.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-chart-premiums',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Premiums Paid</h3>
          <p class="card-subtitle">Your payment history over the selected period</p>
        </div>
        <div class="card-actions">
          <select class="period-select" [value]="months()" (change)="onPeriodChange($event)">
            <option value="6">Last 6 Months</option>
            <option value="12">Last 12 Months</option>
            <option value="24">Last 24 Months</option>
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
          <canvas #chartCanvas aria-label="Premiums line chart" role="img"></canvas>
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
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
      border: 1px solid #E2E8F0;
      overflow: hidden;
      height: 100%;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .chart-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
    }
    .card-header {
      padding: 20px 24px 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #F1F5F9;
    }
    .card-title { margin: 0; font-size: 16px; font-weight: 600; color: #1E293B; }
    .card-subtitle { margin: 4px 0 0; font-size: 13px; color: #64748B; }
    .card-actions { display: flex; gap: 8px; align-items: center; }
    .period-select {
      padding: 6px 12px;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      background: #F8FAFC;
      color: #334155;
      font-size: 13px;
      cursor: pointer;
    }
    .period-select:hover { border-color: #CBD5E1; }
    .btn-icon {
      background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px; transition: background 0.2s;
    }
    .btn-icon:hover { background: #F1F5F9; }
    .card-body { padding: 20px 24px; flex: 1; min-height: 250px; }
    .canvas-container { position: relative; height: 100%; width: 100%; min-height: 250px; }
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
export class ChartPremiumsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) customerId!: number;
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  chart: any = null;
  months = signal<number>(12);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
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

    this.apiService.getCustomerPaymentsHistory(this.customerId, this.months()).subscribe({
      next: (data) => {
        this.isLoading.set(false);
        // Small delay to ensure the DOM is unhidden before Chart tries to measure the canvas
        setTimeout(() => this.renderChart(data), 0);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set('Failed to load payment history');
        console.error('Error fetching payments chart data', err);
      }
    });
  }

  renderChart(data: any) {
    if (this.chart) {
      this.chart.destroy();
    }

    if (!this.chartCanvas) return;
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Create Gradient for Area under curve
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.4)'); // Sky blue, slightly transparent
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)'); // Fade out

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Premium Paid',
          data: data.amounts,
          borderColor: '#0EA5E9', // Sky blue 500
          backgroundColor: gradient,
          borderWidth: 3,
          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: '#0EA5E9',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4 // Smooth bezier curves
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#FFFFFF',
            bodyColor: '#F8FAFC',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context: any) => ` Total: ₹${context.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748B', font: { family: 'Inter, sans-serif' } }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#F1F5F9' },
            ticks: {
              color: '#64748B',
              font: { family: 'Inter, sans-serif' },
              callback: (value) => '₹' + value
            }
          }
        },
        interaction: {
          mode: 'index',
          intersect: false,
        }
      }
    });
  }

  exportChart() {
    if (!this.chart) return;
    const base64Img = this.chart.toBase64Image();
    const link = document.createElement('a');
    link.href = base64Img;
    link.download = `premiums-history-last-${this.months()}M.png`;
    link.click();
  }
}
