using Application.DTOs.Auth;
using Application.Interfaces;
using Application.Services;
using Insurance.Domain.Entities;
using FluentAssertions;
using Insurance.Application.Exceptions;
using Moq;
using Xunit;

namespace Application.Tests.Services
{
    public class AuthServiceTests
    {
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly Mock<IPasswordHasher> _mockPasswordHasher;
        private readonly Mock<IJwtTokenGenerator> _mockJwtTokenGenerator;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            _mockUserRepository = new Mock<IUserRepository>();
            _mockPasswordHasher = new Mock<IPasswordHasher>();
            _mockJwtTokenGenerator = new Mock<IJwtTokenGenerator>();
            _authService = new AuthService(
                _mockUserRepository.Object,
                _mockPasswordHasher.Object,
                _mockJwtTokenGenerator.Object
            );
        }

        [Fact]
        public async Task Register_WithValidData_ShouldCreateUserAndReturnAuthResponse()
        {
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Email = "test@example.com",
                Password = "Test@123",
                FullName = "John Doe"
            };

            _mockUserRepository.Setup(x => x.GetByEmailAsync(registerRequest.Email))
                .ReturnsAsync((User)null);
            _mockPasswordHasher.Setup(x => x.HashPassword(registerRequest.Password))
                .Returns("hashedpassword");
            _mockJwtTokenGenerator.Setup(x => x.GenerateToken(It.IsAny<User>()))
                .Returns("jwt-token");

            // Act
            var result = await _authService.Register(registerRequest);

            // Assert
            result.Should().NotBeNull();
            result.Token.Should().Be("jwt-token");
            result.Email.Should().Be(registerRequest.Email);
            result.Role.Should().Be("Customer");
            _mockUserRepository.Verify(x => x.AddAsync(It.IsAny<User>()), Times.Once);
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

            var existingUser = new User { Email = registerRequest.Email };
            _mockUserRepository.Setup(x => x.GetByEmailAsync(registerRequest.Email))
                .ReturnsAsync(existingUser);

            // Act
            Func<Task> act = async () => await _authService.Register(registerRequest);

            // Assert
            await act.Should().ThrowAsync<ConflictException>()
                .WithMessage("*already exists*");
        }

        [Fact]
        public async Task Login_WithValidCredentials_ShouldReturnAuthResponse()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "Test@123"
            };

            var user = new User
            {
                UserId = 1,
                Email = loginRequest.Email,
                PasswordHash = "hashedpassword",
                Role = "Customer",
                FirstName = "John",
                LastName = "Doe"
            };

            _mockUserRepository.Setup(x => x.GetByEmailAsync(loginRequest.Email))
                .ReturnsAsync(user);
            _mockPasswordHasher.Setup(x => x.VerifyPassword(loginRequest.Password, user.PasswordHash))
                .Returns(true);
            _mockJwtTokenGenerator.Setup(x => x.GenerateToken(user))
                .Returns("jwt-token");

            // Act
            var result = await _authService.Login(loginRequest);

            // Assert
            result.Should().NotBeNull();
            result.Token.Should().Be("jwt-token");
            result.Email.Should().Be(loginRequest.Email);
            result.Role.Should().Be("Customer");
        }

        [Fact]
        public async Task Login_WithInvalidEmail_ShouldThrowUnauthorizedException()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "nonexistent@example.com",
                Password = "Test@123"
            };

            _mockUserRepository.Setup(x => x.GetByEmailAsync(loginRequest.Email))
                .ReturnsAsync((User)null);

            // Act
            Func<Task> act = async () => await _authService.Login(loginRequest);

            // Assert
            await act.Should().ThrowAsync<UnauthorizedException>()
                .WithMessage("*Invalid credentials*");
        }

        [Fact]
        public async Task Login_WithInvalidPassword_ShouldThrowUnauthorizedException()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "WrongPassword"
            };

            var user = new User
            {
                Email = loginRequest.Email,
                PasswordHash = "hashedpassword"
            };

            _mockUserRepository.Setup(x => x.GetByEmailAsync(loginRequest.Email))
                .ReturnsAsync(user);
            _mockPasswordHasher.Setup(x => x.VerifyPassword(loginRequest.Password, user.PasswordHash))
                .Returns(false);

            // Act
            Func<Task> act = async () => await _authService.Login(loginRequest);

            // Assert
            await act.Should().ThrowAsync<UnauthorizedException>()
                .WithMessage("*Invalid credentials*");
        }

        [Theory]
        [InlineData("test1@example.com", "Password1")]
        [InlineData("test2@example.com", "Password2")]
        [InlineData("test3@example.com", "Password3")]
        public async Task Register_WithDifferentEmails_ShouldCreateDifferentUsers(string email, string password)
        {
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Email = email,
                Password = password,
                FullName = "Test User"
            };

            _mockUserRepository.Setup(x => x.GetByEmailAsync(email))
                .ReturnsAsync((User)null);
            _mockPasswordHasher.Setup(x => x.HashPassword(password))
                .Returns($"hashed-{password}");
            _mockJwtTokenGenerator.Setup(x => x.GenerateToken(It.IsAny<User>()))
                .Returns("jwt-token");

            // Act
            var result = await _authService.Register(registerRequest);

            // Assert
            result.Email.Should().Be(email);
            _mockPasswordHasher.Verify(x => x.HashPassword(password), Times.Once);
        }
    }
}
