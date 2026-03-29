using Insurance.Domain.Common;
using Insurance.Domain.Enums;

namespace Insurance.Domain.Entities
{
    /// <summary>
    /// Represents an insurance claim raised by a customer.
    /// </summary>
    public class Claims : BaseEntity
    {
        public int PolicyId { get; private set; }
        public Policy Policy { get; private set; }

        public int? ClaimsOfficerId { get; private set; }
        public ClaimsOfficer ClaimsOfficer { get; private set; }

        public DateTime IncidentDate { get; private set; }
        public string IncidentLocation { get; private set; }
        public string IncidentZipCode { get; private set; }
        public string IncidentDescription { get; private set; }
        
        public decimal ClaimedAmount { get; private set; }
        public decimal EstimatedLossAmount { get; private set; }
        public decimal ApprovedAmount { get; private set; }
        
        // Supporting Document
        public int? DocumentId { get; private set; }
        public ClaimDocument? Document { get; private set; }
        
        // Disaster and Risk Assessment
        public decimal DisasterImpactScore { get; private set; } // 0-1 score based on postal code disaster severity
        public decimal FraudRiskScore { get; private set; } // 0-100 score
        public decimal PropertyLossPercentage { get; private set; } // 0-100%
        
        public string? ReviewNotes { get; private set; }
        public ClaimStatus Status { get; private set; }

        private Claims() { }

        public Claims(int policyId, DateTime incidentDate, string location, string zipCode, string description, decimal claimedAmount, int? documentId = null)
        {
            if (claimedAmount <= 0)
                throw new ArgumentException("Claimed amount must be greater than zero.");

            PolicyId = policyId;
            IncidentDate = incidentDate;
            IncidentLocation = location ?? throw new ArgumentNullException(nameof(location));
            IncidentZipCode = zipCode ?? throw new ArgumentNullException(nameof(zipCode));
            IncidentDescription = description;
            ClaimedAmount = claimedAmount;
            DocumentId = documentId;
            Status = ClaimStatus.Submitted;

            SetCreationTime();
        }

        public void SetDisasterImpactScore(decimal score)
        {
            if (score < 0 || score > 1)
                throw new ArgumentException("Disaster impact score must be between 0 and 1.");

            DisasterImpactScore = score;
            SetUpdatedTime();
        }

        public void SetFraudRiskScore(decimal score)
        {
            if (score < 0 || score > 100)
                throw new ArgumentException("Fraud risk score must be between 0 and 100.");

            FraudRiskScore = score;
            SetUpdatedTime();
        }

        public void SetPropertyLossPercentage(decimal percentage)
        {
            if (percentage < 0 || percentage > 100)
                throw new ArgumentException("Property loss percentage must be between 0 and 100.");

            PropertyLossPercentage = percentage;
            SetUpdatedTime();
        }

        public void SetEstimatedLoss(decimal amount)
        {
            EstimatedLossAmount = amount;
            SetUpdatedTime();
        }

        public void AssignOfficer(int officerId)
        {
            ClaimsOfficerId = officerId;
            Status = ClaimStatus.UnderReview;
            SetUpdatedTime();
        }

        public void Approve(decimal approvedAmount, string reviewNotes = null)
        {
            if (approvedAmount <= 0)
                throw new ArgumentException("Approved amount must be greater than zero.");

            ApprovedAmount = approvedAmount;
            ReviewNotes = reviewNotes ?? string.Empty;
            Status = ClaimStatus.Approved;
            SetUpdatedTime();
        }

        public void Reject(string reviewNotes)
        {
            if (string.IsNullOrWhiteSpace(reviewNotes))
                throw new ArgumentException("Rejection reason is required.");

            ReviewNotes = reviewNotes;
            Status = ClaimStatus.Rejected;
            SetUpdatedTime();
        }

        public void AcceptClaim()
        {
            if (Status != ClaimStatus.Approved)
                throw new InvalidOperationException("Only approved claims can be accepted.");

            Status = ClaimStatus.Settled;
            SetUpdatedTime();
        }

        public void Settle()
        {
            if (Status != ClaimStatus.Approved)
                throw new InvalidOperationException("Only approved claims can be settled.");

            Status = ClaimStatus.Settled;
            SetUpdatedTime();
        }
    }
}