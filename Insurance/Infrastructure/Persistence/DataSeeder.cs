using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Insurance.Domain.Entities;
using Insurance.Infrastructure.Security;
using Insurance.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Insurance.Application.Interfaces;
using Insurance.Infrastructure.Persistence;

namespace Infrastructure.Persistence
{
    public static class DataSeeder
    {
        public static async Task SeedAdminAsync(
            InsuranceDbContext context,
            IPasswordHasher passwordHasher)
        {
            if (await context.Users.AnyAsync(u => u.Role == Role.Admin))
                return;

            var admin = new User(
                fullName: "Admin User",
                email: "admin@insurance.com",
                passwordHash: passwordHasher.Hash("Admin@123"),
                role: Role.Admin
            );

            await context.Users.AddAsync(admin);
            await context.SaveChangesAsync();
        }
    }
}
