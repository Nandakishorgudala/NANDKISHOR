using System.ComponentModel.DataAnnotations;

namespace Insurance.Application.DTOs.Claim
{
    public class ReviewClaimDto
    {
        [Required]
        public int ClaimId { get; set; }

        [Required]
        [Range(0, 100, ErrorMessage = "Property loss percentage must be between 0 and 100")]
        public decimal PropertyLossPercentage { get; set; }

        [Required]
        [Range(0, 1, ErrorMessage = "Disaster impact score must be between 0 and 1")]
        public decimal DisasterImpactScore { get; set; }

        [StringLength(1000)]
        public string ReviewNotes { get; set; }
    }
}
