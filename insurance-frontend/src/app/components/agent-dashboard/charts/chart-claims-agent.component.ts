import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { ClaimsSummary } from '../../../services/agent.service';

@Component({
  selector: 'app-chart-claims-agent',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="chart-widget">
      <div class="chart-header">
        <div class="title-group">
          <h3 class="chart-title">Claims Handling</h3>
          <p class="chart-subtitle">Volume and average processing time</p>
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
    .chart-header { margin-bottom: 20px; }
    .chart-title { font-size: 18px; font-weight: 700; color: #1E293B; margin: 0; }
    .chart-subtitle { font-size: 13px; color: #64748B; margin: 4px 0 0 0; }
    .chart-container { flex: 1; position: relative; min-height: 250px; }
  `]
})
export class ChartClaimsAgentComponent implements OnChanges {
  @Input() data?: ClaimsSummary;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  public chartType: ChartType = 'bar';
  public chartData: ChartConfiguration['data'] = { labels: [], datasets: [] };

  public chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true } }
    },
    scales: {
      y: { stacked: true, title: { display: true, text: 'No. of Claims' } },
      y1: { 
        position: 'right', 
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Avg Days' },
        beginAtZero: true
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
      datasets: [
        ...this.data.datasets.map((ds, i) => ({
          label: ds.status,
          data: ds.counts,
          backgroundColor: i === 0 ? '#10B981' : i === 1 ? '#F59E0B' : '#EF4444',
          stack: 'claims'
        })),
        {
          label: 'Avg Processing Days',
          data: this.data.avgProcessingDays,
          type: 'line',
          borderColor: '#3B82F6',
          borderWidth: 2,
          pointBackgroundColor: '#3B82F6',
          yAxisID: 'y1'
        }
      ]
    };
  }
}
