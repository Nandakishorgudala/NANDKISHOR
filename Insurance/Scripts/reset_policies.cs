using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Insurance.Infrastructure.Persistence;

var optionsBuilder = new DbContextOptionsBuilder<InsuranceDbContext>();
optionsBuilder.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=InsuranceDb;Trusted_Connection=True;");

using (var context = new InsuranceDbContext(optionsBuilder.Options))
{
    // Delete in reverse dependency order
    Console.WriteLine("Cleaning database...");
    
    context.Invoices.RemoveRange(context.Invoices);
    context.Payments.RemoveRange(context.Payments);
    context.Commissions.RemoveRange(context.Commissions);
    context.Claims.RemoveRange(context.Claims);
    context.Policies.RemoveRange(context.Policies);
    context.ApplicationDocuments.RemoveRange(context.ApplicationDocuments); // Optional clear
    context.PolicyApplications.RemoveRange(context.PolicyApplications);
    context.PolicyProducts.RemoveRange(context.PolicyProducts);
    
    context.SaveChanges();
    Console.WriteLine("All existing policies and related records have been deleted.");
}
