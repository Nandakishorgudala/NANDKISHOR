using Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Application.Interfaces;
using Insurance.Domain.Enums;
using Insurance.Application.DTOs.Agent;
using Insurance.Application.DTOs.Admin;

namespace Application.Services
{
    public class UserManagementService : IUserManagementService
    {
        private readonly IUserRepository _userRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IAgentRepository _agentRepository;
        private readonly IClaimsOfficerRepository _claimsOfficerRepository;

        public UserManagementService(
            IUserRepository userRepository,
            IPasswordHasher passwordHasher,
            IAgentRepository agentRepository,
            IClaimsOfficerRepository claimsOfficerRepository)
        {
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _agentRepository = agentRepository;
            _claimsOfficerRepository = claimsOfficerRepository;
        }

        public async Task CreateClaimsOfficerAsync(CreateClaimsOfficerDto dto)
        {
            var existingUser = await _userRepository.GetByEmailAsync(dto.Email);

            if (existingUser != null)
                throw new Exception("User already exists");

            var hashedPassword = _passwordHasher.Hash(dto.Password);

            var user = new User(
                dto.FullName,
                dto.Email,
                hashedPassword,
                Role.ClaimsOfficer
            );

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            // Auto-generate Employee ID if not provided
            var employeeId = dto.EmployeeId ?? $"EMP{user.Id:D6}";
            var department = dto.Department ?? "Claims Processing";

            // Create ClaimsOfficer entity
            var claimsOfficer = new ClaimsOfficer(
                user.Id,
                employeeId,
                department
            );

            await _claimsOfficerRepository.AddAsync(claimsOfficer);
            await _claimsOfficerRepository.SaveChangesAsync();
        }

        public async Task CreateAgentAsync(CreateAgentDto dto)
        {
            var existingUser = await _userRepository.GetByEmailAsync(dto.Email);

            if (existingUser != null)
                throw new Exception("User already exists");

            var hashedPassword = _passwordHasher.Hash(dto.Password);

            var user = new User(
                dto.FullName,
                dto.Email,
                hashedPassword,
                Role.Agent
            );

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            // Auto-generate License Number if not provided
            var licenseNumber = dto.LicenseNumber ?? $"LIC{user.Id:D6}";
            var branch = dto.Branch ?? "Main Branch";

            // Create Agent entity
            var agent = new Agent(
                user.Id,
                licenseNumber,
                branch
            );

            await _agentRepository.AddAsync(agent);
            await _agentRepository.SaveChangesAsync();
        }

        public async Task ToggleAgentStatusAsync(int agentId)
        {
            var agent = await _agentRepository.GetByIdAsync(agentId);
            if (agent == null) throw new Exception("Agent not found");

            var user = await _userRepository.GetByIdAsync(agent.UserId);
            if (user == null) throw new Exception("Associated user not found");

            if (agent.IsActive)
            {
                agent.Deactivate();
                user.Deactivate();
            }
            else
            {
                agent.Activate();
                user.Activate();
            }

            await _userRepository.UpdateAsync(user);
            await _agentRepository.SaveChangesAsync();
        }

        public async Task ToggleClaimsOfficerStatusAsync(int officerId)
        {
            var officer = await _claimsOfficerRepository.GetByIdAsync(officerId);
            if (officer == null) throw new Exception("Claims Officer not found");

            var user = await _userRepository.GetByIdAsync(officer.UserId);
            if (user == null) throw new Exception("Associated user not found");

            if (officer.IsActive)
            {
                officer.Deactivate();
                user.Deactivate();
            }
            else
            {
                officer.Activate();
                user.Activate();
            }

            await _userRepository.UpdateAsync(user);
            await _claimsOfficerRepository.SaveChangesAsync();
        }
    }
}
