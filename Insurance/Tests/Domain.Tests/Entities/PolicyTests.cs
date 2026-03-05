using Insurance.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Domain.Tests.Entities
{
    public class PolicyTests
    {
        [Fact]
        public void Constructor_WithValidParameters_ShouldCreatePolicy()
        {
            // Arrange & Act
            var policy = new Policy
            {
                PolicyNumber = "POL-001",
                CustomerId = 1,
                AgentId = 1,
                PolicyProductId = 1,
                PremiumAmount = 1000,
                CoverageAmount = 50000,
                StartDate = DateTime.Now,
                EndDate = DateTime.Now.AddYears(1),
                Status = "Active"
            };

            // Assert
            policy.PolicyNumber.Should().Be("POL-001");
            policy.CustomerId.Should().Be(1);
            policy.AgentId.Should().Be(1);
            policy.PremiumAmount.Should().Be(1000);
            policy.CoverageAmount.Should().Be(50000);
            policy.Status.Should().Be("Active");
        }

        [Theory]
        [InlineData("Active")]
        [InlineData("Expired")]
        [InlineData("Cancelled")]
        public void Status_WithValidStatuses_ShouldSetCorrectly(string status)
        {
            // Arrange & Act
            var policy = new Policy { Status = status };

            // Assert
            policy.Status.Should().Be(status);
        }

        [Fact]
        public void Policy_WithClaims_ShouldHaveClaimsCollection()
        {
            // Arrange
            var policy = new Policy { PolicyId = 1 };
            var claim1 = new Claim { PolicyId = 1 };
            var claim2 = new Claim { PolicyId = 1 };

            // Act
            policy.Claims = new List<Claim> { claim1, claim2 };

            // Assert
            policy.Claims.Should().HaveCount(2);
            policy.Claims.Should().Contain(claim1);
            policy.Claims.Should().Contain(claim2);
        }

        [Fact]
        public void EndDate_ShouldBeAfterStartDate()
        {
            // Arrange
            var startDate = DateTime.Now;
            var endDate = startDate.AddYears(1);

            // Act
            var policy = new Policy
            {
                StartDate = startDate,
                EndDate = endDate
            };

            // Assert
            policy.EndDate.Should().BeAfter(policy.StartDate);
        }

        [Theory]
        [InlineData(1000, 50000)]
        [InlineData(2000, 100000)]
        [InlineData(500, 25000)]
        public void PremiumAndCoverage_WithValidAmounts_ShouldSetCorrectly(decimal premium, decimal coverage)
        {
            // Arrange & Act
            var policy = new Policy
            {
                PremiumAmount = premium,
                CoverageAmount = coverage
            };

            // Assert
            policy.PremiumAmount.Should().Be(premium);
            policy.CoverageAmount.Should().Be(coverage);
            policy.CoverageAmount.Should().BeGreaterThan(policy.PremiumAmount);
        }
    }
}
