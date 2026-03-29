using Insurance.Domain.Common;

namespace Insurance.Domain.Entities
{
    /// <summary>
    /// Represents a customer who can purchase policies and raise claims.
    /// Extends User base entity.
    /// </summary>
    public class Customer : BaseEntity
    {
        public int UserId { get; private set; }
        public User User { get; private set; }

        public int Age { get; private set; }
        public string PhoneNumber { get; private set; }
        public string Address { get; private set; }
        public string City { get; private set; }
        public string State { get; private set; }
        public string ZipCode { get; private set; }
        public bool IsActive { get; private set; }

        // Navigation properties
        public ICollection<PolicyApplication> PolicyApplications { get; private set; } = new List<PolicyApplication>();
        public ICollection<Policy> Policies { get; private set; } = new List<Policy>();

        private Customer() { } // Required for EF Core

        public Customer(int userId, int age, string phoneNumber, string address, string city, string state, string zipCode)
        {
            if (age < 18 || age > 120)
                throw new ArgumentException("Age must be between 18 and 120.");

            if (string.IsNullOrWhiteSpace(phoneNumber))
                throw new ArgumentException("Phone number is required.");

            UserId = userId;
            Age = age;
            PhoneNumber = phoneNumber;
            Address = address;
            City = city;
            State = state;
            ZipCode = zipCode;
            IsActive = true;

            SetCreationTime();
        }

        public void UpdateProfile(int age, string phoneNumber, string address, string city, string state, string zipCode)
        {
            if (age < 18 || age > 120)
                throw new ArgumentException("Age must be between 18 and 120.");

            Age = age;
            PhoneNumber = phoneNumber;
            Address = address;
            City = city;
            State = state;
            ZipCode = zipCode;

            SetUpdatedTime();
        }

        public void Deactivate()
        {
            IsActive = false;
            SetUpdatedTime();
        }
    }
}