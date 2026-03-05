using Insurance.Domain.Entities;
using Insurance.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace Domain.Tests.Entities
{
    public class UserTests
    {
        [Fact]
        public void Constructor_WithValidParameters_ShouldCreateUser()
        {
            // Arrange & Act
            var user = new User("John Doe", "test@example.com", "hashedpassword", Role.Customer);

            // Assert
            user.Email.Should().Be("test@example.com");
            user.PasswordHash.Should().Be("hashedpassword");
            user.Role.Should().Be(Role.Customer);
            user.FullName.Should().Be("John Doe");
            user.IsActive.Should().BeTrue();
            user.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        }

        [Theory]
        [InlineData(Role.Admin)]
        [InlineData(Role.Customer)]
        [InlineData(Role.Agent)]
        [InlineData(Role.ClaimsOfficer)]
        public void Constructor_WithDifferentRoles_ShouldSetCorrectly(Role role)
        {
            // Arrange & Act
            var user = new User("Test User", "test@example.com", "hashedpassword", role);

            // Assert
            user.Role.Should().Be(role);
        }

        [Fact]
        public void Constructor_WithEmptyFullName_ShouldThrowArgumentException()
        {
            // Arrange & Act
            Action act = () => new User("", "test@example.com", "hashedpassword", Role.Customer);

            // Assert
            act.Should().Throw<ArgumentException>()
                .WithMessage("Full name cannot be empty.");
        }

        [Fact]
        public void Constructor_WithEmptyEmail_ShouldThrowArgumentException()
        {
            // Arrange & Act
            Action act = () => new User("John Doe", "", "hashedpassword", Role.Customer);

            // Assert
            act.Should().Throw<ArgumentException>()
                .WithMessage("Email cannot be empty.");
        }

        [Fact]
        public void Constructor_WithEmptyPassword_ShouldThrowArgumentException()
        {
            // Arrange & Act
            Action act = () => new User("John Doe", "test@example.com", "", Role.Customer);

            // Assert
            act.Should().Throw<ArgumentException>()
                .WithMessage("Password cannot be empty.");
        }

        [Fact]
        public void Deactivate_ShouldSetIsActiveToFalse()
        {
            // Arrange
            var user = new User("John Doe", "test@example.com", "hashedpassword", Role.Customer);

            // Act
            user.Deactivate();

            // Assert
            user.IsActive.Should().BeFalse();
            user.UpdatedAt.Should().NotBeNull();
            user.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        }

        [Theory]
        [InlineData("admin@test.com", "Admin User", Role.Admin)]
        [InlineData("agent@test.com", "Agent User", Role.Agent)]
        [InlineData("customer@test.com", "Customer User", Role.Customer)]
        public void Constructor_WithDifferentUsers_ShouldCreateCorrectly(string email, string fullName, Role role)
        {
            // Arrange & Act
            var user = new User(fullName, email, "hashedpassword", role);

            // Assert
            user.Email.Should().Be(email);
            user.FullName.Should().Be(fullName);
            user.Role.Should().Be(role);
            user.IsActive.Should().BeTrue();
        }
    }
}
