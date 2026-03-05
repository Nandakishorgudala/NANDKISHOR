using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Insurance.Application.DTOs.Agent
{
    public class CreateAgentDto
    {
        [Required]
        [StringLength(100)]
        public string FullName { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [StringLength(50)]
        public string? LicenseNumber { get; set; }

        [StringLength(100)]
        public string? Branch { get; set; }

        [Required]
        [MinLength(6)]
        public string Password { get; set; }
    }
}
