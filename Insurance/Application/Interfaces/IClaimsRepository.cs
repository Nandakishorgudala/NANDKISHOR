using Insurance.Domain.Entities;

namespace Application.Interfaces
{
    public interface IClaimsRepository
    {
        Task<Claims> GetByIdAsync(int id);
        Task<IEnumerable<Claims>> GetByPolicyIdAsync(int policyId);
        Task<IEnumerable<Claims>> GetByClaimsOfficerIdAsync(int officerId);
        Task<IEnumerable<Claims>> GetAllAsync();
        Task<IEnumerable<Claims>> GetPendingClaimsAsync();
        Task AddAsync(Claims claim);
        Task UpdateAsync(Claims claim);
        Task SaveChangesAsync();
    }
}
