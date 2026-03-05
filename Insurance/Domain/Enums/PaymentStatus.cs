namespace Insurance.Domain.Enums
{
    /// <summary>
    /// Represents payment processing state.
    /// </summary>
    public enum PaymentStatus
    {
        Pending = 1,
        Successful = 2,
        Failed = 3,
        Refunded = 4
    }
}