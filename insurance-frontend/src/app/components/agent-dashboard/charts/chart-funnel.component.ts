import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { FunnelData } from '../../../services/agent.service';

@Component({
  selector: 'app-chart-funnel',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="chart-widget">
      <div class="chart-header">
        <div class="title-group">
          <h3 class="chart-title">Conversion Funnel</h3>
          <p class="chart-subtitle">Leads to Bound Policies</p>
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
export class ChartFunnelComponent implements OnChanges {
  @Input() data?: FunnelData;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  public chartType: ChartType = 'bar';
  public chartData: ChartConfiguration['data'] = { labels: [], datasets: [] };

  public chartOptions: any = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterBody: (items: any) => {
            const index = items[0].dataIndex;
            if (index > 0 && this.data) {
              const prevValue = this.data.values[index - 1];
              const currValue = this.data.values[index];
              const drop = ((prevValue - currValue) / prevValue * 100).toFixed(1);
              return `Drop-off: ${drop}%`;
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: { display: false },
      y: { grid: { display: false } }
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
      labels: this.data.steps,
      datasets: [{
        data: this.data.values,
        backgroundColor: (context: any) => {
          const colors = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];
          return colors[context.dataIndex % colors.length];
        },
        borderRadius: 8,
        barThickness: 30
      }]
    };
  }
}
