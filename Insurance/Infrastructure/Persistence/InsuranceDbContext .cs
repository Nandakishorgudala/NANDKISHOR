using Insurance.Domain.Entities;
using Insurance.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace Insurance.Infrastructure.Persistence
{
    public class InsuranceDbContext : DbContext
    {
        public InsuranceDbContext(DbContextOptions<InsuranceDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Customer> Customers => Set<Customer>();
        public DbSet<Agent> Agents => Set<Agent>();
        public DbSet<ClaimsOfficer> ClaimsOfficers => Set<ClaimsOfficer>();
        public DbSet<PolicyProduct> PolicyProducts => Set<PolicyProduct>();
        public DbSet<PolicyApplication> PolicyApplications => Set<PolicyApplication>();
        public DbSet<Policy> Policies => Set<Policy>();
        public DbSet<Claims> Claims => Set<Claims>();
        public DbSet<Payment> Payments => Set<Payment>();



        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(
                typeof(InsuranceDbContext).Assembly);

            base.OnModelCreating(modelBuilder);

            // PolicyApplication configuration
            modelBuilder.Entity<PolicyApplication>(entity =>
            {
                entity.Property(p => p.AssetValue).HasPrecision(18, 2);
                entity.Property(p => p.CoverageAmount).HasPrecision(18, 2);
                entity.Property(p => p.CalculatedPremium).HasPrecision(18, 2);
                entity.Property(p => p.Deductible).HasPrecision(18, 2);
            });

            // Policy configuration
            modelBuilder.Entity<Policy>(entity =>
            {
                entity.Property(p => p.PremiumAmount).HasPrecision(18, 2);
                entity.Property(p => p.CoverageAmount).HasPrecision(18, 2);
                entity.HasIndex(p => p.PolicyNumber).IsUnique();
            });

            // Claims configuration
            modelBuilder.Entity<Claims>(entity =>
            {
                entity.Property(c => c.ClaimedAmount).HasPrecision(18, 2);
                entity.Property(c => c.EstimatedLossAmount).HasPrecision(18, 2);
                entity.Property(c => c.ApprovedAmount).HasPrecision(18, 2);
                entity.Property(c => c.DisasterImpactScore).HasPrecision(5, 2);
                entity.Property(c => c.FraudRiskScore).HasPrecision(5, 2);
                entity.Property(c => c.PropertyLossPercentage).HasPrecision(5, 2);
            });

            // Payment configuration
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.Property(p => p.Amount).HasPrecision(18, 2);
            });

            // PolicyProduct configuration
            modelBuilder.Entity<PolicyProduct>(entity =>
            {
                entity.Property(p => p.BasePremium).HasPrecision(18, 2);
                entity.Property(p => p.CoverageAmount).HasPrecision(18, 2);
            });
        }

        public override async Task<int> SaveChangesAsync(
            CancellationToken cancellationToken = default)
        {
            var entries = ChangeTracker
                .Entries()
                .Where(e => e.Entity is BaseEntity &&
                            (e.State == EntityState.Modified));

            foreach (var entry in entries)
            {
                ((BaseEntity)entry.Entity).SetUpdatedTime();
            }

            return await base.SaveChangesAsync(cancellationToken);
        }
    }
}
