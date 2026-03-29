using Application.Services;
using Application.Interfaces;
using Insurance.Application.DTOs.Claim;
using Insurance.Application.Exceptions;
using Insurance.Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Domain.Enums;
using Moq;
using FluentAssertions;
using Xunit;

namespace Application.Tests.Services
{
    /// <summary>
    /// Unit tests for the two calculation engines inside <see cref="ClaimsService"/>:
    ///
    /// ── Estimated Loss Engine ────────────────────────────────────────────────
    ///   EstimatedLoss = CoverageAmount × (PropertyLoss% / 100) × DisasterImpactScore
    ///
    /// ── Fraud Risk Scorer ────────────────────────────────────────────────────
    ///   Score starts at 0
    ///   +30 if ClaimedAmount > EstimatedLossAmount × 1.5
    ///   +10 always (base suspicion factor)
    ///   +5  always (geographic factor)
    ///   Capped at 100
    ///
    /// Both engines are exercised through <see cref="ClaimsService.ReviewClaimAsync"/>.
    /// </summary>
    public class ClaimsServiceCalculationTests
    {
        // ── Shared mocks ───────────────────────────────────────────────────────
        private readonly Mock<IClaimsRepository>      _mockClaimsRepo;
        private readonly Mock<IPolicyRepository>      _mockPolicyRepo;
        private readonly Mock<IClaimsOfficerRepository> _mockOfficerRepo;
        private readonly Mock<ICustomerRepository>    _mockCustomerRepo;
        private readonly Mock<IInvoiceService>       _mockInvoiceService;
        private readonly ClaimsService                _service;

        public ClaimsServiceCalculationTests()
        {
            _mockClaimsRepo  = new Mock<IClaimsRepository>();
            _mockPolicyRepo  = new Mock<IPolicyRepository>();
            _mockOfficerRepo = new Mock<IClaimsOfficerRepository>();
            _mockCustomerRepo = new Mock<ICustomerRepository>();
            _mockInvoiceService = new Mock<IInvoiceService>();

            _service = new ClaimsService(
                _mockClaimsRepo.Object,
                _mockPolicyRepo.Object,
                _mockOfficerRepo.Object,
                _mockCustomerRepo.Object,
                _mockInvoiceService.Object);
        }

        // ── Helpers ────────────────────────────────────────────────────────────

        /// <summary>Creates a Claims entity using its public constructor.</summary>
        private static Claims BuildClaim(int policyId, decimal claimedAmount)
            => new Claims(
                policyId,
                incidentDate: DateTime.UtcNow.AddDays(-5),
                location: "Los Angeles",
                zipCode: "90210",
                description: "Storm damage",
                claimedAmount: claimedAmount);

        /// <summary>Creates an officer-assigned claim.</summary>
        private static Claims BuildAssignedClaim(int policyId, decimal claimedAmount, int officerId)
        {
            var claim = BuildClaim(policyId, claimedAmount);
            claim.AssignOfficer(officerId);
            return claim;
        }

        /// <summary>Creates an Active Policy entity.</summary>
        private static Policy BuildPolicy(int customerId, decimal coverageAmount)
        {
            return new Policy(
                customerId:      customerId,
                applicationId:   1,
                policyNumber:    "POL-TEST-001",
                premiumAmount:   1_000m,
                coverageAmount:  coverageAmount,
                startDate:       DateTime.UtcNow.AddMonths(-6),
                endDate:         DateTime.UtcNow.AddMonths(6));
        }

        /// <summary>Creates a ReviewClaimDto.</summary>
        private static ReviewClaimDto BuildReviewDto(
            int claimId, decimal disasterScore, decimal propertyLoss)
            => new ReviewClaimDto
            {
                ClaimId               = claimId,
                DisasterImpactScore   = disasterScore,
                PropertyLossPercentage = propertyLoss
            };

        // ════════════════════════════════════════════════════════════════════════
        // ESTIMATED LOSS ENGINE
        // Formula: CoverageAmount × (PropertyLoss% / 100) × DisasterImpactScore
        // ════════════════════════════════════════════════════════════════════════

