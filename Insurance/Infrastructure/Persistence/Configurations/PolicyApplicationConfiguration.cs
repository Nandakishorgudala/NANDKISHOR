using Insurance.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class PolicyApplicationConfiguration : IEntityTypeConfiguration<PolicyApplication>
    {
        public void Configure(EntityTypeBuilder<PolicyApplication> builder)
        {
            builder.HasOne(pa => pa.Customer)
                .WithMany(c => c.PolicyApplications)
                .HasForeignKey(pa => pa.CustomerId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.HasOne(pa => pa.Agent)
                .WithMany(a => a.PolicyApplications)
                .HasForeignKey(pa => pa.AgentId)
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired(false);

            builder.HasOne(pa => pa.PolicyProduct)
                .WithMany()
                .HasForeignKey(pa => pa.PolicyProductId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}
