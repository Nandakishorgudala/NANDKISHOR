import { Component, Input, OnInit, ViewChild, ElementRef, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../services/api.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-metric-savings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Savings & Discounts</h3>
          <p class="card-subtitle">Loyalty rewards over time</p>
        </div>
        <div class="card-actions">
          <button class="btn-icon" (click)="loadData()" aria-label="Refresh Data" title="Refresh">
            🔄
          </button>
          <button class="btn-icon" (click)="exportCSV()" aria-label="Export CSV" title="Download CSV">
            📄
          </button>
        </div>
      </div>

      <div class="card-body relative">
        @if (isLoading()) {
          <div class="skeleton-metric pulse"></div>
          <div class="skeleton-chart pulse mt-4"></div>
        }
        
        <div [class.hidden]="isLoading()">
          @if (savingsData()) {
            <div class="metric-container">
              <span class="metric-currency">₹</span>
              <span class="metric-value">{{ savingsData().totalSavings | number:'1.0-0' }}</span>
              <span class="metric-trend text-green">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 9.5L4.5 5.5L7.5 8L11 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7 2.5H11V6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Trending up
              </span>
            </div>
          }
          <div class="canvas-container">
            <canvas #chartCanvas aria-label="Savings sparkline chart" role="img"></canvas>
          </div>
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
    .card-header { padding: 20px 24px 8px; display: flex; justify-content: space-between; align-items: flex-start; }
    .card-title { margin: 0; font-size: 16px; font-weight: 600; color: #1E293B; }
    .card-subtitle { margin: 4px 0 0; font-size: 13px; color: #64748B; }
    .card-actions { display: flex; align-items: center; }
    .btn-icon { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px; transition: background 0.2s; }
    .btn-icon:hover { background: #F1F5F9; }
    
    .card-body { padding: 0 24px 20px; flex: 1; display: flex; flex-direction: column; }
    
    .metric-container { display: flex; align-items: baseline; gap: 4px; margin-bottom: 12px; }
    .metric-currency { font-size: 18px; font-weight: 500; color: #64748B; }
    .metric-value { font-size: 36px; font-weight: 700; color: #0F172A; letter-spacing: -0.5px; }
    .metric-trend { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 500; padding: 4px 8px; border-radius: 12px; background: #DCFCE7; color: #16A34A; }
    
    .canvas-container { position: relative; width: 100%; height: 80px; margin-top: auto; }
    .hidden { opacity: 0; position: absolute; pointer-events: none; }
    
    .skeleton-metric { height: 40px; width: 120px; border-radius: 8px; background: #E2E8F0; margin-top: 10px; }
    .skeleton-chart { height: 80px; width: 100%; border-radius: 8px; background: #E2E8F0; }
    .mt-4 { margin-top: 16px; }
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
export class MetricSavingsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) customerId!: number;
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  chart: any = null;
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  savingsData = signal<any>(null);

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  loadData() {
    this.isLoading.set(true);
    this.error.set(null);

    this.apiService.getCustomerSavingsTrend(this.customerId, 12).subscribe({
      next: (data) => {
        this.savingsData.set(data);
        this.isLoading.set(false);
        setTimeout(() => this.renderChart(data), 0);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set('Failed to load savings trend');
        console.error('Error fetching savings data', err);
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

    // Subtle sparkline gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 80);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)'); // Emerald light
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          borderColor: '#10B981', // Emerald 500
          backgroundColor: gradient,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: true,
          tension: 0.4
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
            padding: 8,
            cornerRadius: 6,
            displayColors: false,
            callbacks: {
              title: () => '',
              label: (context: any) => `${context.label}: ₹${context.parsed.y}`
            }
          }
        },
        scales: {
          x: { display: false }, // Hide fully for sparkline effect
          y: { display: false, min: Math.min(...data.values) - 10 }
        },
        interaction: {
          mode: 'index',
          intersect: false,
        }
      }
    });
  }

  exportCSV() {
    const data = this.savingsData();
    if (!data || !data.labels || !data.values) return;

    let csvContent = "data:text/csv;charset=utf-8,Month,Savings Amount\\n";
    for (let i = 0; i < data.labels.length; i++) {
      csvContent += `${data.labels[i]},${data.values[i]}\\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "savings_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
