using Insurance.Domain.Common;

namespace Insurance.Domain.Entities
{
    /// <summary>
    /// Represents a claims officer who reviews and processes insurance claims.
    /// </summary>
    public class ClaimsOfficer : BaseEntity
    {
        public int UserId { get; private set; }
        public User User { get; private set; }

        public string EmployeeId { get; private set; }
        public string Department { get; private set; }
        public bool IsActive { get; private set; }

        // Navigation properties
        public ICollection<Claims> AssignedClaims { get; private set; } = new List<Claims>();

        private ClaimsOfficer() { } // Required for EF Core

        public ClaimsOfficer(int userId, string employeeId, string department)
        {
            if (string.IsNullOrWhiteSpace(employeeId))
                throw new ArgumentException("Employee ID is required.");

            UserId = userId;
            EmployeeId = employeeId;
            Department = department ?? "Claims";
            IsActive = true;

            SetCreationTime();
        }

        public void Deactivate()
        {
            IsActive = false;
            SetUpdatedTime();
        }

        public void Activate()
        {
            IsActive = true;
            SetUpdatedTime();
        }
    }
}
