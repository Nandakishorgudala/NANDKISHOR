using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Insurance.Domain.Entities;


namespace Application.Interfaces
{
    public interface IPolicyProductRepository
    {
        Task AddAsync(PolicyProduct product);
        Task<PolicyProduct?> GetByIdAsync(int id);
        Task<List<PolicyProduct>> GetAllAsync();
        Task<List<PolicyProduct>> GetActiveAsync();
        Task SaveChangesAsync();
    }

}
