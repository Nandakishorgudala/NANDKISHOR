using Application.DTOs.Policy;
using Application.Interfaces;
using Application.Services;
using Insurance.Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Domain.Enums;
using Moq;
using FluentAssertions;
using Xunit;

namespace Application.Tests.Services
{
    /// <summary>
    /// Unit tests for the Premium Calculation Engine inside <see cref="PolicyService"/>.
    ///
    /// Formula under test:
    ///   Premium = Base × AgeFactor × RiskZone × AssetAge × Coverage × Deductible
    ///
    /// Where:
    ///   Base         = CoverageAmount × 0.01
    ///   AgeFactor    : age ≤30→1.0 | ≤50→1.2 | ≤70→1.5 | 71+→2.0
    ///   RiskZone     : flood→1.5 | seismic/earthquake→1.8 | hurricane/cyclone→1.7 | wildfire→1.6 | tornado→1.4 | other→1.0
    ///   AssetAge     : ≤5yr→0.9 | ≤15yr→1.0 | ≤30yr→1.2 | ≤50yr→1.4 | 50yr+→1.6
    ///   Coverage     : 1.0 + (CoverageAmount/1_000_000) × 0.1
    ///   Deductible   : 1.0 - (Deductible/CoverageAmount) × 0.2
    ///
    /// RiskScore (0-100):
    ///   Age    : 71+→30 | 51-70→20 | 31-50→10 | else→0
    ///   Asset  : 50yr+→30 | 31-50yr→20 | 16-30yr→10 | else→0
    ///   Zone   : seismic/eq→40 | hurricane/cyclone→35 | wildfire→30 | flood→25 | tornado→20
    ///
    /// ManualReview triggered when: RiskScore > 70  OR  CalculatedPremium > 50 000
    /// </summary>
    public class PolicyServiceCalculationTests
    {
        // ── Shared test infrastructure ─────────────────────────────────────────
        private readonly Mock<IPolicyRepository>            _mockPolicyRepo;
        private readonly Mock<IPolicyApplicationRepository> _mockApplicationRepo;
        private readonly Mock<ICustomerRepository>          _mockCustomerRepo;
        private readonly PolicyService                      _service;

        // Shared application stub reused across many tests
        private PolicyApplication BuildApplication(
            decimal coverageAmount = 100_000,
            decimal calculatedPremium = 0,
            ApplicationStatus status = ApplicationStatus.Assigned)
        {
            var app = PolicyApplication.Create(
                customerId:           1,
                policyProductId:      1,
                assetType:            "House",
                assetValue:           coverageAmount,
                yearBuilt:            DateTime.Now.Year - 10,
                state:                "TX",
                city:                 "Dallas",
                zipCode:              "75201",
                riskZone:             "Medium",
                coverageAmount:       coverageAmount,
                deductible:           5_000,
                riskScore:            30,
                premium:              calculatedPremium,
                requiresManualReview: false,
                startDate:            DateTime.UtcNow.Date,
                endDate:              DateTime.UtcNow.Date.AddYears(1));

            // PolicyService.CalculatePremiumAsync checks: if (application.AgentId != agentId) throw...
            // AgentId has a private setter; bypass the domain state-machine guard via reflection.
            // (Standard unit-test approach: set backing property directly without doing a domain transition.)
            typeof(PolicyApplication)
                .GetProperty("AgentId",
                    System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance)!
                .GetSetMethod(nonPublic: true)!
                .Invoke(app, new object?[] { (int?)1 });

            return app;
        }

        public PolicyServiceCalculationTests()
        {
            _mockPolicyRepo        = new Mock<IPolicyRepository>();
            _mockApplicationRepo   = new Mock<IPolicyApplicationRepository>();
            _mockCustomerRepo      = new Mock<ICustomerRepository>();

            _service = new PolicyService(
                _mockPolicyRepo.Object,
                _mockApplicationRepo.Object,
                _mockCustomerRepo.Object);
        }

