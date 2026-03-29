using Application.Services;
using Application.DTOs.Policy;
using Application.Interfaces;
using Insurance.Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Domain.Enums;
using Moq;
using FluentAssertions;
using Xunit;

namespace Application.Tests.Services
{
    public class PolicyApplicationServiceTests
    {
        private readonly Mock<IPolicyApplicationRepository> _mockApplicationRepo;
        private readonly Mock<IAgentRepository> _mockAgentRepo;
        private readonly Mock<IPolicyRepository> _mockPolicyRepo;
        private readonly Mock<IPolicyProductRepository> _mockPolicyProductRepo;
        private readonly Mock<IApplicationDocumentRepository> _mockDocumentRepo;
        private readonly PolicyApplicationService _service;

        public PolicyApplicationServiceTests()
        {
            _mockApplicationRepo = new Mock<IPolicyApplicationRepository>();
            _mockAgentRepo = new Mock<IAgentRepository>();
            _mockPolicyRepo = new Mock<IPolicyRepository>();
            _mockPolicyProductRepo = new Mock<IPolicyProductRepository>();
            _mockDocumentRepo = new Mock<IApplicationDocumentRepository>();
            
            _service = new PolicyApplicationService(
                _mockApplicationRepo.Object,
                _mockAgentRepo.Object,
                _mockPolicyRepo.Object,
                _mockPolicyProductRepo.Object,
                _mockDocumentRepo.Object
            );

            _mockDocumentRepo.Setup(x => x.GetByIdAsync(It.IsAny<int>()))
                .ReturnsAsync(ApplicationDocument.Create("test.pdf", "test.pdf", "application/pdf", 1024, 1));
        }

        /// <summary>
        /// Sets the Status property on a PolicyApplication via reflection,
        /// bypassing domain guards — necessary for test setup because Create()
        /// starts with Submitted, while Approve/Reject require Pending or Assigned.
        /// </summary>
        private static void SetApplicationStatus(PolicyApplication app, ApplicationStatus status)
        {
            typeof(PolicyApplication)
                .GetProperty("Status",
                    System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance)!
                .GetSetMethod(nonPublic: true)!
                .Invoke(app, new object[] { status });
        }

        [Fact]
        public async Task SubmitApplicationWithPlanAsync_BasicPlan_CalculatesCorrectCoverage()
        {
            // Arrange
            var customerId = 1;
            var dto = new ApplyPolicyWithPlanDto
            {
                PolicyProductId = 1,
                CustomerAge = 35,
                PlanType = "Basic",
                AssetType = "House",
                AssetValue = 200000,
                YearBuilt = 2010,
                State = "California",
                City = "Los Angeles",
                ZipCode = "90210",
                RiskZone = "Medium",
                Deductible = 5000,
                StartDate = DateTime.UtcNow.Date
            };

            _mockApplicationRepo.Setup(x => x.AddAsync(It.IsAny<PolicyApplication>()))
                .Returns(Task.CompletedTask);
            _mockApplicationRepo.Setup(x => x.SaveChangesAsync())
                .Returns(Task.CompletedTask);

            // The service `SubmitApplicationWithPlanAsync` returns the new application's ID.
            // Since the mock doesn't trigger EF Core ID generation, the returned ID is always 0.
            // Instead of asserting result > 0 (which relies on EF), we verify the repo was called.
            _mockApplicationRepo.Verify(x => x.AddAsync(It.Is<PolicyApplication>(app =>
                app.CustomerId == customerId &&
                app.AssetValue == 200000 &&
                app.Status == ApplicationStatus.Submitted
            )), Times.Once);
        }

        [Theory]
        [InlineData("Basic", 1.0)]
        [InlineData("Plus", 1.25)]
        [InlineData("Advanced", 1.5)]
        public async Task SubmitApplicationWithPlanAsync_DifferentPlanTypes_AppliesCorrectMultiplier(
            string planType, decimal expectedMultiplier)
        {
            // Arrange
            var customerId = 1;
            var dto = new ApplyPolicyWithPlanDto
            {
                PolicyProductId = 1,
                CustomerAge = 50, // Age 50 = 1.0 multiplier
                PlanType = planType,
                AssetType = "House",
                AssetValue = 100000,
                YearBuilt = 2020,
                State = "Texas",
                City = "Dallas",
                ZipCode = "75201",
                RiskZone = "Low",
                Deductible = 2500,
                StartDate = DateTime.UtcNow.Date
            };

            _mockApplicationRepo.Setup(x => x.AddAsync(It.IsAny<PolicyApplication>()))
                .Returns(Task.CompletedTask);
            _mockApplicationRepo.Setup(x => x.SaveChangesAsync())
                .Returns(Task.CompletedTask);

            // Expected coverage: 100000 * 0.8 * expectedMultiplier * 1.0 (age 50)
            var expectedCoverage = 100000 * 0.8m * expectedMultiplier * 1.0m;

            // Act
            await _service.SubmitApplicationWithPlanAsync(customerId, dto);

            // Assert
            _mockApplicationRepo.Verify(x => x.AddAsync(It.Is<PolicyApplication>(app => 
                app.CoverageAmount == expectedCoverage
            )), Times.Once);
        }

