using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Policy
{
    public class RejectApplicationDto
    {
        [Required(ErrorMessage = "Rejection reason is required.")]
        public string Reason { get; set; } = string.Empty;
    }
}