        // ── Helper: build a CalculatePremiumDto and call the engine ───────────
        private async Task<PremiumCalculationResponse> Calculate(
            decimal coverageAmount,
            int     customerAge,
            string  riskZone,
            int     yearBuilt,
            decimal deductible,
            int     applicationId = 1)
        {
            var application = BuildApplication(coverageAmount);

            _mockApplicationRepo
                .Setup(r => r.GetByIdAsync(applicationId))
                .ReturnsAsync(application);

            var dto = new CalculatePremiumDto
            {
                PolicyApplicationId = applicationId,
                CoverageAmount      = coverageAmount,
                CustomerAge         = customerAge,
                RiskZone            = riskZone,
                YearBuilt           = yearBuilt,
                Deductible          = deductible
            };

            return await _service.CalculatePremiumAsync(agentId: 1, dto);
        }

        // ════════════════════════════════════════════════════════════════════════
        // 1. BASE PREMIUM
        // ════════════════════════════════════════════════════════════════════════

        [Fact]
        public async Task CalculatePremium_BasePremiumIs1PercentOfCoverage()
        {
            // Base = 200_000 * 0.01 = 2_000
            // Then multiplied by all factors — we verify the breakdown contains the base.
            var result = await Calculate(
                coverageAmount: 200_000, customerAge: 30,
                riskZone: "standard", yearBuilt: DateTime.Now.Year - 5,
                deductible: 0);

            result.BasePremium.Should().Be(200_000 * 0.01m);
        }

        // ════════════════════════════════════════════════════════════════════════
        // 2. AGE FACTOR
        // ════════════════════════════════════════════════════════════════════════

        [Theory]
        [InlineData(18,  1.0)]   // boundary: exactly 18 maps to ≤30 band
        [InlineData(30,  1.0)]   // upper boundary of first band
        [InlineData(31,  1.2)]   // first age in second band
        [InlineData(50,  1.2)]   // upper boundary of second band
        [InlineData(51,  1.5)]   // first age in third band
        [InlineData(70,  1.5)]   // upper boundary of third band
        [InlineData(71,  2.0)]   // first age in highest band
        [InlineData(90,  2.0)]   // deep in highest band
        public async Task CalculatePremium_AgeFactor_CorrectMultiplierPerBand(int age, decimal expectedFactor)
        {
            var result = await Calculate(
                coverageAmount: 100_000, customerAge: age,
                riskZone: "standard", yearBuilt: DateTime.Now.Year - 5,
                deductible: 0);

            result.AgeFactorMultiplier.Should().Be(expectedFactor,
                because: $"age {age} should map to factor {expectedFactor}");
        }

        [Fact]
        public async Task CalculatePremium_OlderCustomer_PaysHigherPremiumThanYounger()
        {
            var youngResult = await Calculate(100_000, customerAge: 25,  "standard", DateTime.Now.Year - 5, 0);
            var oldResult   = await Calculate(100_000, customerAge: 72,  "standard", DateTime.Now.Year - 5, 0, applicationId: 2);

            oldResult.CalculatedPremium.Should().BeGreaterThan(youngResult.CalculatedPremium,
                because: "a 72-year-old customer is a higher risk than a 25-year-old");
        }

        // ════════════════════════════════════════════════════════════════════════
        // 3. RISK ZONE FACTOR
        // ════════════════════════════════════════════════════════════════════════

        [Theory]
        [InlineData("flood",             1.5)]
        [InlineData("Flood Zone A",      1.5)]   // case-insensitive substring
        [InlineData("seismic",           1.8)]
        [InlineData("earthquake zone",   1.8)]
        [InlineData("hurricane",         1.7)]
        [InlineData("cyclone",           1.7)]
        [InlineData("wildfire",          1.6)]
        [InlineData("tornado",           1.4)]
        [InlineData("Low",               1.0)]   // no keyword → default
        [InlineData("standard",          1.0)]
        public async Task CalculatePremium_RiskZoneFactor_CorrectMultiplier(string riskZone, decimal expectedFactor)
        {
            var result = await Calculate(
                coverageAmount: 100_000, customerAge: 30,
                riskZone: riskZone, yearBuilt: DateTime.Now.Year - 5,
                deductible: 0);

            result.RiskZoneMultiplier.Should().Be(expectedFactor,
                because: $"zone '{riskZone}' should map to factor {expectedFactor}");
        }

