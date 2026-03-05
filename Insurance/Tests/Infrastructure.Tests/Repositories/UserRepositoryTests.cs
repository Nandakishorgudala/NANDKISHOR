using Insurance.Domain.Entities;
using FluentAssertions;
using Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Infrastructure.Tests.Repositories
{
    public class UserRepositoryTests : IDisposable
    {
        private readonly InsuranceDbContext _context;
        private readonly UserRepository _repository;

        public UserRepositoryTests()
        {
            var options = new DbContextOptionsBuilder<InsuranceDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new InsuranceDbContext(options);
            _repository = new UserRepository(_context);
        }

        [Fact]
        public async Task AddAsync_WithValidUser_ShouldAddUserToDatabase()
        {
            // Arrange
            var user = new User
            {
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                Role = "Customer",
                FirstName = "John",
                LastName = "Doe"
            };

            // Act
            await _repository.AddAsync(user);
            var result = await _context.Users.FirstOrDefaultAsync(u => u.Email == user.Email);

            // Assert
            result.Should().NotBeNull();
            result.Email.Should().Be("test@example.com");
            result.FirstName.Should().Be("John");
            result.LastName.Should().Be("Doe");
        }

        [Fact]
        public async Task GetByEmailAsync_WithExistingEmail_ShouldReturnUser()
        {
            // Arrange
            var user = new User
            {
                Email = "existing@example.com",
                PasswordHash = "hashedpassword",
                Role = "Customer",
                FirstName = "Jane",
                LastName = "Smith"
            };
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByEmailAsync("existing@example.com");

            // Assert
            result.Should().NotBeNull();
            result.Email.Should().Be("existing@example.com");
            result.FirstName.Should().Be("Jane");
        }

        [Fact]
        public async Task GetByEmailAsync_WithNonExistingEmail_ShouldReturnNull()
        {
            // Act
            var result = await _repository.GetByEmailAsync("nonexistent@example.com");

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetByIdAsync_WithExistingId_ShouldReturnUser()
        {
            // Arrange
            var user = new User
            {
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                Role = "Agent",
                FirstName = "Bob",
                LastName = "Johnson"
            };
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByIdAsync(user.UserId);

            // Assert
            result.Should().NotBeNull();
            result.UserId.Should().Be(user.UserId);
            result.Email.Should().Be("test@example.com");
        }

        [Fact]
        public async Task GetByIdAsync_WithNonExistingId_ShouldReturnNull()
        {
            // Act
            var result = await _repository.GetByIdAsync(999);

            // Assert
            result.Should().BeNull();
        }

        [Theory]
        [InlineData("Admin")]
        [InlineData("Customer")]
        [InlineData("Agent")]
        [InlineData("ClaimsOfficer")]
        public async Task AddAsync_WithDifferentRoles_ShouldAddUsersCorrectly(string role)
        {
            // Arrange
            var user = new User
            {
                Email = $"{role.ToLower()}@example.com",
                PasswordHash = "hashedpassword",
                Role = role,
                FirstName = "Test",
                LastName = "User"
            };

            // Act
            await _repository.AddAsync(user);
            var result = await _context.Users.FirstOrDefaultAsync(u => u.Email == user.Email);

            // Assert
            result.Should().NotBeNull();
            result.Role.Should().Be(role);
        }

        [Fact]
        public async Task AddAsync_MultipleUsers_ShouldAddAllUsers()
        {
            // Arrange
            var users = new List<User>
            {
                new User { Email = "user1@example.com", PasswordHash = "hash1", Role = "Customer", FirstName = "User", LastName = "One" },
                new User { Email = "user2@example.com", PasswordHash = "hash2", Role = "Agent", FirstName = "User", LastName = "Two" },
                new User { Email = "user3@example.com", PasswordHash = "hash3", Role = "ClaimsOfficer", FirstName = "User", LastName = "Three" }
            };

            // Act
            foreach (var user in users)
            {
                await _repository.AddAsync(user);
            }
            var count = await _context.Users.CountAsync();

            // Assert
            count.Should().Be(3);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}
