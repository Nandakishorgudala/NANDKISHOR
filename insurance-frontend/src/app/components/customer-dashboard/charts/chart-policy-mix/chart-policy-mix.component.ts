import { Component, Input, OnInit, ViewChild, ElementRef, OnDestroy, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../services/api.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-chart-policy-mix',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Policy Mix</h3>
          <p class="card-subtitle">Distribution of your active policies</p>
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
          <canvas #chartCanvas aria-label="Policy mix pie chart" role="img" (click)="onCanvasClick($event)"></canvas>
        </div>

        @if (!isLoading() && error()) {
          <div class="error-overlay">
            <p>{{ error() }}</p>
            <button class="btn btn-sm btn-secondary" (click)="loadData()">Retry</button>
          </div>
        }
      </div>

      @if (!isLoading() && policyData()) {
        <div class="card-footer">
          <div class="badges-container">
            @for (detail of policyData().details; track detail.type; let i = $index) {
              <div class="mix-badge" [style.border-left-color]="getColor(i)">
                <span class="mix-type">{{ detail.type }}</span>
                <span class="mix-count">{{ policyData().values[i] }}</span>
              </div>
            }
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
    .card-header { padding: 20px 24px 16px; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #F1F5F9; }
    .card-title { margin: 0; font-size: 16px; font-weight: 600; color: #1E293B; }
    .card-subtitle { margin: 4px 0 0; font-size: 13px; color: #64748B; }
    .card-actions { display: flex; align-items: center; }
    .btn-icon { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px; transition: background 0.2s; }
    .btn-icon:hover { background: #F1F5F9; }
    
    .card-body { padding: 20px 24px; flex: 1; min-height: 250px; display: flex; justify-content: center; }
    .canvas-container { position: relative; height: 100%; width: 100%; max-height: 250px; display: flex; justify-content: center; }
    .canvas-container canvas { cursor: pointer; }
    .hidden { opacity: 0; position: absolute; pointer-events: none; }
    
    .skeleton-chart { height: 250px; width: 250px; border-radius: 50%; background: #E2E8F0; margin: 0 auto; }
    .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
    
    .card-footer { padding: 12px 24px; border-top: 1px solid #F1F5F9; background: #F8FAFC; }
    .badges-container { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
    .mix-badge {
      display: inline-flex; align-items: center; gap: 6px; background: white;
      border: 1px solid #E2E8F0; border-left-width: 4px; padding: 4px 10px; border-radius: 6px;
      font-size: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor: pointer;
    }
    .mix-badge:hover { background: #F8FAFC; border-color: #CBD5E1; }
    .mix-type { color: #475569; font-weight: 500; }
    .mix-count { background: #F1F5F9; color: #0F172A; padding: 2px 6px; border-radius: 10px; font-weight: 600; font-size: 11px; }

    .error-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.9); border-radius: 8px; color: #DC2626; gap: 12px;
    }
    .btn-secondary { background: #E2E8F0; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
    .btn-secondary:hover { background: #CBD5E1; }
  `]
})
export class ChartPolicyMixComponent implements OnInit, OnDestroy {
  @Input({ required: true }) customerId!: number;
  @Output() policyTypeClicked = new EventEmitter<string>();

  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  chart: any = null;
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  policyData = signal<any>(null);

  // Accessible categorical palette
  private colors = ['#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#8B5CF6'];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  getColor(index: number): string {
    return this.colors[index % this.colors.length];
  }

  loadData() {
    this.isLoading.set(true);
    this.error.set(null);

    this.apiService.getCustomerPolicyMix(this.customerId).subscribe({
      next: (data) => {
        this.policyData.set(data);
        this.isLoading.set(false);
        setTimeout(() => this.renderChart(data), 0);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set('Failed to load policy distribution');
        console.error('Error fetching policy mix data', err);
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

    const bgColors = data.labels.map((_: any, i: number) => this.getColor(i));

    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: '#FFFFFF',
          hoverOffset: 6
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
              label: (context) => {
                const index = context.dataIndex;
                const detail = data.details[index];
                const premiumStr = detail.premium.toLocaleString();
                return ` ${context.label}: ${context.parsed} policies (₹${premiumStr})`;
              }
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
      const idx = elements[0].index;
      const label = this.chart.data.labels![idx] as string;
      this.policyTypeClicked.emit(label);
    }
  }

  exportChart() {
    if (!this.chart) return;
    const base64Img = this.chart.toBase64Image();
    const link = document.createElement('a');
    link.href = base64Img;
    link.download = 'policy-mix.png';
    link.click();
  }
}
