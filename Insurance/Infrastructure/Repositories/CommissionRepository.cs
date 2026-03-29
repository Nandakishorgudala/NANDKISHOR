using Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Repositories
{
    public class CommissionRepository : ICommissionRepository
    {
        private readonly InsuranceDbContext _context;

        public CommissionRepository(InsuranceDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Commission>> GetByAgentIdAsync(int agentId)
        {
            return await _context.Commissions
                .Where(c => c.AgentId == agentId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Commission>> GetAllAsync()
        {
            return await _context.Commissions.ToListAsync();
        }

        public async Task AddAsync(Commission commission)
        {
            await _context.Commissions.AddAsync(commission);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
