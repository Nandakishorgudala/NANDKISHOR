using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Insurance.Domain.Entities;


namespace Infrastructure.Persistence.Configurations
{
    public class PolicyProductConfiguration : IEntityTypeConfiguration<PolicyProduct>
    {
        public void Configure(EntityTypeBuilder<PolicyProduct> builder)
        {
            builder.Property(p => p.BasePremium)
                   .HasPrecision(18, 2);

            builder.Property(p => p.CoverageAmount)
                   .HasPrecision(18, 2);
        }
    }

}
