namespace Insurance.Application.DTOs.Claim
{
    /// <summary>
    /// Response model for claim details.
    /// </summary>
    public class ClaimResponse
    {
        public int Id { get; set; }
        public int PolicyId { get; set; }
        public string PolicyNumber { get; set; }
        public string PolicyName { get; set; }
        public int? ClaimsOfficerId { get; set; }
        public string ClaimsOfficerName { get; set; }
        public string ClaimNumber { get; set; }
        
        public DateTime IncidentDate { get; set; }
        public string IncidentLocation { get; set; }
        public string IncidentZipCode { get; set; }
        public string IncidentDescription { get; set; }
        
        public decimal ClaimedAmount { get; set; }
        public decimal EstimatedLossAmount { get; set; }
        public decimal ApprovedAmount { get; set; }
        
        public decimal DisasterImpactScore { get; set; }
        public decimal FraudRiskScore { get; set; }
        public decimal PropertyLossPercentage { get; set; }
        
        public string ReviewNotes { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? DocumentId { get; set; }
        public int RegionalClaimCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}