using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Insurance.Domain.Entities;

namespace Application.Interfaces
{
    public interface IPolicyRepository
    {
        Task<Policy> GetByIdAsync(int id);
        Task<Policy> GetByApplicationIdAsync(int applicationId);
        Task<IEnumerable<Policy>> GetByCustomerIdAsync(int customerId);
        Task<IEnumerable<Policy>> GetByAgentIdAsync(int agentId);
        Task<IEnumerable<Policy>> GetAllAsync();
        Task<IEnumerable<Policy>> GetAllWithDetailsAsync();
        Task AddAsync(Policy policy);
        Task UpdateAsync(Policy policy);
        Task SaveChangesAsync();
    }
}
