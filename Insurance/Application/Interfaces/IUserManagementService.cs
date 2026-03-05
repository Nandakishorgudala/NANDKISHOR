using Insurance.Application.DTOs.Admin;
using Insurance.Application.DTOs.Agent;

namespace Application.Interfaces
{
    public interface IUserManagementService
    {
        Task CreateClaimsOfficerAsync(CreateClaimsOfficerDto dto);
        Task CreateAgentAsync(CreateAgentDto dto);
    }
}