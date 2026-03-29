using Insurance.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface ICommissionRepository
    {
        Task<IEnumerable<Commission>> GetByAgentIdAsync(int agentId);
        Task<IEnumerable<Commission>> GetAllAsync();
        Task AddAsync(Commission commission);
        Task SaveChangesAsync();
    }
}
