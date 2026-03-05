using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Policy
{
    public class CalculatePremiumDto
    {
        [Required]
        public int PolicyApplicationId { get; set; }

        [Required]
        [Range(18, 100, ErrorMessage = "Age must be between 18 and 100")]
        public int CustomerAge { get; set; }

        [Required]
        [Range(1, double.MaxValue, ErrorMessage = "Asset value must be greater than zero")]
        public decimal AssetValue { get; set; }

        [Required]
        [Range(1800, 2100, ErrorMessage = "Year built must be valid")]
        public int YearBuilt { get; set; }

        [Required]
        [StringLength(10)]
        public string ZipCode { get; set; }

        [Required]
        [StringLength(50)]
        public string RiskZone { get; set; } // Flood Zone, Seismic Zone, etc.

        [Required]
        [Range(1, double.MaxValue)]
        public decimal CoverageAmount { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal Deductible { get; set; }
    }
}
