using System;
using Insurance.Domain.Common;
using Insurance.Domain.Enums;

namespace Insurance.Domain.Entities
{
    public class Invoice : BaseEntity
    {
        public string InvoiceNumber { get; private set; }
        public int CustomerId { get; private set; }
        public Customer Customer { get; private set; }
        
        public InvoiceType RelatedType { get; private set; }
        public int RelatedId { get; private set; } // Either PolicyApplicationId or ClaimId
        
        public decimal AmountBeforeTax { get; private set; }
        public decimal TaxAmount { get; private set; }
        public decimal TotalAmount { get; private set; }
        public string Currency { get; private set; }
        
        public string FilePath { get; private set; }
        public InvoiceStatus Status { get; private set; }
        
        public string GeneratedBy { get; private set; }
        public DateTime GeneratedAt { get; private set; }

        private Invoice() { }

        public Invoice(
            string invoiceNumber, 
            int customerId, 
            InvoiceType relatedType, 
            int relatedId, 
            decimal amountBeforeTax, 
            decimal taxAmount, 
            string filePath,
            string generatedBy = "System")
        {
            InvoiceNumber = invoiceNumber;
            CustomerId = customerId;
            RelatedType = relatedType;
            RelatedId = relatedId;
            AmountBeforeTax = amountBeforeTax;
            TaxAmount = taxAmount;
            TotalAmount = amountBeforeTax + taxAmount;
            Currency = "INR";
            FilePath = filePath;
            Status = InvoiceStatus.Generated;
            GeneratedBy = generatedBy;
            GeneratedAt = DateTime.UtcNow;

            SetCreationTime();
        }

        public void MarkAsSent()
        {
            Status = InvoiceStatus.Sent;
            SetUpdatedTime();
        }

        public void MarkAsViewed()
        {
            Status = InvoiceStatus.Viewed;
            SetUpdatedTime();
        }

        public void MarkAsDownloaded()
        {
            Status = InvoiceStatus.Downloaded;
            SetUpdatedTime();
        }
    }
}
