using Application.DTOs.Policy;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PolicyController : ControllerBase
    {
        private readonly IPolicyService _policyService;
        private readonly ICustomerRepository _customerRepository;
        private readonly IAgentRepository _agentRepository;

        public PolicyController(
            IPolicyService policyService,
            ICustomerRepository customerRepository,
            IAgentRepository agentRepository)
        {
            _policyService = policyService;
            _customerRepository = customerRepository;
            _agentRepository = agentRepository;
        }

        [HttpPost("calculate-premium")]
        [Authorize(Roles = "Agent")]
        public async Task<IActionResult> CalculatePremium([FromBody] CalculatePremiumDto dto)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var agent = await _agentRepository.GetByUserIdAsync(userId);
            
            if (agent == null)
                return BadRequest("Agent profile not found.");

            var response = await _policyService.CalculatePremiumAsync(agent.Id, dto);
            return Ok(response);
        }

        [HttpPost("create/{applicationId}")]
        [Authorize(Roles = "Admin,Agent")]
        public async Task<IActionResult> CreatePolicy(int applicationId)
        {
            var response = await _policyService.CreatePolicyAsync(applicationId);
            return Ok(response);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPolicyById(int id)
        {
            var response = await _policyService.GetPolicyByIdAsync(id);
            return Ok(response);
        }

        [HttpGet("my-policies")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyPolicies()
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var customer = await _customerRepository.GetByUserIdAsync(userId);
            
            if (customer == null)
                return BadRequest("Customer profile not found.");

            var response = await _policyService.GetPoliciesByCustomerIdAsync(customer.Id);
            return Ok(response);
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin,Agent")]
        public async Task<IActionResult> GetAllPolicies()
        {
            var response = await _policyService.GetAllPoliciesAsync();
            return Ok(response);
        }
    }
}
