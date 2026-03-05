using Insurance.Domain.Common;

namespace Insurance.Domain.Entities
{
    public class Agent : BaseEntity
    {
        public int UserId { get; private set; }
        public User User { get; private set; }
        
        public string LicenseNumber { get; private set; }
        public string Branch { get; private set; }
        public bool IsActive { get; private set; }


        public ICollection<PolicyApplication> PolicyApplications { get; private set; } = new List<PolicyApplication>();



        private Agent() { }

        public Agent(int userId, string licenseNumber, string branch)
        {
            if (string.IsNullOrWhiteSpace(licenseNumber))
                throw new ArgumentException("License number is required.");

            UserId = userId;
            LicenseNumber = licenseNumber;
            Branch = branch;
            IsActive = true;

            SetCreationTime();
        }

        public void Deactivate()
        {
            IsActive = false;
            SetUpdatedTime();
        }
    }

}
