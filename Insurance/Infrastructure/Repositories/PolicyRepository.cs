using Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class PolicyRepository : IPolicyRepository
    {
        private readonly InsuranceDbContext _context;

        public PolicyRepository(InsuranceDbContext context)
        {
            _context = context;
        }

        public async Task<Policy> GetByIdAsync(int id)
        {
            return await _context.Set<Policy>()
                .Include(p => p.Customer)
                .Include(p => p.Application)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<Policy> GetByApplicationIdAsync(int applicationId)
        {
            return await _context.Set<Policy>()
                .Include(p => p.Customer)
                .Include(p => p.Application)
                .FirstOrDefaultAsync(p => p.ApplicationId == applicationId);
        }

        public async Task<IEnumerable<Policy>> GetByCustomerIdAsync(int customerId)
        {
            return await _context.Set<Policy>()
                .Include(p => p.Customer)
                .Include(p => p.Application)
                .Where(p => p.CustomerId == customerId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Policy>> GetByAgentIdAsync(int agentId)
        {
            return await _context.Set<Policy>()
                .Include(p => p.Customer)
                    .ThenInclude(c => c.User)
                .Include(p => p.Application)
                .Include(p => p.Claims)
                .Where(p => p.Application.AgentId == agentId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Policy>> GetAllAsync()
        {
            return await _context.Set<Policy>()
                .Include(p => p.Customer)
                .Include(p => p.Application)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Policy>> GetAllWithDetailsAsync()
        {
            return await _context.Set<Policy>()
                .Include(p => p.Customer)
                    .ThenInclude(c => c.User)
                .Include(p => p.Application)
                    .ThenInclude(a => a.Agent)
                        .ThenInclude(ag => ag.User)
                .Include(p => p.Claims)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task AddAsync(Policy policy)
        {
            await _context.Set<Policy>().AddAsync(policy);
        }

        public async Task UpdateAsync(Policy policy)
        {
            _context.Set<Policy>().Update(policy);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
