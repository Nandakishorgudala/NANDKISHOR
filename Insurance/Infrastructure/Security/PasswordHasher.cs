using BCrypt.Net;
using Insurance.Application.Interfaces;

namespace Insurance.Infrastructure.Security
{
    /// <summary>
    /// BCrypt implementation of password hashing service.
    /// </summary>
    public class PasswordHasher : IPasswordHasher
    {
        public string Hash(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        public bool Verify(string password, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
    }
}