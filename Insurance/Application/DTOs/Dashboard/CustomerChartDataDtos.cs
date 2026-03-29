namespace Insurance.Application.DTOs.Dashboard
{
    public class PaymentsHistoryDto
    {
        public List<string> Labels { get; set; } = new();
        public List<decimal> Amounts { get; set; } = new();
    }

    public class CoverageSummaryDto
    {
        public decimal Used { get; set; }
        public decimal Remaining { get; set; }
        public decimal Limit { get; set; }
    }

    public class ClaimsSummaryDto
    {
        public List<string> Labels { get; set; } = new();
        public List<ClaimStatusDatasetDto> Datasets { get; set; } = new();
    }

    public class ClaimStatusDatasetDto
    {
        public string Status { get; set; } = string.Empty;
        public List<int> Counts { get; set; } = new();
        public List<decimal> Amounts { get; set; } = new();
    }

    public class PolicyMixDto
    {
        public List<string> Labels { get; set; } = new();
        public List<int> Values { get; set; } = new();
        public List<PolicyMixDetailDto> Details { get; set; } = new();
    }

    public class PolicyMixDetailDto
    {
        public string Type { get; set; } = string.Empty;
        public decimal Premium { get; set; }
    }

    public class PolicyRenewalDto
    {
        public int PolicyId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int DaysToRenew { get; set; }
        public decimal Premium { get; set; }
    }

    public class SavingsTrendDto
    {
        public decimal TotalSavings { get; set; }
        public List<string> Labels { get; set; } = new();
        public List<decimal> Values { get; set; } = new();
    }
}
