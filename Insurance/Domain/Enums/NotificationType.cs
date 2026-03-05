namespace Insurance.Domain.Enums
{
    /// <summary>
    /// Represents type of system notification.
    /// </summary>
    public enum NotificationType
    {
        PolicyApproved = 1,
        PaymentReceived = 2,
        ClaimSubmitted = 3,
        ClaimApproved = 4,
        ClaimRejected = 5,
        GeneralAlert = 6
    }
}
