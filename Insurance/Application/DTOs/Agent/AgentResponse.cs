using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Insurance.Application.DTOs.Agent
{
    public class AgentResponse
    {
        public int Id { get; set; }
        public string LicenseNumber { get; set; }
        public string Branch { get; set; }
        public bool IsActive { get; set; }
    }
}
