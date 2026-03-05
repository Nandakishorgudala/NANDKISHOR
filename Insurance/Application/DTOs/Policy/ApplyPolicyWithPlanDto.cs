using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Policy
{
    public class ApplyPolicyWithPlanDto
    {
        [Required]
        public int PolicyProductId { get; set; }

        [Required]
        [Range(18, 100)]
        public int CustomerAge { get; set; }

        [Required]
        public string PlanType { get; set; } // "Basic", "Plus", "Advanced"

        [Required]
        public string AssetType { get; set; }

        [Range(1, double.MaxValue)]
        public decimal AssetValue { get; set; }

        [Range(1800, 2100)]
        public int YearBuilt { get; set; }

        [Required]
        public string State { get; set; }

        [Required]
        public string City { get; set; }

        [Required]
        public string ZipCode { get; set; }

        [Required]
        public string RiskZone { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Deductible { get; set; }
    }
}
