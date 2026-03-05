using Insurance.Domain.Common;

namespace Insurance.Domain.Entities
{
    /// <summary>
    /// Represents an insurance product template configured by the admin.
    /// </summary>
    public class PolicyProduct : BaseEntity
    {
                    public string Name { get; private set; }
                    public string Description { get; private set; }
                    public decimal BasePremium { get; private set; }
                    public decimal CoverageAmount { get; private set; }
                    public int TenureMonths { get; private set; }
                    public int ClaimLimit { get; private set; }
                    public bool IsActive { get; private set; }

                    private PolicyProduct() { }

                    public PolicyProduct(
                        string name,
                        string description,
                        decimal basePremium,
                        decimal coverageAmount,
                        int tenureMonths,
                        int claimLimit)
                    {
                        Name = name;
                        Description = description;
                        BasePremium = basePremium;
                        CoverageAmount = coverageAmount;
                        TenureMonths = tenureMonths;
                        ClaimLimit = claimLimit;
                        IsActive = true;

                        SetCreationTime();
                    }

                    public void Update(
                        string name,
                        string description,
                        decimal basePremium,
                        decimal coverageAmount,
                        int tenureMonths,
                        int claimLimit)
                    {
                        Name = name;
                        Description = description;
                        BasePremium = basePremium;
                        CoverageAmount = coverageAmount;
                        TenureMonths = tenureMonths;
                        ClaimLimit = claimLimit;

                        SetUpdatedTime();
                    }

                    public void Deactivate()
                    {
                        IsActive = false;
                        SetUpdatedTime();
                    }

                    public void Activate()
                    {
                        IsActive = true;
                        SetUpdatedTime();
                    }
    }
}