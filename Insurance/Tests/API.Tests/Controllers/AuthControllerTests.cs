using API.Controllers;
using Application.DTOs.Auth;
using Application.Services;
using FluentAssertions;
using Insurance.Application.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace API.Tests.Controllers
{
    public class AuthControllerTests
    {
        private readonly Mock<AuthService> _mockAuthService;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            _mockAuthService = new Mock<AuthService>(null, null, null);
            _controller = new AuthController(_mockAuthService.Object);
        }

        [Fact]
        public async Task Register_WithValidRequest_ShouldReturnOkWithAuthResponse()
        {
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Email = "test@example.com",
                Password = "Test@123",
                FullName = "John Doe"
            };

            var authResponse = new AuthResponse
            {
                Token = "jwt-token",
                Email = registerRequest.Email,
                Role = "Customer",
                FirstName = "John",
                LastName = "Doe"
            };

            _mockAuthService.Setup(x => x.Register(registerRequest))
                .ReturnsAsync(authResponse);

            // Act
            var result = await _controller.Register(registerRequest);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<AuthResponse>().Subject;
            response.Token.Should().Be("jwt-token");
            response.Email.Should().Be("test@example.com");
            response.Role.Should().Be("Customer");
        }

        [Fact]
        public async Task Register_WithExistingEmail_ShouldThrowConflictException()
        {
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Email = "existing@example.com",
                Password = "Test@123",
                FullName = "John Doe"
            };

            _mockAuthService.Setup(x => x.Register(registerRequest))
                .ThrowsAsync(new ConflictException("User with this email already exists"));

            // Act
            Func<Task> act = async () => await _controller.Register(registerRequest);

            // Assert
            await act.Should().ThrowAsync<ConflictException>()
                .WithMessage("*already exists*");
        }

        [Fact]
        public async Task Login_WithValidCredentials_ShouldReturnOkWithAuthResponse()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "Test@123"
            };

            var authResponse = new AuthResponse
            {
                Token = "jwt-token",
                Email = loginRequest.Email,
                Role = "Customer",
                FirstName = "John",
                LastName = "Doe"
            };

            _mockAuthService.Setup(x => x.Login(loginRequest))
                .ReturnsAsync(authResponse);

            // Act
            var result = await _controller.Login(loginRequest);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<AuthResponse>().Subject;
            response.Token.Should().Be("jwt-token");
            response.Email.Should().Be("test@example.com");
        }

        [Fact]
        public async Task Login_WithInvalidCredentials_ShouldThrowUnauthorizedException()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "WrongPassword"
            };

            _mockAuthService.Setup(x => x.Login(loginRequest))
                .ThrowsAsync(new UnauthorizedException("Invalid credentials"));

            // Act
            Func<Task> act = async () => await _controller.Login(loginRequest);

            // Assert
            await act.Should().ThrowAsync<UnauthorizedException>()
                .WithMessage("*Invalid credentials*");
        }

        [Theory]
        [InlineData("user1@example.com", "Password1")]
        [InlineData("user2@example.com", "Password2")]
        [InlineData("user3@example.com", "Password3")]
        public async Task Login_WithDifferentCredentials_ShouldCallServiceWithCorrectParameters(string email, string password)
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = email,
                Password = password
            };

            var authResponse = new AuthResponse
            {
                Token = "jwt-token",
                Email = email,
                Role = "Customer"
            };

            _mockAuthService.Setup(x => x.Login(It.Is<LoginRequest>(r => r.Email == email && r.Password == password)))
                .ReturnsAsync(authResponse);

            // Act
            var result = await _controller.Login(loginRequest);

            // Assert
            _mockAuthService.Verify(x => x.Login(It.Is<LoginRequest>(r => r.Email == email && r.Password == password)), Times.Once);
        }
    }
}
