import { Component, Input, OnInit, ViewChild, ElementRef, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../services/api.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-chart-coverage',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Coverage Utilization</h3>
          <p class="card-subtitle">Snapshot of total policies coverage</p>
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
          <canvas #chartCanvas aria-label="Coverage doughnut chart" role="img"></canvas>
        </div>

        @if (!isLoading() && error()) {
          <div class="error-overlay">
            <p>{{ error() }}</p>
            <button class="btn btn-sm btn-secondary" (click)="loadData()">Retry</button>
          </div>
        }
      </div>
      
      @if (!isLoading() && coverageData()) {
        <div class="card-footer">
          <div class="legend-item">
            <span class="dot bg-used"></span>
            <div class="legend-text">
              <span class="legend-label">Used</span>
              <span class="legend-val">₹{{ coverageData().used.toLocaleString() }}</span>
            </div>
          </div>
          <div class="legend-item">
            <span class="dot bg-remaining"></span>
            <div class="legend-text">
              <span class="legend-label">Remaining</span>
              <span class="legend-val">₹{{ coverageData().remaining.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      }
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
    .card-header { padding: 20px 24px 16px; display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; }
    .card-title { margin: 0; font-size: 16px; font-weight: 600; color: #1E293B; }
    .card-subtitle { margin: 4px 0 0; font-size: 13px; color: #64748B; }
    .card-actions { display: flex; align-items: center; }
    .btn-icon { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px; transition: background 0.2s; }
    .btn-icon:hover { background: #F1F5F9; }
    .card-body { padding: 20px 24px; flex: 1; min-height: 250px; display: flex; justify-content: center; }
    .canvas-container { position: relative; height: 100%; width: 100%; max-height: 250px; display: flex; justify-content: center; }
    .hidden { opacity: 0; position: absolute; pointer-events: none; }
    
    .skeleton-chart { height: 250px; width: 250px; border-radius: 50%; background: #E2E8F0; margin: 0 auto; }
    .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
    
    .card-footer {
      padding: 16px 24px; border-top: 1px solid #F1F5F9; background: #F8FAFC;
      display: flex; justify-content: space-around;
    }
    .legend-item { display: flex; align-items: flex-start; gap: 8px; }
    .dot { width: 12px; height: 12px; border-radius: 4px; margin-top: 4px; }
    .bg-used { background: #F59E0B; } /* Amber */
    .bg-remaining { background: #10B981; } /* Emerald */
    .legend-text { display: flex; flex-direction: column; }
    .legend-label { font-size: 12px; color: #64748B; font-weight: 500; }
    .legend-val { font-size: 14px; color: #1E293B; font-weight: 600; }

    .error-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.9); border-radius: 8px; color: #DC2626; gap: 12px;
    }
    .btn-secondary { background: #E2E8F0; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
    .btn-secondary:hover { background: #CBD5E1; }
  `]
})
export class ChartCoverageComponent implements OnInit, OnDestroy {
  @Input({ required: true }) customerId!: number;
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  chart: any = null;
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  coverageData = signal<any>(null);

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

    this.apiService.getCustomerCoverageSummary(this.customerId).subscribe({
      next: (data) => {
        this.coverageData.set(data);
        this.isLoading.set(false);
        setTimeout(() => this.renderChart(data), 0);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set('Failed to load coverage details');
        console.error('Error fetching coverage data', err);
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

    const usedPct = data.limit > 0 ? (data.used / data.limit) * 100 : 0;
    const isWarning = usedPct > 70;
    const usedColor = isWarning ? '#EF4444' : '#F59E0B'; // Red if >70%, Amber otherwise

    // Custom Plugin for Center Text
    const centerTextPlugin = {
      id: 'centerText',
      beforeDraw: (chart: any) => {
        const { width, height, ctx } = chart;
        ctx.restore();
        
        const fontSize = (height / 114).toFixed(2);
        (ctx as any).font = `600 ${fontSize}em Inter, sans-serif`;
        ctx.textBaseline = 'middle';
        
        const text = `${Math.round(usedPct)}%`;
        const textX = Math.round((width - ctx.measureText(text).width) / 2);
        const textY = height / 2.1;
        
        ctx.fillStyle = '#1E293B';
        ctx.fillText(text, textX, textY);

        (ctx as any).font = `500 ${(height / 220).toFixed(2)}em Inter, sans-serif`;
        ctx.fillStyle = '#64748B';
        const subtext = 'Utilized';
        const subtextX = Math.round((width - ctx.measureText(subtext).width) / 2);
        ctx.fillText(subtext, subtextX, textY + (height * 0.12));

        ctx.save();
      }
    };

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      plugins: [centerTextPlugin],
      data: {
        labels: ['Used', 'Remaining'],
        datasets: [{
          data: [data.used, data.remaining],
          backgroundColor: [usedColor, '#10B981'], // dynamically colored used, emerald remaining
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%', // Creates the thin gauge effect
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#FFFFFF',
            bodyColor: '#F8FAFC',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context: any) => ` ₹${context.parsed.toLocaleString()}`
            }
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
    link.download = 'coverage-utilization.png';
    link.click();
  }
}
