using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Policy
{
    public class ApplyPolicyDto
    {
        [Required]
        public int PolicyProductId { get; set; }

        [Required]
        public string AssetType { get; set; }

        [Range(1, double.MaxValue)]
        public decimal AssetValue { get; set; }

        [Range(1800, 2100)]
        public int YearBuilt { get; set; }

        [Required]
        public string State { get; set; }

        [Required]
        public string City { get; set; }

        [Required]
        public string ZipCode { get; set; }

        [Range(1, double.MaxValue)]
        public decimal CoverageAmount { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Deductible { get; set; }
    }


}
