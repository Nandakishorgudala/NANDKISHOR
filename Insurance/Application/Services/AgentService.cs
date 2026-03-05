using Application.Interfaces;
using AutoMapper;
using Insurance.Domain.Entities;
using Insurance.Application.Interfaces;
using Insurance.Application.DTOs.Agent;

namespace Application.Services
{
    public class AgentService : IAgentService
    {
        private readonly IAgentRepository _repository;
        private readonly IMapper _mapper;

        public AgentService(
            IAgentRepository repository,
            IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<AgentResponse> CreateAsync(CreateAgentDto dto)
        {
            // Business Rule Example:
            //if (await _repository.ExistsByLicenseAsync(dto.LicenseNumber))
            //    throw new Exception("License number already exists.");

            var agent = _mapper.Map<Agent>(dto);

            await _repository.AddAsync(agent);
            await _repository.SaveChangesAsync();

            return _mapper.Map<AgentResponse>(agent);
        }

        public async Task<List<AgentResponse>> GetAllAsync()
        {
            var agents = await _repository.GetAllAsync();
            return _mapper.Map<List<AgentResponse>>(agents);
        }
    }
}
