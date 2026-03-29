import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { CommissionBreakdown } from '../../../services/agent.service';

@Component({
  selector: 'app-chart-commission',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="chart-widget">
      <div class="chart-header">
        <div class="title-group">
          <h3 class="chart-title">Commission Distribution</h3>
          <p class="chart-subtitle">By policy type split</p>
        </div>
        <div class="chart-actions">
           <button class="action-btn" (click)="exportPNG()"><span class="material-icons">download</span></button>
        </div>
      </div>
      <div class="chart-container">
        <canvas baseChart
          [data]="chartData"
          [options]="chartOptions"
          [type]="chartType">
        </canvas>
        <div class="center-text">
          <span class="total-label">Total</span>
          <span class="total-value">₹{{ (data?.totalCommission || 0).toLocaleString() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-widget {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 24px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 8px 32px rgba(31, 38, 135, 0.07);
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .chart-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .chart-title { font-size: 18px; font-weight: 700; color: #1E293B; margin: 0; }
    .chart-subtitle { font-size: 13px; color: #64748B; margin: 4px 0 0 0; }
    .chart-container { flex: 1; position: relative; min-height: 250px; }
    .center-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      pointer-events: none;
    }
    .total-label { display: block; font-size: 12px; color: #64748B; text-transform: uppercase; letter-spacing: 1px; }
    .total-value { display: block; font-size: 20px; font-weight: 800; color: #1E293B; }
    .action-btn { background: none; border: none; color: #94A3B8; cursor: pointer; padding: 4px; border-radius: 8px; }
    .action-btn:hover { background: #F1F5F9; color: #64748B; }
  `]
})
export class ChartCommissionComponent implements OnChanges {
  @Input() data?: CommissionBreakdown;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  public chartType: ChartType = 'doughnut';
  public chartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };

  public chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
      tooltip: {
        callbacks: {
          label: (item: any) => ` ${item.label}: ₹${item.raw?.toLocaleString()} (${this.data?.percentages[item.dataIndex]}%)`
        }
      }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.updateChart();
    }
  }

  private updateChart() {
    if (!this.data) return;
    this.chartData = {
      labels: this.data.labels,
      datasets: [{
        data: this.data.values,
        backgroundColor: ['#3B82F6', '#10B981', '#A855F7', '#F59E0B', '#EF4444', '#64748B'],
        borderWidth: 0,
        hoverOffset: 10
      }]
    };
  }

  exportPNG() {
    if (this.chart && this.chart.chart) {
      const link = document.createElement('a');
      link.href = this.chart.chart.toBase64Image();
      link.download = 'commission_chart.png';
      link.click();
    }
  }
}
