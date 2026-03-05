using Insurance.Domain.Entities;

namespace Application.Interfaces
{
    public interface IClaimsOfficerRepository
    {
        Task<ClaimsOfficer> GetByIdAsync(int id);
        Task<ClaimsOfficer> GetByUserIdAsync(int userId);
        Task<IEnumerable<ClaimsOfficer>> GetAllActiveAsync();
        Task<IEnumerable<ClaimsOfficer>> GetAllWithDetailsAsync();
        Task AddAsync(ClaimsOfficer officer);
        Task<int> GetTotalCountAsync();
        Task SaveChangesAsync();
    }
}
