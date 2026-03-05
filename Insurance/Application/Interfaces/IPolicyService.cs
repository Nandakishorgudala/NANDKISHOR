using Application.DTOs.Policy;

namespace Application.Interfaces
{
    public interface IPolicyService
    {
        Task<PremiumCalculationResponse> CalculatePremiumAsync(int agentId, CalculatePremiumDto dto);
        Task<PolicyResponse> CreatePolicyAsync(int applicationId);
        Task<PolicyResponse> GetPolicyByIdAsync(int policyId);
        Task<IEnumerable<PolicyResponse>> GetPoliciesByCustomerIdAsync(int customerId);
        Task<IEnumerable<PolicyResponse>> GetAllPoliciesAsync();
    }
}
