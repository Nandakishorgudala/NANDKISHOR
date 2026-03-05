using Insurance.Application.DTOs.Claim;

namespace Application.Interfaces
{
    public interface IClaimsService
    {
        Task<ClaimResponse> CreateClaimAsync(int customerId, CreateClaimDto dto);
        Task<ClaimResponse> GetClaimByIdAsync(int claimId);
        Task<IEnumerable<ClaimResponse>> GetClaimsByCustomerIdAsync(int customerId);
        Task<IEnumerable<ClaimResponse>> GetClaimsByOfficerIdAsync(int officerId);
        Task<IEnumerable<ClaimResponse>> GetPendingClaimsAsync();
        Task AssignClaimToOfficerAsync(int claimId, int officerId);
        Task<ClaimResponse> ReviewClaimAsync(int officerId, ReviewClaimDto dto);
        Task<ClaimResponse> ApproveClaimAsync(int officerId, ApproveClaimDto dto);
        Task<ClaimResponse> RejectClaimAsync(int officerId, RejectClaimDto dto);
    }
}
