using Application.DTOs.Policy;
using Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Domain.Enums;
using Insurance.Application.Interfaces;

namespace Application.Services
{
    public class PolicyService : IPolicyService
    {
        private readonly IPolicyRepository _policyRepository;
        private readonly IPolicyApplicationRepository _applicationRepository;
        private readonly ICustomerRepository _customerRepository;

        public PolicyService(
            IPolicyRepository policyRepository,
            IPolicyApplicationRepository applicationRepository,
            ICustomerRepository customerRepository)
        {
            _policyRepository = policyRepository;
            _applicationRepository = applicationRepository;
            _customerRepository = customerRepository;
        }

        public async Task<PremiumCalculationResponse> CalculatePremiumAsync(int agentId, CalculatePremiumDto dto)
        {
            var application = await _applicationRepository.GetByIdAsync(dto.PolicyApplicationId);
            if (application == null)
                throw new InvalidOperationException("Policy application not found.");

            if (application.AgentId != agentId)
                throw new UnauthorizedAccessException("This application is not assigned to you.");

            // Get base premium from policy product
            var basePremium = application.CoverageAmount * 0.01m; // 1% of coverage as base

            // Age factor (18-30: 1.0, 31-50: 1.2, 51-70: 1.5, 71+: 2.0)
            var ageFactor = CalculateAgeFactor(dto.CustomerAge);

            // Risk zone factor
            var riskZoneFactor = CalculateRiskZoneFactor(dto.RiskZone);

            // Asset age factor (newer buildings = lower premium)
            var currentYear = DateTime.Now.Year;
            var assetAge = currentYear - dto.YearBuilt;
            var assetAgeFactor = CalculateAssetAgeFactor(assetAge);

            // Coverage factor (higher coverage = higher premium)
            var coverageFactor = 1.0m + (dto.CoverageAmount / 1000000m) * 0.1m;

            // Deductible factor (higher deductible = lower premium)
            var deductibleFactor = 1.0m - (dto.Deductible / dto.CoverageAmount) * 0.2m;

            // Calculate final premium
            var calculatedPremium = basePremium * ageFactor * riskZoneFactor * assetAgeFactor * coverageFactor * deductibleFactor;

            // Calculate risk score (0-100)
            var riskScore = CalculateRiskScore(dto.CustomerAge, dto.YearBuilt, dto.RiskZone);

            // Determine if manual review is required
            var requiresManualReview = riskScore > 70 || calculatedPremium > 50000;

            var breakdown = $"Base: ₹{basePremium:F2} × Age({ageFactor}) × Risk Zone({riskZoneFactor}) × Asset Age({assetAgeFactor}) × Coverage({coverageFactor}) × Deductible({deductibleFactor})";

            return new PremiumCalculationResponse
            {
                PolicyApplicationId = dto.PolicyApplicationId,
                BasePremium = basePremium,
                AgeFactorMultiplier = ageFactor,
                RiskZoneMultiplier = riskZoneFactor,
                AssetAgeMultiplier = assetAgeFactor,
                CoverageMultiplier = coverageFactor,
                CalculatedPremium = Math.Round(calculatedPremium, 2),
                RiskScore = riskScore,
                RequiresManualReview = requiresManualReview,
                CalculationBreakdown = breakdown
            };
        }

        public async Task<PolicyResponse> CreatePolicyAsync(int applicationId)
        {
            var application = await _applicationRepository.GetByIdAsync(applicationId);
            if (application == null)
                throw new InvalidOperationException("Application not found.");

            if (application.Status != Insurance.Domain.Enums.ApplicationStatus.Approved)
                throw new InvalidOperationException("Only approved applications can be converted to policies.");

            // Check if policy already exists
            var existingPolicy = await _policyRepository.GetByApplicationIdAsync(applicationId);
            if (existingPolicy != null)
                throw new InvalidOperationException("Policy already exists for this application.");

            var policyNumber = GeneratePolicyNumber();
            var startDate = DateTime.UtcNow;
            var endDate = startDate.AddMonths(12); // 1 year policy

            var policy = new Policy(
                application.CustomerId,
                applicationId,
                policyNumber,
                application.CalculatedPremium,
                application.CoverageAmount,
                startDate,
                endDate
            );

            await _policyRepository.AddAsync(policy);
            await _policyRepository.SaveChangesAsync();

            return await MapToResponseAsync(policy);
        }

