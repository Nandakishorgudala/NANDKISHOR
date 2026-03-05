using System.ComponentModel.DataAnnotations;

namespace Insurance.Application.DTOs.Claim
{
    public class RejectClaimDto
    {
        [Required]
        public int ClaimId { get; set; }

        [Required]
        [StringLength(1000, MinimumLength = 10)]
        public string ReviewNotes { get; set; }
    }
}
