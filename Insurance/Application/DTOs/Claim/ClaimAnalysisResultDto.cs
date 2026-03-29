using System;

namespace Insurance.Application.DTOs.Claim
{
    public class ClaimAnalysisResultDto
    {
        public int ClaimId { get; set; }
        public string ExtractedText { get; set; }
        
        // Match Scores
        public double NameMatchScore { get; set; }
        public bool IsNameMatch { get; set; }
        
        // Date Validation
        public bool IsWithinPolicyPeriod { get; set; }
        public bool PassesWaitingPeriod { get; set; } // > 15 days
        public DateTime PolicyStartDate { get; set; }
        public DateTime PolicyEndDate { get; set; }
        public DateTime ClaimDate { get; set; }
        public int DaysSincePolicyStart { get; set; }
        
        // AI Analysis
        public string Recommendation { get; set; } // Approve, Reject, Manual Review
        public string Reasoning { get; set; }
    }
}
