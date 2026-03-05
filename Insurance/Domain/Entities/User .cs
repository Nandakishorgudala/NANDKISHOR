using Insurance.Domain.Common;
using Insurance.Domain.Enums;

namespace Insurance.Domain.Entities
{
    /// <summary>
    /// Represents a system user.
    /// </summary>
    public class User : BaseEntity
    {
        public string FullName { get; private set; }
        public string Email { get; private set; }
        public string PasswordHash { get; private set; }
        public Role Role { get; private set; }
        public bool IsActive { get; private set; }

        private User() { } // Required for EF Core

        public User(string fullName, string email, string passwordHash, Role role)
        {
            if (string.IsNullOrWhiteSpace(fullName))
                throw new ArgumentException("Full name cannot be empty.");

            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException("Email cannot be empty.");

            if (string.IsNullOrWhiteSpace(passwordHash))
                throw new ArgumentException("Password cannot be empty.");

            FullName = fullName;
            Email = email;
            PasswordHash = passwordHash;
            Role = role;
            IsActive = true;

            SetCreationTime();
        }

        public void Deactivate()
        {
            IsActive = false;
            SetUpdatedTime();
        }

        public void UpdatePassword(string newPasswordHash)
        {
            if (string.IsNullOrWhiteSpace(newPasswordHash))
                throw new ArgumentException("Password hash cannot be empty.");

            PasswordHash = newPasswordHash;
            SetUpdatedTime();
        }
    }
}