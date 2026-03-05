using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Insurance.Domain.Entities;

namespace Insurance.Application.Interfaces
{
    public interface IPolicyApplicationRepository
    {
        Task<PolicyApplication?> GetByIdAsync(int id);
        Task<IEnumerable<PolicyApplication>> GetByAgentIdAsync(int agentId);
        Task<IEnumerable<PolicyApplication>> GetByCustomerIdAsync(int customerId);
        Task<IEnumerable<PolicyApplication>> GetPendingApplicationsAsync();
        Task<IEnumerable<PolicyApplication>> GetAllAsync();
        Task<IEnumerable<PolicyApplication>> GetAllWithDetailsAsync();
        Task AddAsync(PolicyApplication application);
        Task UpdateAsync(PolicyApplication application);
        Task<int> CountByAgentIdAsync(int agentId);
        Task SaveChangesAsync();
    }
}
