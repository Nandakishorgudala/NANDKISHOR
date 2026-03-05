using Application.DTOs.Customer;

namespace Application.Interfaces
{
    public interface ICustomerService
    {
        Task<CustomerResponse> CreateCustomerProfileAsync(int userId, CustomerProfileDto dto);
        Task<CustomerResponse> GetCustomerByUserIdAsync(int userId);
        Task<CustomerResponse> UpdateCustomerProfileAsync(int userId, CustomerProfileDto dto);
        Task<IEnumerable<CustomerResponse>> GetAllCustomersAsync();
        Task<int> GetTotalCustomersCountAsync();
    }
}
