using System.ComponentModel.DataAnnotations;

namespace Insurance.Application.DTOs.Claim
{
    public class CreateClaimDto
    {
        [Required]
        public int PolicyId { get; set; }

        [Required]
        public DateTime IncidentDate { get; set; }

        [Required]
        [StringLength(200)]
        public string IncidentLocation { get; set; }

        [Required]
        [StringLength(10)]
        public string IncidentZipCode { get; set; }

        [Required]
        [StringLength(1000)]
        public string IncidentDescription { get; set; }

        [Required]
        [Range(1, double.MaxValue, ErrorMessage = "Claimed amount must be greater than zero")]
        public decimal ClaimedAmount { get; set; }
    }
}
