using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.Policy;

namespace Application.Interfaces
{
    public interface IPolicyApplicationService
    {
        Task<int> SubmitApplicationAsync(int customerId, ApplyPolicyDto dto);
        Task<int> SubmitApplicationWithPlanAsync(int customerId, ApplyPolicyWithPlanDto dto);
        Task<IEnumerable<object>> GetCustomerApplicationsAsync(int customerId);
        Task AssignAgentAsync(int applicationId);
        Task ApproveApplicationAsync(int applicationId, int agentId);
        Task RejectApplicationAsync(int applicationId, int agentId, string reason);
    }



}