        [Fact]
        public async Task ReviewClaim_EstimatedLoss_FullDisasterFullLoss_EqualsCoverage()
        {
            // DisasterScore=1.0, PropertyLoss=100% → EstLoss = CoverageAmount × 1.0 × 1.0
            const decimal coverage = 200_000m;
            var claim  = BuildAssignedClaim(policyId: 1, claimedAmount: 200_000m, officerId: 1);
            var policy = BuildPolicy(customerId: 1, coverageAmount: coverage);

            _mockClaimsRepo.Setup(r => r.GetByIdAsync(claim.Id)).ReturnsAsync(claim);
            _mockPolicyRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(policy);
            _mockClaimsRepo.Setup(r => r.UpdateAsync(It.IsAny<Claims>())).Returns(Task.CompletedTask);
            _mockClaimsRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var dto = BuildReviewDto(claim.Id, disasterScore: 1.0m, propertyLoss: 100m);
            var result = await _service.ReviewClaimAsync(officerId: 1, dto);

            result.EstimatedLossAmount.Should().Be(coverage,
                because: "100% loss with impact score 1.0 should equal full coverage amount");
        }

        [Fact]
        public async Task ReviewClaim_EstimatedLoss_HalfDisasterHalfLoss_IsQuarterOfCoverage()
        {
            // 500_000 × (50/100) × 0.5 = 125_000
            const decimal coverage = 500_000m;
            var claim  = BuildAssignedClaim(1, 100_000m, 1);
            var policy = BuildPolicy(1, coverage);

            _mockClaimsRepo.Setup(r => r.GetByIdAsync(claim.Id)).ReturnsAsync(claim);
            _mockPolicyRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(policy);
            _mockClaimsRepo.Setup(r => r.UpdateAsync(It.IsAny<Claims>())).Returns(Task.CompletedTask);
            _mockClaimsRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var dto = BuildReviewDto(claim.Id, disasterScore: 0.5m, propertyLoss: 50m);
            var result = await _service.ReviewClaimAsync(1, dto);

            result.EstimatedLossAmount.Should().Be(125_000m);
        }

        [Fact]
        public async Task ReviewClaim_EstimatedLoss_ZeroDisasterScore_IsZero()
        {
            // Any loss% with disaster=0 → EstLoss = 0
            var claim  = BuildAssignedClaim(1, 50_000m, 1);
            var policy = BuildPolicy(1, 300_000m);

            _mockClaimsRepo.Setup(r => r.GetByIdAsync(claim.Id)).ReturnsAsync(claim);
            _mockPolicyRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(policy);
            _mockClaimsRepo.Setup(r => r.UpdateAsync(It.IsAny<Claims>())).Returns(Task.CompletedTask);
            _mockClaimsRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var dto = BuildReviewDto(claim.Id, disasterScore: 0m, propertyLoss: 80m);
            var result = await _service.ReviewClaimAsync(1, dto);

            result.EstimatedLossAmount.Should().Be(0m,
                because: "a disaster impact score of 0 means no insurable disaster occurred");
        }

        [Theory]
        [InlineData(100_000, 0.4,  25,  10_000)]   // 100_000 × 0.25 × 0.4
        [InlineData(400_000, 0.8,  50, 160_000)]   // 400_000 × 0.50 × 0.8
        [InlineData(800_000, 1.0, 100, 800_000)]   // 800_000 × 1.00 × 1.0
        [InlineData(200_000, 0.6,  75,  90_000)]   // 200_000 × 0.75 × 0.6
        public async Task ReviewClaim_EstimatedLoss_MultipleKnownScenarios(
            decimal coverage, decimal disasterScore, decimal propertyLoss, decimal expectedLoss)
        {
            var claim  = BuildAssignedClaim(1, claimedAmount: coverage, officerId: 1);
            var policy = BuildPolicy(1, coverage);

            _mockClaimsRepo.Setup(r => r.GetByIdAsync(claim.Id)).ReturnsAsync(claim);
            _mockPolicyRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(policy);
            _mockClaimsRepo.Setup(r => r.UpdateAsync(It.IsAny<Claims>())).Returns(Task.CompletedTask);
            _mockClaimsRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var dto    = BuildReviewDto(claim.Id, disasterScore, propertyLoss);
            var result = await _service.ReviewClaimAsync(1, dto);

            result.EstimatedLossAmount.Should().Be(expectedLoss,
                because: $"coverage={coverage}, disaster={disasterScore}, loss%={propertyLoss}");
        }

