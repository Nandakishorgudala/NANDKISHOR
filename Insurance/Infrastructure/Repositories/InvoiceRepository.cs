using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Domain.Enums;
using Insurance.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class InvoiceRepository : IInvoiceRepository
    {
        private readonly InsuranceDbContext _context;

        public InvoiceRepository(InsuranceDbContext context)
        {
            _context = context;
        }

        public async Task<Invoice> GetByIdAsync(int id)
        {
            return await _context.Invoices
                .Include(i => i.Customer)
                .ThenInclude(c => c.User)
                .FirstOrDefaultAsync(i => i.Id == id);
        }

        public async Task<Invoice> GetByInvoiceNumberAsync(string invoiceNumber)
        {
            return await _context.Invoices
                .FirstOrDefaultAsync(i => i.InvoiceNumber == invoiceNumber);
        }

        public async Task<IEnumerable<Invoice>> GetByCustomerIdAsync(int customerId)
        {
            return await _context.Invoices
                .Where(i => i.CustomerId == customerId)
                .OrderByDescending(i => i.GeneratedAt)
                .ToListAsync();
        }

        public async Task<Invoice> GetByRelatedIdAsync(InvoiceType type, int relatedId)
        {
            return await _context.Invoices
                .FirstOrDefaultAsync(i => i.RelatedType == type && i.RelatedId == relatedId);
        }

        public async Task AddAsync(Invoice invoice)
        {
            await _context.Invoices.AddAsync(invoice);
        }

        public async Task UpdateAsync(Invoice invoice)
        {
            _context.Invoices.Update(invoice);
            await Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<int> GetCountForYearAsync(int year)
        {
            return await _context.Invoices
                .CountAsync(i => i.GeneratedAt.Year == year);
        }
    }
}
