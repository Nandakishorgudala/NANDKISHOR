using Insurance.Domain.Common;
using Insurance.Domain.Enums;

namespace Insurance.Domain.Entities
{
    /// <summary>
    /// Represents a payment transaction for a policy premium.
    /// </summary>
    public class Payment : BaseEntity
    {
        public int PolicyId { get; private set; }
        public Policy Policy { get; private set; }

        public decimal Amount { get; private set; }
        public DateTime PaymentDate { get; private set; }
        public string PaymentMethod { get; private set; } // CreditCard, DebitCard, NetBanking, UPI
        public string TransactionId { get; private set; }
        public PaymentStatus Status { get; private set; }
        public string? Remarks { get; private set; }

        private Payment() { } // Required for EF Core

        public Payment(int policyId, decimal amount, string paymentMethod, string transactionId)
        {
            if (amount <= 0)
                throw new ArgumentException("Payment amount must be greater than zero.");

            if (string.IsNullOrWhiteSpace(paymentMethod))
                throw new ArgumentException("Payment method is required.");

            PolicyId = policyId;
            Amount = amount;
            PaymentDate = DateTime.UtcNow;
            PaymentMethod = paymentMethod;
            TransactionId = transactionId ?? Guid.NewGuid().ToString();
            Status = PaymentStatus.Pending;
            Remarks = string.Empty;

            SetCreationTime();
        }

        public void MarkAsCompleted(string? remarks = null)
        {
            Status = PaymentStatus.Successful;
            Remarks = remarks;
            SetUpdatedTime();
        }

        public void MarkAsFailed(string remarks)
        {
            Status = PaymentStatus.Failed;
            Remarks = remarks;
            SetUpdatedTime();
        }

        public void MarkAsRefunded(string remarks)
        {
            Status = PaymentStatus.Refunded;
            Remarks = remarks;
            SetUpdatedTime();
        }
    }
}
