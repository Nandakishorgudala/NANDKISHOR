using Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class ClaimsOfficerRepository : IClaimsOfficerRepository
    {
        private readonly InsuranceDbContext _context;

        public ClaimsOfficerRepository(InsuranceDbContext context)
        {
            _context = context;
        }

        public async Task<ClaimsOfficer> GetByIdAsync(int id)
        {
            return await _context.Set<ClaimsOfficer>()
                .Include(co => co.User)
                .FirstOrDefaultAsync(co => co.Id == id);
        }

        public async Task<ClaimsOfficer> GetByUserIdAsync(int userId)
        {
            return await _context.Set<ClaimsOfficer>()
                .Include(co => co.User)
                .FirstOrDefaultAsync(co => co.UserId == userId);
        }

        public async Task<IEnumerable<ClaimsOfficer>> GetAllActiveAsync()
        {
            return await _context.Set<ClaimsOfficer>()
                .Include(co => co.User)
                .Where(co => co.IsActive)
                .ToListAsync();
        }

        public async Task<IEnumerable<ClaimsOfficer>> GetAllWithDetailsAsync()
        {
            return await _context.Set<ClaimsOfficer>()
                .Include(co => co.User)
                .ToListAsync();
        }

        public async Task AddAsync(ClaimsOfficer officer)
        {
            await _context.Set<ClaimsOfficer>().AddAsync(officer);
        }

        public async Task<int> GetTotalCountAsync()
        {
            return await _context.Set<ClaimsOfficer>().CountAsync(co => co.IsActive);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
