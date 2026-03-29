namespace Application.DTOs.Verification
{
    public class VerificationResultDto
    {
        public int ApplicationId { get; set; }
        public string ExtractedText { get; set; }
        
        // Match Scores (0-100)
        public double NameMatchScore { get; set; }
        public double AddressMatchScore { get; set; }
        public double AgeMatchScore { get; set; }
        public double AverageMatchScore { get; set; }
        
        // Extracted Info
        public string ExtractedName { get; set; }
        public string ExtractedAddress { get; set; }
        public int? ExtractedAge { get; set; }
        public string? ExtractedDOB { get; set; }
        
        // Risk Profile
        public int ExistingPoliciesCount { get; set; }
        public double RiskScore { get; set; } // 0-100
        public string RiskAssessment { get; set; } // Low, Medium, High
        
        // AI Advice
        public string Recommendation { get; set; } // Approve, Reject, Manual Review
        public string Reasoning { get; set; }
    }
}
