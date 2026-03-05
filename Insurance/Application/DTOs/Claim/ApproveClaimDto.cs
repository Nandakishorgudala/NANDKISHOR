using System.ComponentModel.DataAnnotations;

namespace Insurance.Application.DTOs.Claim
{
    public class ApproveClaimDto
    {
        [Required]
        public int ClaimId { get; set; }

        [Required]
        [Range(1, double.MaxValue, ErrorMessage = "Approved amount must be greater than zero")]
        public decimal ApprovedAmount { get; set; }

        [StringLength(1000)]
        public string ReviewNotes { get; set; }
    }
}
