using Insurance.Domain.Entities;

namespace Application.Interfaces
{
    /// <summary>
    /// Repository interface for ApplicationDocument entities.
    /// </summary>
    public interface IApplicationDocumentRepository
    {
        Task<ApplicationDocument?> GetByIdAsync(int id);
        Task<ApplicationDocument?> GetByApplicationIdAsync(int policyApplicationId);
        Task<IEnumerable<ApplicationDocument>> GetByApplicationIdsAsync(IEnumerable<int> applicationIds);
    }
}
