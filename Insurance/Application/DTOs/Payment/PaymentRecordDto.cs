namespace Application.DTOs.Payment
{
    public class PaymentRecordDto
    {
        public int ApplicationId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } // CreditCard, DebitCard, NetBanking, UPI
        public string TransactionId { get; set; }
    }
}