        [Fact]
        public async Task CalculatePremium_SeismicZone_PaysHighestRiskZonePremium()
        {
            var seismicResult = await Calculate(100_000, 30, "seismic",   DateTime.Now.Year - 5, 0);
            var floodResult   = await Calculate(100_000, 30, "flood",     DateTime.Now.Year - 5, 0, applicationId: 2);
            var lowResult     = await Calculate(100_000, 30, "standard",  DateTime.Now.Year - 5, 0, applicationId: 3);

            seismicResult.CalculatedPremium.Should().BeGreaterThan(floodResult.CalculatedPremium);
            floodResult.CalculatedPremium.Should().BeGreaterThan(lowResult.CalculatedPremium);
        }

        // ════════════════════════════════════════════════════════════════════════
        // 4. ASSET AGE FACTOR
        // ════════════════════════════════════════════════════════════════════════

        [Theory]
        [InlineData(0,  0.9)]    // brand new
        [InlineData(5,  0.9)]    // boundary: ≤5 years
        [InlineData(6,  1.0)]    // first year in next band
        [InlineData(15, 1.0)]    // boundary: ≤15 years
        [InlineData(16, 1.2)]
        [InlineData(30, 1.2)]
        [InlineData(31, 1.4)]
        [InlineData(50, 1.4)]
        [InlineData(51, 1.6)]    // very old building
        [InlineData(80, 1.6)]
        public async Task CalculatePremium_AssetAgeFactor_CorrectMultiplier(int assetAgeYears, decimal expectedFactor)
        {
            var yearBuilt = DateTime.Now.Year - assetAgeYears;

            var result = await Calculate(
                coverageAmount: 100_000, customerAge: 30,
                riskZone: "standard", yearBuilt: yearBuilt,
                deductible: 0);

            result.AssetAgeMultiplier.Should().Be(expectedFactor,
                because: $"an asset {assetAgeYears} years old should map to factor {expectedFactor}");
        }

        [Fact]
        public async Task CalculatePremium_OlderBuilding_PaysMoreThanNewBuilding()
        {
            var newBuildResult  = await Calculate(100_000, 30, "standard", DateTime.Now.Year - 2,  0);
            var oldBuildResult  = await Calculate(100_000, 30, "standard", DateTime.Now.Year - 60, 0, applicationId: 2);

            oldBuildResult.CalculatedPremium.Should().BeGreaterThan(newBuildResult.CalculatedPremium);
        }

        // ════════════════════════════════════════════════════════════════════════
        // 5. COVERAGE FACTOR
        // ════════════════════════════════════════════════════════════════════════

        [Theory]
        [InlineData(100_000,   1.01)]   // 1.0 + (0.1/1_000_000)*0.1 = 1.01
        [InlineData(500_000,   1.05)]
        [InlineData(1_000_000, 1.10)]
        [InlineData(2_000_000, 1.20)]
        public async Task CalculatePremium_CoverageFactor_ScalesWithCoverageAmount(
            decimal coverage, decimal expectedFactor)
        {
            var application = BuildApplication(coverage);
            _mockApplicationRepo
                .Setup(r => r.GetByIdAsync(1))
                .ReturnsAsync(application);

            var dto = new CalculatePremiumDto
            {
                PolicyApplicationId = 1,
                CoverageAmount      = coverage,
                CustomerAge         = 30,
                RiskZone            = "standard",
                YearBuilt           = DateTime.Now.Year - 5,
                Deductible          = 0   // neutralise deductible factor
            };

            var result = await _service.CalculatePremiumAsync(1, dto);

            // CoverageFactor = 1.0 + (coverage / 1_000_000) * 0.1
            var expected = 1.0m + (coverage / 1_000_000m) * 0.1m;
            result.CoverageMultiplier.Should().Be(expected);
        }

