using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Application.DTOs.Common;
using Application.Interfaces;
using Insurance.Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Domain.Enums;
using Microsoft.AspNetCore.Hosting;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QuestPDF.Previewer;
using Microsoft.Extensions.Logging;

namespace Application.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly ICustomerRepository _customerRepository;
        private readonly IPolicyApplicationRepository _applicationRepository;
        private readonly IClaimsRepository _claimsRepository;
        private readonly IPolicyRepository _policyRepository;
        private readonly IPaymentRepository _paymentRepository;
        private readonly IAgentRepository _agentRepository;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<InvoiceService> _logger;

        public InvoiceService(
            IInvoiceRepository invoiceRepository,
            ICustomerRepository customerRepository,
            IPolicyApplicationRepository applicationRepository,
            IClaimsRepository claimsRepository,
            IPolicyRepository policyRepository,
            IPaymentRepository paymentRepository,
            IAgentRepository agentRepository,
            IWebHostEnvironment env,
            ILogger<InvoiceService> logger)
        {
            _invoiceRepository = invoiceRepository;
            _customerRepository = customerRepository;
            _applicationRepository = applicationRepository;
            _claimsRepository = claimsRepository;
            _policyRepository = policyRepository;
            _paymentRepository = paymentRepository;
            _agentRepository = agentRepository;
            _env = env;
            _logger = logger;
            
            // Set QuestPDF license
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<InvoiceDto> GenerateInvoiceAsync(InvoiceType type, int relatedId)
        {
            try
            {
                // 1. Idempotency Check
                var existing = await _invoiceRepository.GetByRelatedIdAsync(type, relatedId);
                if (existing != null)
                    return MapToDto(existing);

                // 2. Gather Data
                int customerId;
                decimal amount;
                string description;
                string customerName;
                string customerAddress;
                
                // Detailed data for enhanced PDF
                string policyNumber = "N/A";
                string policyName = "Insurance Policy";
                string agentName = "System Assigned";
                string paymentMethod = "N/A";
                string transactionId = "N/A";
                string duration = "N/A";
                DateTime purchaseDate = DateTime.UtcNow;

                if (type == InvoiceType.PolicyApplication)
                {
                    var app = await _applicationRepository.GetByIdWithDetailsAsync(relatedId);
                    if (app == null) throw new Exception("Application not found");
                    
                    var policy = await _policyRepository.GetByApplicationIdAsync(relatedId);
                    var payment = policy != null ? await _paymentRepository.GetByPolicyIdAsync(policy.Id) : null;
                    
                    customerId = app.CustomerId;
                    amount = app.CalculatedPremium;
                    description = $"Insurance Policy Premium for {app.PolicyProduct?.Name ?? "Policy Application"}";
                    customerName = app.Customer?.User?.FullName ?? "Valued Customer";
                    
                    // Fetch full billing address from customer profile if available, else fallback to asset location
                    if (app.Customer != null && !string.IsNullOrEmpty(app.Customer.Address))
                    {
                        customerAddress = $"{app.Customer.Address}, {app.Customer.City}, {app.Customer.State} {app.Customer.ZipCode}";
                    }
                    else
                    {
                        customerAddress = $"{app.City}, {app.State} {app.ZipCode}";
                    }

                    if (policy != null)
                    {
                        policyNumber = policy.PolicyNumber;
                        policyName = app.PolicyProduct?.Name ?? "Policy Application";
                        duration = $"{policy.StartDate:dd MMM yyyy} - {policy.EndDate:dd MMM yyyy}";
                        purchaseDate = policy.CreatedAt;
                    }

                    if (app.Agent != null)
                    {
                        agentName = app.Agent.User?.FullName ?? app.Agent.LicenseNumber;
                    }

                    if (payment != null)
                    {
                        paymentMethod = payment.PaymentMethod;
                        transactionId = payment.TransactionId;
                    }
                }
                else // Claim
                {
                    var claim = await _claimsRepository.GetByIdAsync(relatedId);
                    if (claim == null) throw new Exception("Claim not found");
                    
                    var policy = claim.Policy;
                    customerId = policy.CustomerId;
                    amount = claim.ApprovedAmount;
                    description = $"Claim Payout for Claim #{claim.Id} - {policy.PolicyNumber}";
                    customerName = policy.Customer?.User?.FullName ?? "Valued Customer";
                    
                    if (policy.Customer != null && !string.IsNullOrEmpty(policy.Customer.Address))
                    {
                        customerAddress = $"{policy.Customer.Address}, {policy.Customer.City}, {policy.Customer.State} {policy.Customer.ZipCode}";
                    }
                    else
                    {
                        customerAddress = "Registered Address";
                    }
                    
                    policyNumber = policy.PolicyNumber;
                    policyName = "Claim Settlement";
                }

                // 3. Generate Invoice Number
                var year = DateTime.UtcNow.Year;
                var seq = await _invoiceRepository.GetCountForYearAsync(year) + 1;
                var invoiceNumber = $"INV-{year}-{seq:D6}";

                // 4. Calculate Taxes
                decimal taxRate = 0.18m; // 18% GST
                decimal taxAmount = amount * taxRate;
                decimal totalAmount = amount + taxAmount;

                // 5. Generate PDF Path
                var fileName = $"{invoiceNumber}.pdf";
                var directoryPath = Path.Combine(_env.ContentRootPath, "Uploads", "Invoices");
                if (!Directory.Exists(directoryPath)) Directory.CreateDirectory(directoryPath);
                var filePath = Path.Combine(directoryPath, fileName);

                // 6. Create PDF Document
                var logoPath = Path.Combine(_env.ContentRootPath, "wwwroot", "images", "logo.png");
                
                var document = Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Margin(0.5f, Unit.Inch);
                        page.PageColor(Colors.White);
                        page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Verdana).FontColor(Colors.Grey.Darken3));

                        // 1. Accent Header Bar
                        page.Header().Column(column =>
                        {
                            column.Item().Row(row =>
                            {
                                row.RelativeItem().Column(brand =>
                                {
                                    if (File.Exists(logoPath))
                                        brand.Item().Height(45).Image(logoPath);
                                    else
                                        brand.Item().Text("ShieldSure").FontSize(22).SemiBold().FontColor("#7c3aed");

                                    brand.Item().Text("ShieldSure Insurance Services").FontSize(8).Italic().FontColor(Colors.Grey.Medium);
                                });

                                row.RelativeItem().AlignRight().Column(meta =>
                                {
                                    meta.Item().Text("INVOICE").FontSize(26).ExtraBold().FontColor("#7c3aed");
                                    meta.Item().Text($"#{invoiceNumber}").FontSize(11).SemiBold();
                                    meta.Item().Text($"{DateTime.UtcNow:dd MMM yyyy}").FontSize(9).FontColor(Colors.Grey.Medium);
                                });
                            });
                            
                            column.Item().PaddingTop(10).LineHorizontal(1.5f).LineColor("#7c3aed");
                        });

                        page.Content().PaddingVertical(20).Column(x =>
                        {
                            x.Spacing(20);

                            // 2. Billing & Company Info Section
                            x.Item().Row(row =>
                            {
                                row.RelativeItem().Column(bill =>
                                {
                                    bill.Item().PaddingBottom(4).Text("BILL TO").FontSize(8).SemiBold().FontColor("#7c3aed");
                                    bill.Item().Text(customerName).FontSize(12).Bold();
                                    bill.Item().PaddingTop(2).Text(customerAddress).LineHeight(1.3f).FontSize(9).FontColor(Colors.Grey.Darken2);
                                });

                                row.ConstantItem(40);

                                row.RelativeItem().Column(from =>
                                {
                                    from.Item().PaddingBottom(4).Text("FROM").FontSize(8).SemiBold().FontColor("#7c3aed");
                                    from.Item().Text("ShieldSure Insurance").FontSize(11).Bold();
                                    from.Item().PaddingTop(2).Text("Banjara Hills, Road #12\nHyderabad, TG 500034").LineHeight(1.3f).FontSize(8).FontColor(Colors.Grey.Medium);
                                    from.Item().PaddingTop(4).Text("GSTIN: 36AAAAA0000A1Z5").FontSize(7).Italic();
                                });
                            });

                            // 3. Highlighted Policy Details (If Application)
                            if (type == InvoiceType.PolicyApplication)
                            {
                                x.Item().Background("#f5f3ff").Padding(12).Border(1).BorderColor("#ddd6fe").Row(row =>
                                {
                                    row.RelativeItem().Column(c => {
                                        c.Item().Text("POLICY ID").FontSize(7).SemiBold().FontColor(Colors.Grey.Medium);
                                        c.Item().Text(policyNumber).FontSize(10).SemiBold();
                                    });
                                    row.RelativeItem().Column(c => {
                                        c.Item().Text("POLICY NAME").FontSize(7).SemiBold().FontColor(Colors.Grey.Medium);
                                        c.Item().Text(policyName).FontSize(10).SemiBold();
                                    });
                                    row.RelativeItem().Column(c => {
                                        c.Item().Text("COVERAGE PERIOD").FontSize(7).SemiBold().FontColor(Colors.Grey.Medium);
                                        c.Item().Text(duration).FontSize(9).SemiBold();
                                    });
                                    row.RelativeItem().Column(c => {
                                        c.Item().Text("HANDLED BY").FontSize(7).SemiBold().FontColor(Colors.Grey.Medium);
                                        c.Item().Text(agentName).FontSize(10).SemiBold();
                                    });
                                });
                            }

                            // 4. Modern Table
                            x.Item().Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.ConstantColumn(30);
                                    columns.RelativeColumn();
                                    columns.ConstantColumn(120);
                                });

                                table.Header(header =>
                                {
                                    header.Cell().Element(CellStyle).Text("#");
                                    header.Cell().Element(CellStyle).Text("Description");
                                    header.Cell().Element(CellStyle).AlignRight().Text("Amount (INR)");

                                    static IContainer CellStyle(IContainer container) => 
                                        container.DefaultTextStyle(x => x.SemiBold().FontColor(Colors.White))
                                                 .PaddingVertical(10).PaddingHorizontal(8).Background("#7c3aed");
                                });

                                table.Cell().Element(ValueStyle).Text("1");
                                table.Cell().Element(ValueStyle).Text(description).FontSize(11).SemiBold();
                                table.Cell().Element(ValueStyle).AlignRight().Text($"{amount:N2}").FontSize(11).Bold();

                                static IContainer ValueStyle(IContainer container) =>
                                    container.PaddingVertical(14).PaddingHorizontal(8).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3);
                            });

                            // 5. Payment Details & Totals
                            x.Item().Row(row =>
                            {
                                // Payment Box
                                row.RelativeItem(1.2f).Column(p =>
                                {
                                    p.Item().Text("PAYMENT SUMMARY").FontSize(8).SemiBold().FontColor("#7c3aed");
                                    p.Item().PaddingVertical(6).Table(t => {
                                        t.ColumnsDefinition(c => { c.ConstantColumn(80); c.RelativeColumn(); });
                                        t.Cell().Text("Method:").FontSize(8).FontColor(Colors.Grey.Medium);
                                        t.Cell().Text(paymentMethod).FontSize(8).SemiBold();
                                        t.Cell().Text("Transaction:").FontSize(8).FontColor(Colors.Grey.Medium);
                                        t.Cell().Text(transactionId).FontSize(7).Italic();
                                        t.Cell().Text("Paid On:").FontSize(8).FontColor(Colors.Grey.Medium);
                                        t.Cell().Text($"{purchaseDate:dd MMM yyyy HH:mm}").FontSize(8).SemiBold();
                                    });
                                    
                                    p.Item().PaddingTop(10).Text("Thank you for your business!").FontSize(9).Italic().FontColor("#7c3aed");
                                });

                                row.ConstantItem(30);

                                // Totals Box
                                row.RelativeItem(0.8f).Column(tot =>
                                {
                                    tot.Item().PaddingBottom(8).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Row(r => {
                                        r.RelativeItem().Text("Subtotal").FontSize(9);
                                        r.RelativeItem().AlignRight().Text($"₹{amount:N2}").FontSize(9);
                                    });
                                    tot.Item().PaddingVertical(8).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Row(r => {
                                        r.RelativeItem().Text("Tax (GST 18%)").FontSize(9);
                                        r.RelativeItem().AlignRight().Text($"₹{taxAmount:N2}").FontSize(9);
                                    });
                                    tot.Item().PaddingVertical(12).Background("#7c3aed").PaddingHorizontal(10).Row(r => {
                                        r.RelativeItem().Text("GRAND TOTAL").FontSize(12).Bold().FontColor(Colors.White);
                                        r.RelativeItem().AlignRight().Text($"₹{totalAmount:N2}").FontSize(12).Bold().FontColor(Colors.White);
                                    });
                                });
                            });
                            
                            // 6. Security & Disclaimer Footer
                            x.Item().PaddingTop(10).Column(footer =>
                            {
                                footer.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten3);
                                footer.Item().PaddingTop(15).Row(row => {
                                    row.RelativeItem().Column(c => {
                                        c.Item().Text("Terms & Conditions").FontSize(8).Bold();
                                        c.Item().Text("This is a computer-generated secure document. It confirms your coverage start date as listed above. Please retain for any future claims.").FontSize(7).LineHeight(1.2f).FontColor(Colors.Grey.Medium);
                                    });
                                    row.ConstantItem(30);
                                    row.RelativeItem().AlignRight().Column(c => {
                                        c.Item().Text("Support Contact").FontSize(8).Bold();
                                        c.Item().Text("Web: www.shieldsure.com\nEmail: claims@shieldsure.com\nTel: 1800-SHIELD-SURE").FontSize(7).LineHeight(1.2f).FontColor(Colors.Grey.Medium).AlignRight();
                                    });
                                });
                            });
                        });

                        page.Footer().AlignCenter().Text(x =>
                        {
                            x.Span("Page ");
                            x.CurrentPageNumber();
                            x.Span(" of ");
                            x.TotalPages();
                            x.Span(" | Generated for ").FontColor(Colors.Grey.Medium);
                            x.Span(customerName).FontColor(Colors.Grey.Medium).SemiBold();
                        });
                    });
                });

                // Save PDF
                document.GeneratePdf(filePath);

                // 7. Save Entity
                var invoice = new Invoice(
                    invoiceNumber,
                    customerId,
                    type,
                    relatedId,
                    amount,
                    taxAmount,
                    filePath
                );

                await _invoiceRepository.AddAsync(invoice);
                await _invoiceRepository.SaveChangesAsync();

                return MapToDto(invoice);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate invoice for {RelatedType} {RelatedId}", type, relatedId);
                // Return null or handle silently to not block the main transaction flow if invoice fail is secondary
                return null; 
            }
        }

        public async Task<IEnumerable<InvoiceDto>> GetCustomerInvoicesAsync(int customerId)
        {
            var invoices = await _invoiceRepository.GetByCustomerIdAsync(customerId);
            var apps = await _applicationRepository.GetByCustomerIdAsync(customerId);
            
            var results = new List<InvoiceDto>();
            foreach (var inv in invoices)
            {
                var dto = MapToDto(inv);
                if (inv.RelatedType == InvoiceType.PolicyApplication)
                {
                    var app = apps.FirstOrDefault(a => a.Id == inv.RelatedId);
                    dto.RelatedName = app?.PolicyProduct?.Name ?? "Insurance Policy";
                }
                else // Claim
                {
                    // For claims, we could fetch specifically if needed, but for now we'll label it
                    dto.RelatedName = "Claim Settlement";
                }
                results.Add(dto);
            }
            return results;
        }

        public async Task<InvoiceDto> GetInvoiceByIdAsync(int invoiceId)
        {
            var invoice = await _invoiceRepository.GetByIdAsync(invoiceId);
            return invoice == null ? null : MapToDto(invoice);
        }

        public async Task<InvoiceDto> GetInvoiceByRelatedIdAsync(InvoiceType type, int relatedId)
        {
            var invoice = await _invoiceRepository.GetByRelatedIdAsync(type, relatedId);
            return invoice == null ? null : MapToDto(invoice);
        }

        public async Task<(byte[] Content, string ContentType, string FileName)> GetInvoicePdfAsync(int invoiceId)
        {
            var invoice = await _invoiceRepository.GetByIdAsync(invoiceId);
            if (invoice == null || !File.Exists(invoice.FilePath))
                throw new Exception("Invoice file not found");

            var content = await File.ReadAllBytesAsync(invoice.FilePath);
            return (content, "application/pdf", $"{invoice.InvoiceNumber}.pdf");
        }

        private InvoiceDto MapToDto(Invoice invoice)
        {
            return new InvoiceDto
            {
                Id = invoice.Id,
                InvoiceNumber = invoice.InvoiceNumber,
                CustomerId = invoice.CustomerId,
                RelatedType = invoice.RelatedType.ToString(),
                RelatedId = invoice.RelatedId,
                AmountBeforeTax = invoice.AmountBeforeTax,
                TaxAmount = invoice.TaxAmount,
                TotalAmount = invoice.TotalAmount,
                Currency = invoice.Currency,
                Status = invoice.Status.ToString(),
                RelatedName = "Insurance Premium", // Placeholder, will be refined in the service method
                GeneratedAt = invoice.GeneratedAt,
                ViewUrl = $"/api/Invoices/{invoice.Id}/view", // Consistent PascalCase for controller route
                DownloadUrl = $"/api/Invoices/{invoice.Id}/pdf"
            };
        }
    }
}
