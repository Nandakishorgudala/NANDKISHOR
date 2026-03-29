using Insurance.Domain.Common;
using Insurance.Domain.Enums;

namespace Insurance.Domain.Entities
{
    /// <summary>
    /// Represents a customer's application before policy activation.
    /// </summary>
    public class PolicyApplication : BaseEntity
    {
        // 🔹 Identity
        public int CustomerId { get; private set; }
        public Customer Customer { get; private set; }
        
        public int PolicyProductId { get; private set; }
        public PolicyProduct PolicyProduct { get; private set; }
        
        public int? AgentId { get; private set; }
        public Agent Agent { get; private set; }

        // 🔹 Asset Details
        public string AssetType { get; private set; } // Residential, Commercial, Vehicle
        public decimal AssetValue { get; private set; }
        public int YearBuilt { get; private set; }

        // 🔹 Geographic Data (IMPORTANT for disaster mapping)
        public string State { get; private set; }
        public string City { get; private set; }
        public string ZipCode { get; private set; }
        public string RiskZone { get; private set; } // Flood Zone, Seismic Zone, etc.

        // 🔹 Coverage Details
        public decimal CoverageAmount { get; private set; }
        public decimal Deductible { get; private set; }
        public decimal CalculatedPremium { get; private set; }

        // 🔹 Risk & Underwriting
        public int RiskScore { get; private set; }
        public bool RequiresManualReview { get; private set; }

        // 🔹 Supporting Document
        public int? DocumentId { get; private set; }
        public ApplicationDocument? Document { get; private set; }

        // 🔹 Tenure
        public DateTime StartDate { get; private set; }
        public DateTime EndDate { get; private set; }

        // 🔹 Workflow
        public ApplicationStatus Status { get; private set; } // Pending, Assigned, Approved, Rejected
        public string? RejectionReason { get; private set; }
        public DateTime SubmittedAt { get; private set; }
        public DateTime? ReviewedAt { get; private set; }

        public static PolicyApplication Create(
    int customerId,
    int policyProductId,

    string assetType,
    decimal assetValue,
    int yearBuilt,

    string state,
    string city,
    string zipCode,
    string riskZone,

    decimal coverageAmount,
    decimal deductible,

    int riskScore,
    decimal premium,
    bool requiresManualReview,
    DateTime startDate,
    DateTime endDate)
        {
            return new PolicyApplication
            {
                CustomerId = customerId,
                PolicyProductId = policyProductId,

                AssetType = assetType,
                AssetValue = assetValue,
                YearBuilt = yearBuilt,

                State = state,
                City = city,
                ZipCode = zipCode,
                RiskZone = riskZone,

                CoverageAmount = coverageAmount,
                Deductible = deductible,

                RiskScore = riskScore,
                CalculatedPremium = premium,
                RequiresManualReview = requiresManualReview,

                StartDate = startDate,
                EndDate = endDate,

                Status = ApplicationStatus.Pending,
                SubmittedAt = DateTime.UtcNow
            };
        }

        public void Approve(int agentId)
        {
            if (Status != ApplicationStatus.Pending &&
                Status != ApplicationStatus.Assigned)
                throw new InvalidOperationException("Only pending applications can be approved.");

            AgentId = agentId;
            Status = ApplicationStatus.AgentApproved;
            ReviewedAt = DateTime.UtcNow;
        }

        public void FinalizeApproval()
        {
            if (Status != ApplicationStatus.AgentApproved)
                throw new InvalidOperationException("Only agent-approved applications can be finalized and paid.");

            Status = ApplicationStatus.Approved;
        }

        public void Reject(int agentId, string reason)
        {
            if (Status != ApplicationStatus.Pending &&
                Status != ApplicationStatus.Assigned)
                throw new InvalidOperationException("Only pending applications can be rejected.");

            AgentId = agentId;
            RejectionReason = reason;
            Status = ApplicationStatus.Rejected;
            ReviewedAt = DateTime.UtcNow;
        }

        public void AssignAgent(int agentId)
        {
            if (Status != ApplicationStatus.Pending)
                throw new InvalidOperationException("Only pending applications can be assigned.");

            AgentId = agentId;
            Status = ApplicationStatus.Assigned;
        }

        /// <summary>
        /// Links an already-uploaded document to this application.
        /// Can be called at any point before approval/rejection.
        /// </summary>
        public void AttachDocument(int documentId)
        {
            if (documentId <= 0)
                throw new ArgumentException("Document ID must be a positive integer.", nameof(documentId));

            DocumentId = documentId;
        }

    }
}