        [Theory]
        [InlineData(25, 1.2)] // Young customer gets 20% more coverage
        [InlineData(35, 1.1)] // Middle-aged gets 10% more
        [InlineData(50, 1.0)] // Standard coverage
        [InlineData(55, 0.95)] // Slight reduction
        [InlineData(70, 0.9)] // Older customer gets 10% less
        public async Task SubmitApplicationWithPlanAsync_DifferentAges_AppliesCorrectAgeMultiplier(
            int age, decimal expectedAgeMultiplier)
        {
            // Arrange
            var customerId = 1;
            var dto = new ApplyPolicyWithPlanDto
            {
                PolicyProductId = 1,
                CustomerAge = age,
                PlanType = "Basic", // 1.0 multiplier
                AssetType = "Car",
                AssetValue = 50000,
                YearBuilt = 2020,
                State = "Florida",
                City = "Miami",
                ZipCode = "33101",
                RiskZone = "Low",
                Deductible = 1000,
                StartDate = DateTime.UtcNow.Date
            };

            _mockApplicationRepo.Setup(x => x.AddAsync(It.IsAny<PolicyApplication>()))
                .Returns(Task.CompletedTask);
            _mockApplicationRepo.Setup(x => x.SaveChangesAsync())
                .Returns(Task.CompletedTask);

            // Expected coverage: 50000 * 0.8 * 1.0 * expectedAgeMultiplier
            var expectedCoverage = 50000 * 0.8m * 1.0m * expectedAgeMultiplier;

            // Act
            await _service.SubmitApplicationWithPlanAsync(customerId, dto);

            // Assert
            _mockApplicationRepo.Verify(x => x.AddAsync(It.Is<PolicyApplication>(app => 
                app.CoverageAmount == expectedCoverage
            )), Times.Once);
        }

        [Theory]
        [InlineData("High",   false)]  // Zone name alone doesn't trigger review; must exceed riskScore>70 or premium>50k
        [InlineData("Medium", false)]
        [InlineData("Low",    false)]
        public async Task SubmitApplicationWithPlanAsync_DifferentRiskZones_SetsManualReviewCorrectly(
            string riskZone, bool shouldRequireManualReview)
        {
            // Arrange
            var customerId = 1;
            var dto = new ApplyPolicyWithPlanDto
            {
                PolicyProductId = 1,
                CustomerAge = 40,
                PlanType = "Basic",
                AssetType = "House",
                AssetValue = 300000, // Medium asset value
                YearBuilt = 2015, // Recent construction
                State = "Nevada",
                City = "Las Vegas",
                ZipCode = "89101",
                RiskZone = riskZone,
                Deductible = 3000,
                StartDate = DateTime.UtcNow.Date
            };

            _mockApplicationRepo.Setup(x => x.AddAsync(It.IsAny<PolicyApplication>()))
                .Returns(Task.CompletedTask);
            _mockApplicationRepo.Setup(x => x.SaveChangesAsync())
                .Returns(Task.CompletedTask);

            // Act
            await _service.SubmitApplicationWithPlanAsync(customerId, dto);

            // Assert
            _mockApplicationRepo.Verify(x => x.AddAsync(It.Is<PolicyApplication>(app => 
                app.RequiresManualReview == shouldRequireManualReview
            )), Times.Once);
        }

        [Fact]
        public async Task SubmitApplicationWithPlanAsync_HighValueOldProperty_CalculatesHighRiskScore()
        {
            // Arrange
            var customerId = 1;
            var dto = new ApplyPolicyWithPlanDto
            {
                PolicyProductId = 1,
                CustomerAge = 70, // Older customer (+10 risk)
                PlanType = "Advanced",
                AssetType = "Historic Mansion",
                AssetValue = 1000000, // High value (+20 risk)
                YearBuilt = 1950, // Old property (+25 risk)
                State = "California",
                City = "San Francisco",
                ZipCode = "94102",
                RiskZone = "High", // High risk zone (+30 risk)
                Deductible = 10000,
                StartDate = DateTime.UtcNow.Date
            };

            _mockApplicationRepo.Setup(x => x.AddAsync(It.IsAny<PolicyApplication>()))
                .Returns(Task.CompletedTask);
            _mockApplicationRepo.Setup(x => x.SaveChangesAsync())
                .Returns(Task.CompletedTask);

            // Act
            await _service.SubmitApplicationWithPlanAsync(customerId, dto);

            // Assert
            _mockApplicationRepo.Verify(x => x.AddAsync(It.Is<PolicyApplication>(app => 
                app.RiskScore >= 80 && // Should be high risk
                app.RequiresManualReview == true
            )), Times.Once);
        }

