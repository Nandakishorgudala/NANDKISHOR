namespace Insurance.Application.DTOs.Dashboard
{
    public class AgentPerformanceDto
    {
        public List<string> Labels { get; set; } = new();
        public List<decimal> Premiums { get; set; } = new();
        public List<int> PoliciesIssued { get; set; } = new();
        public List<decimal> Commission { get; set; } = new();
    }

    public class AgentCommissionBreakdownDto
    {
        public List<string> Labels { get; set; } = new();
        public List<decimal> Values { get; set; } = new();
        public List<double> Percentages { get; set; } = new();
        public decimal TotalCommission { get; set; }
        public decimal MtdDelta { get; set; } // Month-to-date change
    }

    public class AgentTaskSummaryDto
    {
        public List<string> Labels { get; set; } = new();
        public List<int> Urgent { get; set; } = new();
        public List<int> DueSoon { get; set; } = new();
        public List<int> OnTrack { get; set; } = new();
    }

    public class AgentClaimsSummaryDto
    {
        public List<string> Labels { get; set; } = new();
        public List<AgentClaimStatusDatasetDto> Datasets { get; set; } = new();
        public List<double> AvgProcessingDays { get; set; } = new();
    }

    public class AgentClaimStatusDatasetDto
    {
        public string Status { get; set; } = string.Empty;
        public List<int> Counts { get; set; } = new();
        public List<decimal> Amounts { get; set; } = new();
    }

    public class AgentFunnelDto
    {
        public List<string> Steps { get; set; } = new();
        public List<int> Values { get; set; } = new();
    }

    public class TopCustomerDto
    {
        public int CustomerId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Premium { get; set; }
    }

    public class PolicyRiskBubbleDto
    {
        public int PolicyId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Premium { get; set; }
        public double RiskScore { get; set; }
        public decimal Exposure { get; set; }
    }

    public class BranchPerformanceDto
    {
        public List<string> Branches { get; set; } = new();
        public List<decimal> Premiums { get; set; } = new();
        public List<int> Policies { get; set; } = new();
    }
}
