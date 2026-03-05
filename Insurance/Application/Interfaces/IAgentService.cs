using Insurance.Application.DTOs.Agent;

namespace Application.Interfaces
{
    public interface IAgentService
    {
        Task<AgentResponse> CreateAsync(CreateAgentDto dto);
        Task<List<AgentResponse>> GetAllAsync();
    }
}