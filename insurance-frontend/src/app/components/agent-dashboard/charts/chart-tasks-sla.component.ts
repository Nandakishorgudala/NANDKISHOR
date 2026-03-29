import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { TaskSummary } from '../../../services/agent.service';

@Component({
  selector: 'app-chart-tasks-sla',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="chart-widget">
      <div class="chart-header">
        <div class="title-group">
          <h3 class="chart-title">Tasks & SLA Status</h3>
          <p class="chart-subtitle">Pending tasks by urgency</p>
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
export class ChartTasksSlaComponent implements OnChanges {
  @Input() data?: TaskSummary;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  public chartType: ChartType = 'bar';
  public chartData: ChartConfiguration['data'] = { labels: [], datasets: [] };

  public chartOptions: any = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } },
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, grid: { color: 'rgba(0,0,0,0.05)' } }
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
        { label: 'Urgent', data: this.data.urgent, backgroundColor: '#EF4444' },
        { label: 'Due Soon', data: this.data.dueSoon, backgroundColor: '#F59E0B' },
        { label: 'On Track', data: this.data.onTrack, backgroundColor: '#3B82F6' }
      ]
    };
  }
}
