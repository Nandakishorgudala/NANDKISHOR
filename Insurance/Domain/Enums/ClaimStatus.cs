namespace Insurance.Domain.Enums
{
    /// <summary>
    /// Represents the lifecycle state of a claim.
    /// </summary>
    public enum ClaimStatus
    {
        Submitted = 1,
        EligibilityValidated = 2,
        GeoVerified = 3,
        FraudCheckCompleted = 4,
        UnderReview = 5,
        Approved = 6,
        Rejected = 7,
        Settled = 8,
        Closed = 9
    }
}
