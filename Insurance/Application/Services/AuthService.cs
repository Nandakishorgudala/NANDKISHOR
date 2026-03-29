using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Insurance.Application.DTOs.Auth;
using Insurance.Application.Interfaces;
using Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Domain.Enums;

namespace Insurance.Application.Services
{
    public class AuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;
        private readonly IAgentRepository _agentRepository;
        private readonly IClaimsOfficerRepository _claimsOfficerRepository;
        private readonly ICustomerRepository _customerRepository;

        public AuthService(
            IUserRepository userRepository,
            IPasswordHasher passwordHasher,
            IJwtTokenGenerator jwtTokenGenerator,
            IAgentRepository agentRepository,
            IClaimsOfficerRepository claimsOfficerRepository,
            ICustomerRepository customerRepository)
        {
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _jwtTokenGenerator = jwtTokenGenerator;
            _agentRepository = agentRepository;
            _claimsOfficerRepository = claimsOfficerRepository;
            _customerRepository = customerRepository;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            var existingUser = await _userRepository.GetByEmailAsync(request.Email);

            if (existingUser != null)
                throw new InvalidOperationException("Email already registered.");

            var hashedPassword = _passwordHasher.Hash(request.Password);

            var user = new User(
                request.FullName,
                request.Email,
                hashedPassword,
                Role.Customer);

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            // Create corresponding customer profile
            var customer = new Customer(
                user.Id,
                request.Age,
                request.PhoneNumber,
                request.Address,
                request.City,
                request.State,
                request.ZipCode
            );

            await _customerRepository.AddAsync(customer);
            await _customerRepository.SaveChangesAsync();

            var token = _jwtTokenGenerator.GenerateToken(user);

            return new AuthResponse
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role.ToString(),
                Token = token
            };
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var user = await _userRepository.GetByEmailAsync(request.Email);

            if (user == null ||
                !_passwordHasher.Verify(request.Password, user.PasswordHash))
                throw new InvalidOperationException("Invalid credentials.");

            var token = _jwtTokenGenerator.GenerateToken(user);

            int? agentId = null;
            int? claimsOfficerId = null;

            if (user.Role == Role.Agent)
            {
                var agent = await _agentRepository.GetByUserIdAsync(user.Id);
                agentId = agent?.Id;
            }
            else if (user.Role == Role.ClaimsOfficer)
            {
                var officer = await _claimsOfficerRepository.GetByUserIdAsync(user.Id);
                claimsOfficerId = officer?.Id;
            }

            return new AuthResponse
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role.ToString(),
                Token = token,
                AgentId = agentId,
                ClaimsOfficerId = claimsOfficerId
            };
        }

        public async Task ForgotPasswordAsync(ForgotPasswordRequest request)
        {
            var user = await _userRepository.GetByEmailAsync(request.Email);

            if (user == null)
                throw new InvalidOperationException("User with this email does not exist.");

            if (!user.IsActive)
                throw new InvalidOperationException("User account is inactive.");

            var newPasswordHash = _passwordHasher.Hash(request.NewPassword);
            user.UpdatePassword(newPasswordHash);

            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();
        }
    }
}
