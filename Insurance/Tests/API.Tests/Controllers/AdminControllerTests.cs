using API.Controllers;
using Application.Interfaces;
using Insurance.Application.DTOs.Admin;
using Insurance.Application.DTOs.Agent;
using Insurance.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace API.Tests.Controllers
{
    public class AdminControllerTests
    {
        private readonly Mock<IUserManagementService> _mockUserService;
        private readonly Mock<IPolicyApplicationRepository> _mockApplicationRepo;
        private readonly Mock<IPolicyRepository> _mockPolicyRepo;
        private readonly Mock<IAgentRepository> _mockAgentRepo;
        private readonly Mock<IClaimsOfficerRepository> _mockOfficerRepo;
        private readonly Mock<IClaimsRepository> _mockClaimsRepo;
        private readonly Mock<ICommissionRepository> _mockCommissionRepo;
        private readonly AdminController _controller;

        public AdminControllerTests()
        {
            _mockUserService = new Mock<IUserManagementService>();
            _mockApplicationRepo = new Mock<IPolicyApplicationRepository>();
            _mockPolicyRepo = new Mock<IPolicyRepository>();
            _mockAgentRepo = new Mock<IAgentRepository>();
            _mockOfficerRepo = new Mock<IClaimsOfficerRepository>();
            _mockClaimsRepo = new Mock<IClaimsRepository>();
            _mockCommissionRepo = new Mock<ICommissionRepository>();

            _controller = new AdminController(
                _mockUserService.Object,
                _mockApplicationRepo.Object,
                _mockPolicyRepo.Object,
                _mockAgentRepo.Object,
                _mockOfficerRepo.Object,
                _mockClaimsRepo.Object,
                _mockCommissionRepo.Object
            );
        }

        [Fact]
        public async Task CreateStaff_ValidAgent_ReturnsCreated()
        {
            // Arrange
            var dto = new CreateStaffDto
            {
                FullName = "Agent Jones",
                Email = "agent@example.com",
                Password = "password123",
                Role = "agent"
            };

            _mockUserService.Setup(s => s.CreateAgentAsync(It.IsAny<CreateAgentDto>()))
               .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.CreateStaff(dto);

            // Assert
            var createdResult = Assert.IsType<CreatedResult>(result);
            _mockUserService.Verify(s => s.CreateAgentAsync(It.Is<CreateAgentDto>(a => a.Email == dto.Email)), Times.Once);
        }

        [Fact]
        public async Task CreateStaff_ValidOfficer_ReturnsCreated()
        {
            // Arrange
            var dto = new CreateStaffDto
            {
                FullName = "Officer Smith",
                Email = "officer@example.com",
                Password = "password123",
                Role = "claimsOfficer"
            };

            _mockUserService.Setup(s => s.CreateClaimsOfficerAsync(It.IsAny<CreateClaimsOfficerDto>()))
               .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.CreateStaff(dto);

            // Assert
            var createdResult = Assert.IsType<CreatedResult>(result);
            _mockUserService.Verify(s => s.CreateClaimsOfficerAsync(It.Is<CreateClaimsOfficerDto>(a => a.Email == dto.Email)), Times.Once);
        }

        [Fact]
        public async Task CreateStaff_InvalidRole_ReturnsBadRequest()
        {
            // Arrange
            var dto = new CreateStaffDto
            {
                FullName = "Invalid Role",
                Email = "invalid@example.com",
                Password = "password123",
                Role = "unknownRole"
            };

            // Act
            var result = await _controller.CreateStaff(dto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Invalid role", badRequestResult.Value?.ToString() ?? "");
        }

        [Fact]
        public async Task CreateStaff_DuplicateEmail_ReturnsConflict()
        {
            // Arrange
            var dto = new CreateStaffDto
            {
                FullName = "Duplicate",
                Email = "duplicate@example.com",
                Password = "password123",
                Role = "agent"
            };

            _mockUserService.Setup(s => s.CreateAgentAsync(It.IsAny<CreateAgentDto>()))
               .ThrowsAsync(new Exception("User already exists"));

            // Act
            var result = await _controller.CreateStaff(dto);

            // Assert
            var conflictResult = Assert.IsType<ConflictObjectResult>(result);
            Assert.Contains("Email already exists", conflictResult.Value?.ToString() ?? "");
        }
    }
}