        // ════════════════════════════════════════════════════════════════════════
        // 6. DEDUCTIBLE FACTOR
        // ════════════════════════════════════════════════════════════════════════

        [Fact]
        public async Task CalculatePremium_HigherDeductible_LowersPremium()
        {
            // Same coverage, same everything — higher deductible should reduce premium
            var lowDeductibleResult  = await Calculate(100_000, 30, "standard", DateTime.Now.Year - 5, deductible: 1_000);
            var highDeductibleResult = await Calculate(100_000, 30, "standard", DateTime.Now.Year - 5, deductible: 20_000, applicationId: 2);

            highDeductibleResult.CalculatedPremium.Should().BeLessThan(lowDeductibleResult.CalculatedPremium,
                because: "a higher deductible shifts risk to the insured, reducing the premium");
        }

        [Fact]
        public async Task CalculatePremium_ZeroDeductible_DeductibleFactorIsOne()
        {
            // Factor = 1.0 - (0 / coverage) * 0.2 = 1.0
            var result = await Calculate(100_000, 30, "standard", DateTime.Now.Year - 5, deductible: 0);
            // Deductible factor is embedded in calculated premium; verify via breakdown string
            result.CalculationBreakdown.Should().Contain("Deductible(1.0)");
        }

        // ════════════════════════════════════════════════════════════════════════
        // 7. RISK SCORE ENGINE
        // ════════════════════════════════════════════════════════════════════════

        [Theory]
        //                          age   yearBuilt                    riskZone      expectedMin expectedMax
        [InlineData(25, 2020, "standard",   0,  19)]    // young, new, safe  → low score
        [InlineData(72, 1960, "seismic",   80, 100)]    // old age+old build+seismic → near max
        [InlineData(55, 1985, "flood",     30,  70)]    // mid values
        public async Task CalculatePremium_RiskScore_WithinExpectedRange(
            int age, int yearBuilt, string zone, int minScore, int maxScore)
        {
            var result = await Calculate(100_000, age, zone, yearBuilt, 0);

            result.RiskScore.Should().BeInRange(minScore, maxScore,
                because: $"age={age}, yearBuilt={yearBuilt}, zone={zone}");
        }

        [Fact]
        public async Task CalculatePremium_SeismicZoneOldBuildingOldCustomer_MaximumRiskScore()
        {
            // Max contributions: age 71+ (30) + asset 50yr+ (30) + seismic (40) = 100
            var result = await Calculate(
                coverageAmount: 100_000,
                customerAge: 80,
                riskZone: "seismic",
                yearBuilt: DateTime.Now.Year - 55,
                deductible: 0);

            result.RiskScore.Should().Be(100);
        }

        [Fact]
        public async Task CalculatePremium_YoungCustomerNewBuildingLowRiskZone_ZeroRiskScore()
        {
            // None of the age/asset/zone thresholds are hit
            var result = await Calculate(
                coverageAmount: 100_000,
                customerAge: 25,
                riskZone: "standard",
                yearBuilt: DateTime.Now.Year - 3,
                deductible: 0);

            result.RiskScore.Should().Be(0);
        }

        // ════════════════════════════════════════════════════════════════════════
        // 8. MANUAL REVIEW TRIGGER
        // ════════════════════════════════════════════════════════════════════════

        [Fact]
        public async Task CalculatePremium_RiskScoreAbove70_RequiresManualReview()
        {
            // seismic(40) + age 80(30) + 50yr-old building(30) = 100 → triggers review
            var result = await Calculate(
                coverageAmount: 100_000,
                customerAge: 80,
                riskZone: "seismic",
                yearBuilt: DateTime.Now.Year - 55,
                deductible: 0);

            result.RequiresManualReview.Should().BeTrue(
                because: "risk score 100 exceeds the threshold of 70");
        }

