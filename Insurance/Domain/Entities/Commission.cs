using Insurance.Domain.Common;

namespace Insurance.Domain.Entities
{
    public class Commission : BaseEntity
    {
        public int AgentId { get; private set; }
        public Agent Agent { get; private set; }

        public int PolicyId { get; private set; }
        public Policy Policy { get; private set; }

        public decimal Amount { get; private set; }
        public DateTime EarnedAt { get; private set; }

        private Commission() { } // EF Core

        public Commission(int agentId, int policyId, decimal amount)
        {
            if (amount <= 0)
                throw new ArgumentException("Commission amount must be greater than zero.");

            AgentId = agentId;
            PolicyId = policyId;
            Amount = amount;
            EarnedAt = DateTime.UtcNow;

            SetCreationTime();
        }
    }
}
