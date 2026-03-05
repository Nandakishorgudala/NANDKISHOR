namespace Insurance.Application.DTOs.Policy
{
    /// <summary>
    /// Response model for policy product.
    /// </summary>
    public class PolicyProductResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal BasePremium { get; set; }
        public decimal CoverageAmount { get; set; }
        public int TenureMonths { get; set; }
        public bool IsActive { get; set; }
    }
}