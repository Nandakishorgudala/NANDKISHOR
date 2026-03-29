using Insurance.Domain.Common;
using Insurance.Domain.Enums;

namespace Insurance.Domain.Entities
{
    /// <summary>
    /// Represents an active insurance policy.
    /// </summary>
    public class Policy : BaseEntity
    {
        public int CustomerId { get; private set; }
        public Customer Customer { get; private set; }

        public int ApplicationId { get; private set; }
        public PolicyApplication Application { get; private set; }

        public string PolicyNumber { get; private set; }
        public decimal PremiumAmount { get; private set; }
        public decimal CoverageAmount { get; private set; }
        public decimal TotalClaimedAmount { get; private set; }
        public DateTime StartDate { get; private set; }
        public DateTime EndDate { get; private set; }
        public PolicyStatus Status { get; private set; }

        // Navigation properties
        public ICollection<Claims> Claims { get; private set; } = new List<Claims>();
        public ICollection<Payment> Payments { get; private set; } = new List<Payment>();

        private Policy() { }

        public Policy(
            int customerId,
            int applicationId,
            string policyNumber,
            decimal premiumAmount,
            decimal coverageAmount,
            DateTime startDate,
            DateTime endDate)
        {
            if (string.IsNullOrWhiteSpace(policyNumber))
                throw new ArgumentException("Policy number cannot be empty.");

            if (premiumAmount <= 0)
                throw new ArgumentException("Premium amount must be greater than zero.");

            CustomerId = customerId;
            ApplicationId = applicationId;
            PolicyNumber = policyNumber;
            PremiumAmount = premiumAmount;
            CoverageAmount = coverageAmount;
            StartDate = startDate;
            EndDate = endDate;
            Status = PolicyStatus.Active;

            SetCreationTime();
        }

        public void Expire()
        {
            Status = PolicyStatus.Expired;
            SetUpdatedTime();
        }

        public void Cancel()
        {
            Status = PolicyStatus.Cancelled;
            SetUpdatedTime();
        }

        public void Renew(DateTime newEndDate, decimal newPremiumAmount)
        {
            if (Status != PolicyStatus.Active && Status != PolicyStatus.Expired)
                throw new InvalidOperationException("Only active or expired policies can be renewed.");

            EndDate = newEndDate;
            PremiumAmount = newPremiumAmount;
            Status = PolicyStatus.Active;
            SetUpdatedTime();
        }

        public void DeductCoverage(decimal amount)
        {
            if (amount <= 0)
                throw new ArgumentException("Deduction amount must be greater than zero.");

            if (amount > CoverageAmount)
                throw new InvalidOperationException("Deduction amount exceeds remaining coverage.");

            CoverageAmount -= amount;
            TotalClaimedAmount += amount;
            SetUpdatedTime();
        }
    }
}