import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { AgentPerformance } from '../../../services/agent.service';

@Component({
  selector: 'app-chart-performance',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="chart-widget">
      <div class="chart-header">
        <div class="title-group">
          <h3 class="chart-title">Sales & Premium Performance</h3>
          <p class="chart-subtitle">Monthly premiums, policies issued, and commission</p>
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
    .chart-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .chart-title {
      font-size: 18px;
      font-weight: 700;
      color: #1E293B;
      margin: 0;
    }
    .chart-subtitle {
      font-size: 13px;
      color: #64748B;
      margin: 4px 0 0 0;
    }
    .chart-container {
      flex: 1;
      position: relative;
      min-height: 300px;
    }
    .action-btn {
      background: none;
      border: none;
      color: #94A3B8;
      cursor: pointer;
      padding: 4px;
      border-radius: 8px;
      transition: all 0.2s;
    }
    .action-btn:hover {
      background: #F1F5F9;
      color: #64748B;
    }
  `]
})
export class ChartPerformanceComponent implements OnChanges {
  @Input() data?: AgentPerformance;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  public chartType: ChartType = 'line';
  public chartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };

  public chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { usePointStyle: true, font: { family: 'Inter, sans-serif' } }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1E293B',
        bodyColor: '#64748B',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        position: 'left',
        title: { display: true, text: 'Premium (₹)' },
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        title: { display: true, text: 'Policies' },
        grid: { drawOnChartArea: false }
      },
      x: {
        grid: { display: false }
      }
    },
    elements: {
      line: { tension: 0.4 },
      point: { radius: 4, hoverRadius: 6 }
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
      datasets: [
        {
          label: 'Total Premium',
          data: this.data.premiums,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          yAxisID: 'y'
        },
        {
          label: 'Commission',
          data: this.data.commission,
          borderColor: '#10B981',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          yAxisID: 'y'
        },
        {
          label: 'Policies Issued',
          data: this.data.policiesIssued,
          type: 'bar',
          backgroundColor: 'rgba(168, 85, 247, 0.4)',
          borderColor: '#A855F7',
          borderWidth: 1,
          yAxisID: 'y1'
        }
      ]
    };
  }

  exportPNG() {
    if (this.chart && this.chart.chart) {
      const link = document.createElement('a');
      link.href = this.chart.chart.toBase64Image();
      link.download = 'performance_chart.png';
      link.click();
    }
  }
}
