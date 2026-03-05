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

        // 🔹 Workflow
        public ApplicationStatus Status { get; private set; } // Pending, Assigned, Approved, Rejected
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
    bool requiresManualReview)
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

                Status = ApplicationStatus.Submitted,
                SubmittedAt = DateTime.UtcNow
            };
        }

        public void Approve(int agentId)
        {
            if (Status != ApplicationStatus.Pending &&
                Status != ApplicationStatus.Assigned)
                throw new InvalidOperationException("Only pending applications can be approved.");

            AgentId = agentId;
            Status = ApplicationStatus.Approved;
            ReviewedAt = DateTime.UtcNow;
        }

        public void Reject(int agentId)
        {
            if (Status != ApplicationStatus.Pending &&
                Status != ApplicationStatus.Assigned)
                throw new InvalidOperationException("Only pending applications can be rejected.");

            AgentId = agentId;
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

    }
}