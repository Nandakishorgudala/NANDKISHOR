using Insurance.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class ClaimsConfiguration : IEntityTypeConfiguration<Claims>
    {
        public void Configure(EntityTypeBuilder<Claims> builder)
        {
            builder.HasOne(c => c.Policy)
                .WithMany(p => p.Claims)
                .HasForeignKey(c => c.PolicyId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.HasOne(c => c.ClaimsOfficer)
                .WithMany(co => co.AssignedClaims)
                .HasForeignKey(c => c.ClaimsOfficerId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}
