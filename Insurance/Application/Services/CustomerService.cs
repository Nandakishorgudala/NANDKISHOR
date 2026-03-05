using Application.DTOs.Customer;
using Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Application.Interfaces;

namespace Application.Services
{
    public class CustomerService : ICustomerService
    {
        private readonly ICustomerRepository _customerRepository;
        private readonly IUserRepository _userRepository;

        public CustomerService(ICustomerRepository customerRepository, IUserRepository userRepository)
        {
            _customerRepository = customerRepository;
            _userRepository = userRepository;
        }

        public async Task<CustomerResponse> CreateCustomerProfileAsync(int userId, CustomerProfileDto dto)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("User not found.");

            var existingCustomer = await _customerRepository.GetByUserIdAsync(userId);
            if (existingCustomer != null)
                throw new InvalidOperationException("Customer profile already exists.");

            var customer = new Customer(
                userId,
                dto.Age,
                dto.PhoneNumber,
                dto.Address,
                dto.City,
                dto.State,
                dto.ZipCode
            );

            await _customerRepository.AddAsync(customer);
            await _customerRepository.SaveChangesAsync();

            return new CustomerResponse
            {
                Id = customer.Id,
                UserId = customer.UserId,
                FullName = user.FullName,
                Email = user.Email,
                Age = customer.Age,
                PhoneNumber = customer.PhoneNumber,
                Address = customer.Address,
                City = customer.City,
                State = customer.State,
                ZipCode = customer.ZipCode,
                IsActive = customer.IsActive
            };
        }

        public async Task<CustomerResponse> GetCustomerByUserIdAsync(int userId)
        {
            var customer = await _customerRepository.GetByUserIdAsync(userId);
            if (customer == null)
                throw new InvalidOperationException("Customer profile not found.");

            var user = await _userRepository.GetByIdAsync(userId);

            return new CustomerResponse
            {
                Id = customer.Id,
                UserId = customer.UserId,
                FullName = user?.FullName,
                Email = user?.Email,
                Age = customer.Age,
                PhoneNumber = customer.PhoneNumber,
                Address = customer.Address,
                City = customer.City,
                State = customer.State,
                ZipCode = customer.ZipCode,
                IsActive = customer.IsActive
            };
        }

        public async Task<CustomerResponse> UpdateCustomerProfileAsync(int userId, CustomerProfileDto dto)
        {
            var customer = await _customerRepository.GetByUserIdAsync(userId);
            if (customer == null)
                throw new InvalidOperationException("Customer profile not found.");

            customer.UpdateProfile(
                dto.Age,
                dto.PhoneNumber,
                dto.Address,
                dto.City,
                dto.State,
                dto.ZipCode
            );

            await _customerRepository.UpdateAsync(customer);
            await _customerRepository.SaveChangesAsync();

            var user = await _userRepository.GetByIdAsync(userId);

            return new CustomerResponse
            {
                Id = customer.Id,
                UserId = customer.UserId,
                FullName = user?.FullName,
                Email = user?.Email,
                Age = customer.Age,
                PhoneNumber = customer.PhoneNumber,
                Address = customer.Address,
                City = customer.City,
                State = customer.State,
                ZipCode = customer.ZipCode,
                IsActive = customer.IsActive
            };
        }

        public async Task<IEnumerable<CustomerResponse>> GetAllCustomersAsync()
        {
            var customers = await _customerRepository.GetAllAsync();
            var responses = new List<CustomerResponse>();

            foreach (var customer in customers)
            {
                var user = await _userRepository.GetByIdAsync(customer.UserId);
                responses.Add(new CustomerResponse
                {
                    Id = customer.Id,
                    UserId = customer.UserId,
                    FullName = user?.FullName,
                    Email = user?.Email,
                    Age = customer.Age,
                    PhoneNumber = customer.PhoneNumber,
                    Address = customer.Address,
                    City = customer.City,
                    State = customer.State,
                    ZipCode = customer.ZipCode,
                    IsActive = customer.IsActive
                });
            }

            return responses;
        }

        public async Task<int> GetTotalCustomersCountAsync()
        {
            return await _customerRepository.GetTotalCountAsync();
        }
    }
}
