using System;

namespace Application.DTOs.Common
{
    public class InvoiceDto
    {
        public int Id { get; set; }
        public string InvoiceNumber { get; set; }
        public int CustomerId { get; set; }
        public string RelatedType { get; set; }
        public int RelatedId { get; set; }
        public decimal AmountBeforeTax { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string Currency { get; set; }
        public string Status { get; set; }
        public string RelatedName { get; set; }
        public DateTime GeneratedAt { get; set; }
        public string ViewUrl { get; set; }
        public string DownloadUrl { get; set; }
    }
}
