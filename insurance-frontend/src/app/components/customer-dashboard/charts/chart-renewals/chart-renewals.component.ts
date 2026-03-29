import { Component, Input, OnInit, ViewChild, ElementRef, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../services/api.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-chart-renewals',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Upcoming Renewals</h3>
          <p class="card-subtitle">Active policies timeline and urgency</p>
        </div>
        <div class="card-actions">
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
          <canvas #chartCanvas aria-label="Renewals horizontal bar chart" role="img"></canvas>
        </div>

        @if (!isLoading() && error()) {
          <div class="error-overlay">
            <p>{{ error() }}</p>
            <button class="btn btn-sm btn-secondary" (click)="loadData()">Retry</button>
          </div>
        }
        
        @if (!isLoading() && !error() && renewalsData().length === 0) {
          <div class="empty-overlay">
            <p>No active policies to renew</p>
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
    .card-actions { display: flex; align-items: center; }
    .btn-icon { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px; transition: background 0.2s; }
    .btn-icon:hover { background: #F1F5F9; }
    
    .card-body { padding: 20px 24px; flex: 1; min-height: 250px; }
    .canvas-container { position: relative; height: 100%; width: 100%; min-height: 250px; }
    .hidden { opacity: 0; position: absolute; pointer-events: none; }
    
    .skeleton-chart { height: 250px; width: 100%; border-radius: 8px; background: #E2E8F0; }
    .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
    
    .error-overlay, .empty-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.9); border-radius: 8px; 
    }
    .error-overlay { color: #DC2626; gap: 12px; }
    .empty-overlay { color: #64748B; font-weight: 500; }
    .btn-secondary { background: #E2E8F0; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
    .btn-secondary:hover { background: #CBD5E1; }
  `]
})
export class ChartRenewalsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) customerId!: number;
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  chart: any = null;
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  renewalsData = signal<any[]>([]);

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

    this.apiService.getCustomerRenewals(this.customerId).subscribe({
      next: (data) => {
        this.renewalsData.set(data);
        this.isLoading.set(false);
        if (data.length > 0) {
          setTimeout(() => this.renderChart(data), 0);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set('Failed to load renewals timeline');
        console.error('Error fetching renewals data', err);
      }
    });
  }

  getUrgencyColor(daysToRenew: number): string {
    if (daysToRenew <= 0) return '#EF4444'; // Red (Overdue or Today)
    if (daysToRenew <= 30) return '#F59E0B'; // Amber (Urgent)
    return '#10B981'; // Emerald (Safe)
  }

  renderChart(data: any[]) {
    if (this.chart) {
      this.chart.destroy();
    }

    if (!this.chartCanvas) return;
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Use name as label (truncate if too long)
    const labels = data.map(d => d.name.length > 18 ? d.name.substring(0, 18) + '...' : d.name);
    const values = data.map(d => d.daysToRenew);
    const bgColors = data.map(d => this.getUrgencyColor(d.daysToRenew));
    const premiums = data.map(d => d.premium);

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Days to Expiry',
          data: values,
          backgroundColor: bgColors,
          borderRadius: 6,
          barThickness: 16
        }]
      },
      options: {
        indexAxis: 'y', // Makes the bar chart horizontal
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
              label: (context: any) => {
                const index = context.dataIndex;
                const days = context.parsed.x ?? 0;
                const cost = premiums[index];
                const dayText = days < 0 ? ` Expired ${Math.abs(days)} days ago` : ` Renews in ${days} days`;
                return [dayText, ` Premium: ₹${cost.toLocaleString()}`];
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: '#F8FAFC' },
            ticks: { color: '#64748B', font: { family: 'Inter, sans-serif' } },
            title: { display: true, text: 'Days from Today', color: '#94A3B8', font: { size: 11 } }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#475569', font: { family: 'Inter, sans-serif', weight: 'bold' } }
          }
        }
      }
    });
  }

  exportChart() {
    if (!this.chart) return;
    const base64Img = this.chart.toBase64Image();
    const link = document.createElement('a');
    link.href = base64Img;
    link.download = `upcoming-renewals.png`;
    link.click();
  }
}