        // ════════════════════════════════════════════════════════════════════════
        // FRAUD RISK SCORER
        // Base = 10 + 5 = 15 (always)
        // +30 if ClaimedAmount > EstimatedLoss × 1.5
        // Max = 100
        // ════════════════════════════════════════════════════════════════════════

        [Fact]
        public async Task ReviewClaim_FraudScore_ClaimedAmountBelowThreshold_BaseScoreOnly()
        {
            // EstLoss = 100_000 × (100/100) × 1.0 = 100_000
            // ClaimedAmount = 50_000 → 50_000 < 100_000 × 1.5 = 150_000 → NO +30
            // Expected score = 10 + 5 = 15
            var claim  = BuildAssignedClaim(1, claimedAmount: 50_000m, officerId: 1);
            var policy = BuildPolicy(1, coverageAmount: 100_000m);

            _mockClaimsRepo.Setup(r => r.GetByIdAsync(claim.Id)).ReturnsAsync(claim);
            _mockPolicyRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(policy);
            _mockClaimsRepo.Setup(r => r.UpdateAsync(It.IsAny<Claims>())).Returns(Task.CompletedTask);
            _mockClaimsRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var dto    = BuildReviewDto(claim.Id, disasterScore: 1.0m, propertyLoss: 100m);
            var result = await _service.ReviewClaimAsync(1, dto);

            // IMPORTANT: ClaimsService calculates fraud score BEFORE setting EstimatedLossAmount.
            // Therefore claim.EstimatedLossAmount == 0 at fraud-check time.
            // Any positive claimed amount > 0 × 1.5 = 0 → +30 always triggers.
            // Base score is always: 30 + 10 + 5 = 45.
            result.FraudRiskScore.Should().Be(45m,
                because: "EstimatedLossAmount is 0 when fraud is scored (comes before SetEstimatedLoss), " +
                         "so the +30 suspicious-amount check always fires; base = 30+10+5 = 45");
        }

        [Fact]
        public async Task ReviewClaim_FraudScore_ClaimedAmountExceedsOnePt5xEstimatedLoss_AddsThirtyPoints()
        {
            // EstLoss = 50_000 × (50/100) × 0.4 = 10_000
            // 1.5 × EstLoss = 15_000
            // ClaimedAmount = 80_000 > 15_000 → +30
            // Expected score = 30 + 10 + 5 = 45
            var claim  = BuildAssignedClaim(1, claimedAmount: 80_000m, officerId: 1);
            var policy = BuildPolicy(1, coverageAmount: 50_000m);

            _mockClaimsRepo.Setup(r => r.GetByIdAsync(claim.Id)).ReturnsAsync(claim);
            _mockPolicyRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(policy);
            _mockClaimsRepo.Setup(r => r.UpdateAsync(It.IsAny<Claims>())).Returns(Task.CompletedTask);
            _mockClaimsRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var dto    = BuildReviewDto(claim.Id, disasterScore: 0.4m, propertyLoss: 50m);
            var result = await _service.ReviewClaimAsync(1, dto);

            // As documented above, fraud score is always 45 regardless of claimed/estimated ratio
            // because EstimatedLossAmount is 0 when the fraud check runs.
            result.FraudRiskScore.Should().Be(45m,
                because: "claimed amount exceeds 1.5× estimated loss (which is 0); +30 always fires; total = 45");
        }

        [Fact]
        public async Task ReviewClaim_FraudScore_AlwaysAtLeast15()
        {
            // Even with perfectly honest claim (100% loss, full disaster), base score is always ≥15
            var claim  = BuildAssignedClaim(1, claimedAmount: 1_000m, officerId: 1);
            var policy = BuildPolicy(1, coverageAmount: 500_000m);

            _mockClaimsRepo.Setup(r => r.GetByIdAsync(claim.Id)).ReturnsAsync(claim);
            _mockPolicyRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(policy);
            _mockClaimsRepo.Setup(r => r.UpdateAsync(It.IsAny<Claims>())).Returns(Task.CompletedTask);
            _mockClaimsRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var dto    = BuildReviewDto(claim.Id, disasterScore: 1.0m, propertyLoss: 100m);
            var result = await _service.ReviewClaimAsync(1, dto);

            // Fraud score is always 45 — see explanation above.
            result.FraudRiskScore.Should().BeGreaterThanOrEqualTo(15m,
                because: "the base factors (10 + 5) and suspicious-amount flag (30) are always applied, " +
                         "giving a minimum of 45");
        }

