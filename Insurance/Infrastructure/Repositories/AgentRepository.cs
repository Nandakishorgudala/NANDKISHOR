using Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class AgentRepository : IAgentRepository
    {
        private readonly InsuranceDbContext _context;

        public AgentRepository(InsuranceDbContext context)
        {
            _context = context;
        }

        public async Task<Agent> GetByIdAsync(int id)
        {
            return await _context.Agents
                .Include(a => a.PolicyApplications)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<Agent> GetByUserIdAsync(int userId)
        {
            return await _context.Agents
                .Include(a => a.PolicyApplications)
                .FirstOrDefaultAsync(a => a.UserId == userId);
        }

        public async Task<IEnumerable<Agent>> GetAllAsync()
        {
            return await _context.Agents
                .Include(a => a.PolicyApplications)
                .ToListAsync();
        }

        public async Task<IEnumerable<Agent>> GetAllWithDetailsAsync()
        {
            return await _context.Agents
                .Include(a => a.User)
                .Include(a => a.PolicyApplications)
                .ToListAsync();
        }

        public async Task<IEnumerable<Agent>> GetActiveAgentsAsync()
        {
            return await _context.Agents
                .Where(a => a.IsActive)
                .ToListAsync();
        }

        public async Task AddAsync(Agent agent)
        {
            await _context.Agents.AddAsync(agent);
        }

        public async Task<bool> ExistsByLicenseAsync(string licenseNumber)
        {
            return await _context.Agents
                .AnyAsync(a => a.LicenseNumber == licenseNumber);
        }

        public async Task<int> GetTotalCountAsync()
        {
            return await _context.Agents.CountAsync(a => a.IsActive);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
