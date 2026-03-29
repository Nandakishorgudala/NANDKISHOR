using System.Collections.Generic;
using System.Threading.Tasks;
using Insurance.Domain.Entities;
using Insurance.Domain.Enums;

namespace Application.Interfaces
{
    public interface IInvoiceRepository
    {
        Task<Invoice> GetByIdAsync(int id);
        Task<Invoice> GetByInvoiceNumberAsync(string invoiceNumber);
        Task<IEnumerable<Invoice>> GetByCustomerIdAsync(int customerId);
        Task<Invoice> GetByRelatedIdAsync(InvoiceType type, int relatedId);
        Task AddAsync(Invoice invoice);
        Task UpdateAsync(Invoice invoice);
        Task SaveChangesAsync();
        Task<int> GetCountForYearAsync(int year);
    }
}