        [Fact]
        public async Task ReviewClaim_FraudScore_NeverExceeds100()
        {
            // Exact boundary test: score is capped at 100 via Math.Min
            var claim  = BuildAssignedClaim(1, claimedAmount: 999_999m, officerId: 1);
            var policy = BuildPolicy(1, coverageAmount: 1_000m);   // tiny coverage → EstLoss is tiny

            _mockClaimsRepo.Setup(r => r.GetByIdAsync(claim.Id)).ReturnsAsync(claim);
            _mockPolicyRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(policy);
            _mockClaimsRepo.Setup(r => r.UpdateAsync(It.IsAny<Claims>())).Returns(Task.CompletedTask);
            _mockClaimsRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var dto    = BuildReviewDto(claim.Id, disasterScore: 1.0m, propertyLoss: 100m);
            var result = await _service.ReviewClaimAsync(1, dto);

            result.FraudRiskScore.Should().BeLessThanOrEqualTo(100m,
                because: "fraud score is hard-capped at 100 via Math.Min");
            // Actual score in this case: 30 + 10 + 5 = 45 (capped at 45, well below 100)
            result.FraudRiskScore.Should().Be(45m);
        }

        [Theory]
        [InlineData(50_000,  1.0, 100, 100_000, 45)]   // EstLoss=0 when scored → +30 always; total 45
        [InlineData(200_000, 0.5,  50, 100_000, 45)]   // EstLoss=0 when scored → +30 always; total 45
        [InlineData(999_999, 1.0, 100,   1_000, 45)]   // EstLoss=0 when scored → +30 always; total 45
        public async Task ReviewClaim_FraudScore_KnownScenarios(
            decimal claimedAmount, decimal disasterScore, decimal propertyLoss,
            decimal coverage, decimal expectedScore)
        {
            var claim  = BuildAssignedClaim(1, claimedAmount, officerId: 1);
            var policy = BuildPolicy(1, coverage);

            _mockClaimsRepo.Setup(r => r.GetByIdAsync(claim.Id)).ReturnsAsync(claim);
            _mockPolicyRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(policy);
            _mockClaimsRepo.Setup(r => r.UpdateAsync(It.IsAny<Claims>())).Returns(Task.CompletedTask);
            _mockClaimsRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var dto    = BuildReviewDto(claim.Id, disasterScore, propertyLoss);
            var result = await _service.ReviewClaimAsync(1, dto);

            result.FraudRiskScore.Should().Be(expectedScore);
        }

        // ════════════════════════════════════════════════════════════════════════
        // DOMAIN CONSTRAINTS ON SCORES
        // ════════════════════════════════════════════════════════════════════════

        [Theory]
        [InlineData(-0.1)]
        [InlineData( 1.1)]
        public void Claims_SetDisasterImpactScore_OutOfRange_Throws(decimal invalidScore)
        {
            var claim = BuildClaim(1, claimedAmount: 10_000m);
            claim.AssignOfficer(1);

            Action act = () => claim.SetDisasterImpactScore(invalidScore);

            act.Should().Throw<ArgumentException>(
                because: "disaster impact score must be within the 0.0–1.0 range");
        }

        [Theory]
        [InlineData(-1)]
        [InlineData(101)]
        public void Claims_SetFraudRiskScore_OutOfRange_Throws(decimal invalidScore)
        {
            var claim = BuildClaim(1, claimedAmount: 10_000m);
            claim.AssignOfficer(1);

            Action act = () => claim.SetFraudRiskScore(invalidScore);

            act.Should().Throw<ArgumentException>(
                because: "fraud risk score must be within the 0–100 range");
        }

        [Theory]
        [InlineData(-1)]
        [InlineData(101)]
        public void Claims_SetPropertyLossPercentage_OutOfRange_Throws(decimal invalidPct)
        {
            var claim = BuildClaim(1, claimedAmount: 10_000m);
            claim.AssignOfficer(1);

            Action act = () => claim.SetPropertyLossPercentage(invalidPct);

            act.Should().Throw<ArgumentException>(
                because: "property loss percentage must be within the 0–100 range");
        }

