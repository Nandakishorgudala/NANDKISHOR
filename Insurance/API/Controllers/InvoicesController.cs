using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Insurance.Domain.Enums;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class InvoicesController : ControllerBase
    {
        private readonly IInvoiceService _invoiceService;
        private readonly ICustomerRepository _customerRepository;
        private readonly ILogger<InvoicesController> _logger;

        public InvoicesController(IInvoiceService invoiceService, ICustomerRepository customerRepository, ILogger<InvoicesController> logger)
        {
            _invoiceService = invoiceService;
            _customerRepository = customerRepository;
            _logger = logger;
        }

        [HttpGet("{customerId}/customer")]
        public async Task<IActionResult> GetCustomerInvoices(int customerId)
        {
            // Optional: Verify if the current user is an Admin or the Customer themselves
            var invoices = await _invoiceService.GetCustomerInvoicesAsync(customerId);
            return Ok(invoices);
        }

        [HttpGet("{invoiceId}")]
        public async Task<IActionResult> GetInvoiceById(int invoiceId)
        {
            var invoice = await _invoiceService.GetInvoiceByIdAsync(invoiceId);
            if (invoice == null) return NotFound();
            return Ok(invoice);
        }

        [HttpGet("{invoiceId}/pdf")]
        public async Task<IActionResult> DownloadPdf(int invoiceId)
        {
            try
            {
                _logger.LogInformation("Downloading PDF for invoice {InvoiceId}", invoiceId);
                var (content, contentType, fileName) = await _invoiceService.GetInvoicePdfAsync(invoiceId);
                return File(content, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading PDF for invoice {InvoiceId}", invoiceId);
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("related/{type}/{relatedId}")]
        public async Task<IActionResult> GetByRelatedId(string type, int relatedId)
        {
            if (!Enum.TryParse<InvoiceType>(type, true, out var invoiceType))
                return BadRequest("Invalid invoice type");

            var invoice = await _invoiceService.GetInvoiceByRelatedIdAsync(invoiceType, relatedId);
            if (invoice == null) return NotFound();
            return Ok(invoice);
        }

        [HttpGet("{invoiceId}/view")]
        public async Task<IActionResult> ViewPdf(int invoiceId)
        {
            try
            {
                _logger.LogInformation("Viewing PDF for invoice {InvoiceId}", invoiceId);
                var (content, contentType, fileName) = await _invoiceService.GetInvoicePdfAsync(invoiceId);
                // Return as inline so browser treats it as a viewable PDF
                Response.Headers.Append("Content-Disposition", $"inline; filename={fileName}");
                return File(content, contentType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error viewing PDF for invoice {InvoiceId}", invoiceId);
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
