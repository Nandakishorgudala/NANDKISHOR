using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Insurance.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Insurance.Domain.Entities;
using System.Collections.Generic;

var config = new ConfigurationBuilder().Build();
var optionsBuilder = new DbContextOptionsBuilder<InsuranceDbContext>();
optionsBuilder.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=InsuranceDb;Trusted_Connection=True;");

using (var context = new InsuranceDbContext(optionsBuilder.Options))
{
    var products = context.PolicyProducts.ToList();
    Console.WriteLine("START_PRODUCTS_LIST");
    foreach (var p in products)
    {
        Console.WriteLine($"{p.Id}|{p.Name}|{p.Description}");
    }
    Console.WriteLine("END_PRODUCTS_LIST");
}
