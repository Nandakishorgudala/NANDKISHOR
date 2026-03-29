using Application.DTOs.Verification;

namespace Application.Interfaces
{
    public interface IVerificationService
    {
        Task<VerificationResultDto> VerifyApplicationAsync(int applicationId, int agentId);
    }
}
