using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Insurance.Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;



namespace Insurance.Infrastructure.Repositories
{
    public class PolicyApplicationRepository : IPolicyApplicationRepository
    {
        private readonly InsuranceDbContext _context;

        public PolicyApplicationRepository(InsuranceDbContext context)
        {
            _context = context;
        }

        public async Task<PolicyApplication?> GetByIdAsync(int id)
        {
            return await _context.PolicyApplications
                .FirstOrDefaultAsync(pa => pa.Id == id);
        }

        public async Task<PolicyApplication?> GetByIdWithDetailsAsync(int id)
        {
            return await _context.PolicyApplications
                .Include(pa => pa.Customer)
                    .ThenInclude(c => c.User)
                .Include(pa => pa.Customer)
                    .ThenInclude(c => c.Policies)
                .Include(pa => pa.Agent)
                    .ThenInclude(a => a.User)
                .Include(pa => pa.PolicyProduct)
                .Include(pa => pa.Document)
                .FirstOrDefaultAsync(pa => pa.Id == id);
        }

        public async Task<IEnumerable<PolicyApplication>> GetByAgentIdAsync(int agentId)
        {
            return await _context.PolicyApplications
                .Include(pa => pa.Customer)
                    .ThenInclude(c => c.User)
                .Include(pa => pa.PolicyProduct)
                .Where(pa => pa.AgentId == agentId)
                .OrderByDescending(pa => pa.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<PolicyApplication>> GetByCustomerIdAsync(int customerId)
        {
            return await _context.PolicyApplications
                .Include(pa => pa.PolicyProduct)
                .Where(pa => pa.CustomerId == customerId)
                .OrderByDescending(pa => pa.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<PolicyApplication>> GetPendingApplicationsAsync()
        {
            return await _context.PolicyApplications
                .Include(pa => pa.Customer)
                    .ThenInclude(c => c.User)
                .Include(pa => pa.PolicyProduct)
                .Where(pa => pa.Status == Domain.Enums.ApplicationStatus.Pending || 
                            pa.Status == Domain.Enums.ApplicationStatus.Assigned)
                .OrderBy(pa => pa.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<PolicyApplication>> GetAllAsync()
        {
            return await _context.PolicyApplications
                .OrderByDescending(pa => pa.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<PolicyApplication>> GetAllWithDetailsAsync()
        {
            return await _context.PolicyApplications
                .Include(pa => pa.Customer)
                    .ThenInclude(c => c.User)
                .Include(pa => pa.Agent)
                    .ThenInclude(a => a.User)
                .Include(pa => pa.PolicyProduct)
                .OrderByDescending(pa => pa.CreatedAt)
                .ToListAsync();
        }

        public async Task AddAsync(PolicyApplication application)
        {
            await _context.PolicyApplications.AddAsync(application);
        }

        public async Task UpdateAsync(PolicyApplication application)
        {
            _context.PolicyApplications.Update(application);
        }

        public async Task<int> CountByAgentIdAsync(int agentId)
        {
            return await _context.PolicyApplications
                .CountAsync(a => a.AgentId == agentId);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
