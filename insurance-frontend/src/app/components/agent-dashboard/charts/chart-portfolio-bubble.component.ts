import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { RiskBubble } from '../../../services/agent.service';

@Component({
  selector: 'app-chart-portfolio-bubble',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="chart-widget">
      <div class="chart-header">
        <div class="title-group">
          <h3 class="chart-title">Portfolio Risk Profile</h3>
          <p class="chart-subtitle">Risk vs Premium (Bubble size = Exposure)</p>
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
export class ChartPortfolioBubbleComponent implements OnChanges {
  @Input() data: RiskBubble[] = [];
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  public chartType: ChartType = 'bubble';
  public chartData: ChartConfiguration['data'] = { datasets: [] };

  public chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const point = this.data[context.dataIndex];
            return `${point.name}: Risk ${point.riskScore}%, Premium ₹${point.premium.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: { title: { display: true, text: 'Risk Score (%)' }, min: 0, max: 100 },
      y: { title: { display: true, text: 'Premium Amount (₹)' } }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.updateChart();
    }
  }

  private updateChart() {
    this.chartData = {
      datasets: [{
        label: 'Policy Risks',
        data: this.data.map(d => ({
          x: d.riskScore,
          y: d.premium,
          r: Math.max(5, d.exposure / 10000) // Scale bubble radius
        })),
        backgroundColor: (context: any) => {
          const x = context.raw?.x || 0;
          return x > 70 ? 'rgba(239, 68, 68, 0.6)' : x > 40 ? 'rgba(245, 158, 11, 0.6)' : 'rgba(16, 185, 129, 0.6)';
        },
        borderColor: (context: any) => {
          const x = context.raw?.x || 0;
          return x > 70 ? '#EF4444' : x > 40 ? '#F59E0B' : '#10B981';
        },
        borderWidth: 1
      }]
    };
  }
}
