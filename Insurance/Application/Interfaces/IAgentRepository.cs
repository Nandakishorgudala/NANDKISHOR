using Insurance.Domain.Entities;

namespace Application.Interfaces
{
    public interface IAgentRepository
    {
        Task<Agent> GetByIdAsync(int id);
        Task<Agent> GetByUserIdAsync(int userId);
        Task<IEnumerable<Agent>> GetAllAsync();
        Task<IEnumerable<Agent>> GetAllWithDetailsAsync();
        Task<IEnumerable<Agent>> GetActiveAgentsAsync();
        Task AddAsync(Agent agent);
        Task<bool> ExistsByLicenseAsync(string licenseNumber);
        Task<int> GetTotalCountAsync();
        Task SaveChangesAsync();
    }
}
