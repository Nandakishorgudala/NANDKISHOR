using System;
using System.Linq;
using Insurance.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Insurance.Domain.Entities;

var optionsBuilder = new DbContextOptionsBuilder<InsuranceDbContext>();
optionsBuilder.UseSqlServer("Server=localhost;Database=CDIMS_Insurance;Trusted_Connection=True;TrustServerCertificate=True;");

using var context = new InsuranceDbContext(optionsBuilder.Options);
var invoices = context.Invoices.ToList();

Console.WriteLine($"Total Invoices: {invoices.Count}");
foreach (var inv in invoices)
{
    Console.WriteLine($"ID: {inv.Id}, Number: {inv.InvoiceNumber}, CustomerId: {inv.CustomerId}, RelatedId: {inv.RelatedId}, Type: {inv.RelatedType}, Amount: {inv.TotalAmount}");
}