        public async Task<PolicyResponse> GetPolicyByIdAsync(int policyId)
        {
            var policy = await _policyRepository.GetByIdAsync(policyId);
            if (policy == null)
                throw new InvalidOperationException("Policy not found.");

            return await MapToResponseAsync(policy);
        }

        public async Task<IEnumerable<PolicyResponse>> GetPoliciesByCustomerIdAsync(int customerId)
        {
            var policies = await _policyRepository.GetByCustomerIdAsync(customerId);
            var responses = new List<PolicyResponse>();

            foreach (var policy in policies)
            {
                responses.Add(await MapToResponseAsync(policy));
            }

            return responses;
        }

        public async Task<IEnumerable<PolicyResponse>> GetAllPoliciesAsync()
        {
            var policies = await _policyRepository.GetAllAsync();
            var responses = new List<PolicyResponse>();

            foreach (var policy in policies)
            {
                responses.Add(await MapToResponseAsync(policy));
            }

            return responses;
        }

        // Helper methods for premium calculation
        private decimal CalculateAgeFactor(int age)
        {
            return age switch
            {
                <= 30 => 1.0m,
                <= 50 => 1.2m,
                <= 70 => 1.5m,
                _ => 2.0m
            };
        }

        private decimal CalculateRiskZoneFactor(string riskZone)
        {
            return riskZone.ToLower() switch
            {
                var z when z.Contains("flood") => 1.5m,
                var z when z.Contains("seismic") || z.Contains("earthquake") => 1.8m,
                var z when z.Contains("hurricane") || z.Contains("cyclone") => 1.7m,
                var z when z.Contains("wildfire") => 1.6m,
                var z when z.Contains("tornado") => 1.4m,
                _ => 1.0m
            };
        }

        private decimal CalculateAssetAgeFactor(int assetAge)
        {
            return assetAge switch
            {
                <= 5 => 0.9m,
                <= 15 => 1.0m,
                <= 30 => 1.2m,
                <= 50 => 1.4m,
                _ => 1.6m
            };
        }

        private int CalculateRiskScore(int age, int yearBuilt, string riskZone)
        {
            int score = 0;

            // Age contribution (max 30 points)
            if (age > 70) score += 30;
            else if (age > 50) score += 20;
            else if (age > 30) score += 10;

            // Asset age contribution (max 30 points)
            var assetAge = DateTime.Now.Year - yearBuilt;
            if (assetAge > 50) score += 30;
            else if (assetAge > 30) score += 20;
            else if (assetAge > 15) score += 10;

            // Risk zone contribution (max 40 points)
            var zone = riskZone.ToLower();
            if (zone.Contains("seismic") || zone.Contains("earthquake")) score += 40;
            else if (zone.Contains("hurricane") || zone.Contains("cyclone")) score += 35;
            else if (zone.Contains("wildfire")) score += 30;
            else if (zone.Contains("flood")) score += 25;
            else if (zone.Contains("tornado")) score += 20;

            return Math.Min(score, 100);
        }

        private string GeneratePolicyNumber()
        {
            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
            var random = new Random().Next(1000, 9999);
            return $"POL-{timestamp}-{random}";
        }

        private async Task<PolicyResponse> MapToResponseAsync(Policy policy)
        {
            var customer = await _customerRepository.GetByIdAsync(policy.CustomerId);
            
            return new PolicyResponse
            {
                Id = policy.Id,
                CustomerId = policy.CustomerId,
                CustomerName = customer != null ? $"Customer {customer.Id}" : "Unknown",
                PolicyNumber = policy.PolicyNumber,
                PolicyName = policy.Application?.PolicyProduct?.Name ?? "N/A",
                PremiumAmount = policy.PremiumAmount,
                CoverageAmount = policy.CoverageAmount,
                TotalCoverageAmount = policy.CoverageAmount + policy.TotalClaimedAmount,
                RemainingCoverageAmount = policy.CoverageAmount,
                StartDate = policy.StartDate,
                EndDate = policy.EndDate,
                Status = policy.Status.ToString(),
                CreatedAt = policy.CreatedAt
            };
        }
    }
}
