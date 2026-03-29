using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Application.DTOs.Common;
using Insurance.Domain.Enums;

namespace Application.Interfaces
{
    public interface IInvoiceService
    {
        Task<InvoiceDto> GenerateInvoiceAsync(InvoiceType type, int relatedId);
        Task<IEnumerable<InvoiceDto>> GetCustomerInvoicesAsync(int customerId);
        Task<InvoiceDto> GetInvoiceByIdAsync(int invoiceId);
        Task<InvoiceDto> GetInvoiceByRelatedIdAsync(InvoiceType type, int relatedId);
        Task<(byte[] Content, string ContentType, string FileName)> GetInvoicePdfAsync(int invoiceId);
    }
}
