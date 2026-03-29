namespace Insurance.Application.DTOs.Dashboard
{
    public class AdminChartDataDto
    {
        public List<DailyPolicyTrendsDto> PoliciesOverTime { get; set; } = new();
        public PolicyStatusBreakdownDto PolicyStatusBreakdown { get; set; } = new();
        public RevenueBreakdownDto ProfitAndRevenue { get; set; } = new();
        public List<TopAgentDto> TopAgents { get; set; } = new();
        public List<ClaimsTrendDto> ClaimsTrend { get; set; } = new();
        public List<ProductShareDto> PoliciesByProduct { get; set; } = new();
    }

    public class DailyPolicyTrendsDto
    {
        public string Date { get; set; } = string.Empty;
        public int NewPolicies { get; set; }
        public int Renewals { get; set; }
    }

    public class PolicyStatusBreakdownDto
    {
        public int Approved { get; set; }
        public int Pending { get; set; }
        public int Rejected { get; set; }
    }

    public class RevenueBreakdownDto
    {
        public decimal TotalRevenue { get; set; }
        public decimal AgentCommission { get; set; }
        public decimal Profit { get; set; }
    }

    public class TopAgentDto
    {
        public string AgentName { get; set; } = string.Empty;
        public decimal Commission { get; set; }
        public decimal Revenue { get; set; }
    }

    public class ClaimsTrendDto
    {
        public string Date { get; set; } = string.Empty;
        public int Opened { get; set; }
        public int Resolved { get; set; }
        public double AvgResolutionDays { get; set; }
    }

    public class ProductShareDto
    {
        public string ProductName { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Percentage { get; set; }
    }
}