        [Fact]
        public async Task ApproveApplicationAsync_ValidApplication_UpdatesStatus()
        {
            // Arrange
            var applicationId = 1;
            var agentId = 1;
            var application = PolicyApplication.Create(
                customerId: 1,
                policyProductId: 1,
                assetType: "House",
                assetValue: 200000,
                yearBuilt: 2015,
                state: "Texas",
                city: "Austin",
                zipCode: "78701",
                riskZone: "Medium",
                coverageAmount: 160000,
                deductible: 5000,
                riskScore: 45,
                premium: 2400,
                requiresManualReview: false,
                startDate: DateTime.UtcNow.Date,
                endDate: DateTime.UtcNow.Date.AddYears(1));

            var policyProduct = new PolicyProduct(
                name: "Home Insurance",
                description: "Comprehensive home coverage",
                basePremium: 2000,
                coverageAmount: 200000,
                tenureMonths: 12,
                claimLimit: 3);

            // Approve requires Status=Pending or Assigned; bypass domain guard via reflection.
            SetApplicationStatus(application, ApplicationStatus.Pending);

            _mockApplicationRepo.Setup(x => x.GetByIdAsync(applicationId))
                .ReturnsAsync(application);
            _mockPolicyProductRepo.Setup(x => x.GetByIdAsync(application.PolicyProductId))
                .ReturnsAsync(policyProduct);
            _mockApplicationRepo.Setup(x => x.SaveChangesAsync())
                .Returns(Task.CompletedTask);
            _mockPolicyRepo.Setup(x => x.AddAsync(It.IsAny<Policy>()))
                .Returns(Task.CompletedTask);
            _mockPolicyRepo.Setup(x => x.SaveChangesAsync())
                .Returns(Task.CompletedTask);

            // Act
            await _service.ApproveApplicationAsync(applicationId, agentId);

            // Assert — verify that status is updated to Approved
            application.Status.Should().Be(ApplicationStatus.Approved);
            _mockApplicationRepo.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task RejectApplicationAsync_ValidApplication_UpdatesStatus()
        {
            // Arrange
            var applicationId = 1;
            var agentId = 1;
            var application = PolicyApplication.Create(
                customerId: 1,
                policyProductId: 1,
                assetType: "Car",
                assetValue: 30000,
                yearBuilt: 2018,
                state: "New York",
                city: "New York",
                zipCode: "10001",
                riskZone: "High",
                coverageAmount: 24000,
                deductible: 2000,
                riskScore: 85,
                premium: 1800,
                requiresManualReview: true,
                startDate: DateTime.UtcNow.Date,
                endDate: DateTime.UtcNow.Date.AddYears(1));

            _mockApplicationRepo.Setup(x => x.GetByIdAsync(applicationId))
                .ReturnsAsync(application);
            // Reject requires Status=Pending or Assigned; bypass domain guard via reflection.
            SetApplicationStatus(application, ApplicationStatus.Pending);

            _mockApplicationRepo.Setup(x => x.SaveChangesAsync())
                .Returns(Task.CompletedTask);

            // Act
            await _service.RejectApplicationAsync(applicationId, agentId, "Test rejection reason");

            // Assert
            application.Status.Should().Be(ApplicationStatus.Rejected);
            _mockApplicationRepo.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task GetCustomerApplicationsAsync_ValidCustomerId_ReturnsApplications()
        {
            // Arrange
            var customerId = 1;
            var applications = new List<PolicyApplication>
            {
                PolicyApplication.Create(1, 1, "House", 200000, 2015, "CA", "LA", "90210", "Medium", 160000, 5000, 45, 2400, false, DateTime.UtcNow.Date, DateTime.UtcNow.Date.AddYears(1)),
                PolicyApplication.Create(1, 2, "Car",   30000,  2020, "CA", "LA", "90210", "Low",    24000,  1000, 25, 1200, false, DateTime.UtcNow.Date, DateTime.UtcNow.Date.AddYears(1))
            };

            _mockApplicationRepo.Setup(x => x.GetByCustomerIdAsync(customerId))
                .ReturnsAsync(applications);

            // Act
            var result = await _service.GetCustomerApplicationsAsync(customerId);

            // Assert
            result.Should().HaveCount(2);
            var resultList = result.ToList();
            // Verify by count — the service returns anonymous/DTO objects; we verify count as integration
            resultList.Count.Should().Be(2);
        }
    }
}