namespace Insurance.Application.DTOs.Claim
{
    /// <summary>
    /// Request model for submitting a claim.
    /// </summary>
    public class CreateClaimRequest
    {
        public int PolicyId { get; set; }
        public DateTime IncidentDate { get; set; }
        public string IncidentLocation { get; set; } = string.Empty;
        public decimal ClaimedAmount { get; set; }
    }
}