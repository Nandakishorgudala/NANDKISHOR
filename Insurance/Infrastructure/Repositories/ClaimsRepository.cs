using Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Domain.Enums;
using Insurance.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class ClaimsRepository : IClaimsRepository
    {
        private readonly InsuranceDbContext _context;

        public ClaimsRepository(InsuranceDbContext context)
        {
            _context = context;
        }

        public async Task<Claims> GetByIdAsync(int id)
        {
            return await _context.Set<Claims>()
                .Include(c => c.Policy)
                .Include(c => c.ClaimsOfficer)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<IEnumerable<Claims>> GetByPolicyIdAsync(int policyId)
        {
            return await _context.Set<Claims>()
                .Include(c => c.Policy)
                .Include(c => c.ClaimsOfficer)
                .Where(c => c.PolicyId == policyId)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Claims>> GetByClaimsOfficerIdAsync(int officerId)
        {
            return await _context.Set<Claims>()
                .Include(c => c.Policy)
                .Include(c => c.ClaimsOfficer)
                .Where(c => c.ClaimsOfficerId == officerId)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Claims>> GetAllAsync()
        {
            return await _context.Set<Claims>()
                .Include(c => c.Policy)
                .Include(c => c.ClaimsOfficer)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Claims>> GetPendingClaimsAsync()
        {
            return await _context.Set<Claims>()
                .Include(c => c.Policy)
                .Where(c => c.Status == ClaimStatus.Submitted || c.Status == ClaimStatus.UnderReview)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task AddAsync(Claims claim)
        {
            await _context.Set<Claims>().AddAsync(claim);
        }

        public async Task UpdateAsync(Claims claim)
        {
            _context.Set<Claims>().Update(claim);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
