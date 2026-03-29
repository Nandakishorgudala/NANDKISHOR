using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Policy
{
    public class ApplyPolicyWithPlanDto
    {
        [Required]
        public int PolicyProductId { get; set; }

        /// <summary>ID of the document uploaded via POST /api/documents/upload.</summary>
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "A valid document must be uploaded before submitting.")]
        public int DocumentId { get; set; }

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

        [Required]
        public DateTime StartDate { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? RequestedCoverage { get; set; }
    }
}
