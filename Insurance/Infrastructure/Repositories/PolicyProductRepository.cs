using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Insurance.Domain.Entities;
using Insurance.Application.Interfaces;
using Insurance.Infrastructure.Persistence;


using Microsoft.EntityFrameworkCore;
using Application.Interfaces;
 

namespace Infrastructure.Repositories
{
    public class PolicyProductRepository : IPolicyProductRepository
    {
        private readonly InsuranceDbContext _context;

        public PolicyProductRepository(InsuranceDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(PolicyProduct product)
        {
            await _context.PolicyProducts.AddAsync(product);
        }

        public async Task<PolicyProduct?> GetByIdAsync(int id)
        {
            return await _context.PolicyProducts.FindAsync(id);
        }

        public async Task<List<PolicyProduct>> GetAllAsync()
        {
            return await _context.PolicyProducts.ToListAsync();
        }

        public async Task<List<PolicyProduct>> GetActiveAsync()
        {
            return await _context.PolicyProducts
                .Where(p => p.IsActive)
                .ToListAsync();
        }

        public async Task DeleteAsync(PolicyProduct product)
        {
            _context.PolicyProducts.Remove(product);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
