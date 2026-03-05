namespace Insurance.Domain.Enums
{
    /// <summary>
    /// Represents the lifecycle state of a policy.
    /// </summary>
    public enum PolicyStatus
    {
        Pending = 1,       // Application created
        Approved = 2,      // Approved but not activated
        Active = 3,        // Payment completed
        Expired = 4,       // Policy tenure completed
        Cancelled = 5      // Terminated before expiry
    }
}