        [Fact]
        public async Task CalculatePremium_PremiumAbove50000_RequiresManualReview()
        {
            // Very high coverage → very high premium (pushes over ₹50,000)
            // 10_000_000 * 0.01 base = 100_000 before multipliers → will exceed ₹50,000
            var result = await Calculate(
                coverageAmount: 10_000_000,
                customerAge: 30,
                riskZone: "standard",
                yearBuilt: DateTime.Now.Year - 5,
                deductible: 0);

            result.RequiresManualReview.Should().BeTrue(
                because: "a premium exceeding ₹50,000 always triggers manual underwriting review");
        }

        [Fact]
        public async Task CalculatePremium_LowRiskAllFactors_DoesNotRequireManualReview()
        {
            // Young | new build | safe zone | moderate coverage → well below thresholds
            var result = await Calculate(
                coverageAmount: 50_000,
                customerAge: 25,
                riskZone: "standard",
                yearBuilt: DateTime.Now.Year - 2,
                deductible: 5_000);

            result.RequiresManualReview.Should().BeFalse();
            result.RiskScore.Should().BeLessThanOrEqualTo(70);
        }

        // ════════════════════════════════════════════════════════════════════════
        // 9. END-TO-END FORMULA VERIFICATION
        // ════════════════════════════════════════════════════════════════════════

        [Fact]
        public async Task CalculatePremium_KnownInputs_ProducesExactExpectedPremium()
        {
            // Known fixed inputs with fully deterministic calculation:
            //   Coverage   = 500_000
            //   Base       = 500_000 * 0.01 = 5_000
            //   Age 40     → AgeFactor = 1.2
            //   Zone flood → RiskZone  = 1.5
            //   Built 2010 → assetAge  = 2025 - 2010 = 15 → AssetAge = 1.0  (≤15 band)
            //   Coverage   → CovFactor = 1.0 + (500_000/1_000_000)*0.1 = 1.05
            //   Deductible = 10_000 → DeduFactor = 1.0 - (10_000/500_000)*0.2 = 1.0 - 0.004 = 0.996
            //
            //   Premium = 5_000 × 1.2 × 1.5 × 1.0 × 1.05 × 0.996 = 9_447.60

            const int yearBuilt = 2010;
            var assetAge = DateTime.Now.Year - yearBuilt;
            // Asset age factor: ≤15 → 1.0, ≤30 → 1.2 — pick correct factor
            var assetFactor  = assetAge <= 5 ? 0.9m : assetAge <= 15 ? 1.0m
                             : assetAge <= 30 ? 1.2m : assetAge <= 50 ? 1.4m : 1.6m;
            var deduFactor   = 1.0m - (10_000m / 500_000m) * 0.2m;       // 0.996
            var covFactor    = 1.0m + (500_000m / 1_000_000m) * 0.1m;    // 1.05
            var expected     = Math.Round(5_000m * 1.2m * 1.5m * assetFactor * covFactor * deduFactor, 2);

            var result = await Calculate(
                coverageAmount: 500_000,
                customerAge:    40,
                riskZone:       "flood",
                yearBuilt:      yearBuilt,
                deductible:     10_000);

            result.CalculatedPremium.Should().Be(expected,
                because: "all factors are known and deterministic");
        }

        // ════════════════════════════════════════════════════════════════════════
        // 10. RESPONSE METADATA
        // ════════════════════════════════════════════════════════════════════════

        [Fact]
        public async Task CalculatePremium_Response_ContainsCalculationBreakdown()
        {
            var result = await Calculate(100_000, 35, "flood", DateTime.Now.Year - 10, 5_000);

            result.CalculationBreakdown.Should().NotBeNullOrEmpty();
            result.CalculationBreakdown.Should().Contain("Base:");
            result.CalculationBreakdown.Should().Contain("Age(");
            result.CalculationBreakdown.Should().Contain("Risk Zone(");
        }

        [Fact]
        public async Task CalculatePremium_Response_PolicyApplicationIdMatchesInput()
        {
            var result = await Calculate(100_000, 30, "standard", DateTime.Now.Year - 5, 0, applicationId: 1);

            result.PolicyApplicationId.Should().Be(1);
        }
    }
}
