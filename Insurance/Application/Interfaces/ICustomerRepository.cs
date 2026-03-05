using Insurance.Domain.Entities;

namespace Application.Interfaces
{
    public interface ICustomerRepository
    {
        Task<Customer> GetByIdAsync(int id);
        Task<Customer> GetByUserIdAsync(int userId);
        Task<IEnumerable<Customer>> GetAllAsync();
        Task AddAsync(Customer customer);
        Task UpdateAsync(Customer customer);
        Task<int> GetTotalCountAsync();
        Task SaveChangesAsync();
    }
}
