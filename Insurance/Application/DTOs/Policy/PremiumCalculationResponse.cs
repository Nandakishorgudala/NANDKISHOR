namespace Application.DTOs.Policy
{
    public class PremiumCalculationResponse
    {
        public int PolicyApplicationId { get; set; }
        public decimal BasePremium { get; set; }
        public decimal AgeFactorMultiplier { get; set; }
        public decimal RiskZoneMultiplier { get; set; }
        public decimal AssetAgeMultiplier { get; set; }
        public decimal CoverageMultiplier { get; set; }
        public decimal CalculatedPremium { get; set; }
        public int RiskScore { get; set; }
        public bool RequiresManualReview { get; set; }
        public string CalculationBreakdown { get; set; }
    }
}
