namespace Insurance.Application.DTOs.Policy
{
    /// <summary>
    /// Request model for creating a new policy product.
    /// </summary>
    public class CreatePolicyProductRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal BasePremium { get; set; }
        public decimal CoverageAmount { get; set; }
        public int TenureMonths { get; set; }
        public int ClaimLimit { get; set; }
    }
}