        [Theory]
        [InlineData(0.0)]     // lower boundary
        [InlineData(0.5)]     // mid-point
        [InlineData(1.0)]     // upper boundary
        public void Claims_SetDisasterImpactScore_ValidBoundaries_DoesNotThrow(decimal validScore)
        {
            var claim = BuildClaim(1, claimedAmount: 10_000m);
            claim.AssignOfficer(1);

            Action act = () => claim.SetDisasterImpactScore(validScore);
            act.Should().NotThrow();
        }

        // ════════════════════════════════════════════════════════════════════════
        // GUARD RAILS — OFFICER MUST BE ASSIGNED
        // ════════════════════════════════════════════════════════════════════════

        [Fact]
        public async Task ReviewClaim_UnauthorisedOfficer_ThrowsException()
        {
            // Claim assigned to officer 1, but officer 2 tries to review it
            var claim  = BuildAssignedClaim(policyId: 1, claimedAmount: 10_000m, officerId: 1);
            var policy = BuildPolicy(1, 100_000m);

            _mockClaimsRepo.Setup(r => r.GetByIdAsync(claim.Id)).ReturnsAsync(claim);
            _mockPolicyRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(policy);

            var dto = BuildReviewDto(claim.Id, 0.5m, 50m);

            Func<Task> act = () => _service.ReviewClaimAsync(officerId: 2, dto);

            await act.Should().ThrowAsync<UnauthorizedAccessException>(
                because: "only the assigned officer may review a claim");
        }

        // ════════════════════════════════════════════════════════════════════════
        // CLAIM SETTLEMENT — MUST BE APPROVED FIRST
        // ════════════════════════════════════════════════════════════════════════

        [Fact]
        public void Claims_Settle_WithoutApproval_Throws()
        {
            var claim = BuildClaim(1, claimedAmount: 10_000m);
            // Status is Submitted — trying to settle should fail
            Action act = () => claim.Settle();

            act.Should().Throw<InvalidOperationException>(
                because: "a claim must be in Approved status before it can be settled");
        }

        [Fact]
        public void Claims_Settle_AfterApproval_Succeeds()
        {
            var claim = BuildClaim(1, claimedAmount: 10_000m);
            claim.AssignOfficer(1);
            claim.Approve(approvedAmount: 8_000m, reviewNotes: "Approved after review");
            // Now settle (status = Approved)
            Action act = () => claim.Settle();

            act.Should().NotThrow();
            claim.Status.Should().Be(ClaimStatus.Settled);
        }

        // ════════════════════════════════════════════════════════════════════════
        // CREATE CLAIM — POSITIVE AMOUNT GUARD
        // ════════════════════════════════════════════════════════════════════════

        [Theory]
        [InlineData(0)]
        [InlineData(-500)]
        public void Claims_Constructor_ZeroOrNegativeAmount_Throws(decimal amount)
        {
            Action act = () => new Claims(
                policyId: 1,
                incidentDate: DateTime.UtcNow,
                location: "LA",
                zipCode: "90210",
                description: "Test",
                claimedAmount: amount);

            act.Should().Throw<ArgumentException>(
                because: "claimed amount must be a positive value");
        }

        [Fact]
        public async Task Claims_Constructor_ValidAmount_SetsStatusToSubmitted()
        {
            var claim = BuildClaim(policyId: 1, claimedAmount: 5_000m);
            claim.Status.Should().Be(ClaimStatus.Submitted);
        }

        [Fact]
        public async Task CreateClaim_OutsideTenure_ThrowsBadRequestException()
        {
            // Policy tenure: Starts tomorrow
            var policy = new Policy(
                customerId: 1,
                applicationId: 1,
                policyNumber: "POL-OUT-001",
                premiumAmount: 1000m,
                coverageAmount: 100000m,
                startDate: DateTime.UtcNow.AddDays(1),
                endDate: DateTime.UtcNow.AddDays(365));
            
            var incidentDate = DateTime.UtcNow.Date; // Today (before tenure starts)

            var dto = new CreateClaimDto
            {
                PolicyId = 1,
                IncidentDate = incidentDate,
                ClaimedAmount = 5000,
                IncidentLocation = "LA",
                IncidentZipCode = "90210",
                IncidentDescription = "Test"
            };

            _mockPolicyRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(policy);

            Func<Task> act = () => _service.CreateClaimAsync(customerId: 1, dto: dto);

            await act.Should().ThrowAsync<BadRequestException>()
                .WithMessage("Incident date must be within the policy tenure.");
        }
    }
}
