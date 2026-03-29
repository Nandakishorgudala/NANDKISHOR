using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Insurance.Infrastructure.Persistence;

var optionsBuilder = new DbContextOptionsBuilder<InsuranceDbContext>();
optionsBuilder.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=InsuranceDb;Trusted_Connection=True;");

using (var context = new InsuranceDbContext(optionsBuilder.Options))
{
    Console.WriteLine($"PolicyProducts: {context.PolicyProducts.Count()}");
    Console.WriteLine($"PolicyApplications: {context.PolicyApplications.Count()}");
    Console.WriteLine($"Policies: {context.Policies.Count()}");
    Console.WriteLine($"Claims: {context.Claims.Count()}");
    Console.WriteLine($"Invoices: {context.Invoices.Count()}");
    Console.WriteLine($"Payments: {context.Payments.Count()}");
}
