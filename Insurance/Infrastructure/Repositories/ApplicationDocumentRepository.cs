using Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Insurance.Infrastructure.Repositories
{
    public class ApplicationDocumentRepository : IApplicationDocumentRepository
    {
        private readonly InsuranceDbContext _context;

        public ApplicationDocumentRepository(InsuranceDbContext context)
        {
            _context = context;
        }

        public async Task<ApplicationDocument?> GetByIdAsync(int id)
        {
            return await _context.ApplicationDocuments.FirstOrDefaultAsync(d => d.Id == id);
        }

        public async Task<ApplicationDocument?> GetByApplicationIdAsync(int policyApplicationId)
        {
            return await _context.ApplicationDocuments
                .FirstOrDefaultAsync(d => d.PolicyApplicationId == policyApplicationId);
        }

        public async Task<IEnumerable<ApplicationDocument>> GetByApplicationIdsAsync(IEnumerable<int> applicationIds)
        {
            var ids = applicationIds.Cast<int?>().ToList();
            return await _context.ApplicationDocuments
                .Where(d => ids.Contains(d.PolicyApplicationId))
                .ToListAsync();
        }
    }
}
