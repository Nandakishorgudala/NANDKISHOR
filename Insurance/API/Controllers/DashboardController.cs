using Application.Interfaces;
using Insurance.Application.Interfaces;
using Insurance.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly ICustomerRepository _customerRepository;
        private readonly IAgentRepository _agentRepository;
        private readonly IClaimsOfficerRepository _officerRepository;
        private readonly IPolicyApplicationRepository _applicationRepository;
        private readonly IClaimsRepository _claimsRepository;

        public DashboardController(
            ICustomerRepository customerRepository,
            IAgentRepository agentRepository,
            IClaimsOfficerRepository officerRepository,
            IPolicyApplicationRepository applicationRepository,
            IClaimsRepository claimsRepository)
        {
            _customerRepository = customerRepository;
            _agentRepository = agentRepository;
            _officerRepository = officerRepository;
            _applicationRepository = applicationRepository;
            _claimsRepository = claimsRepository;
        }

        [HttpGet("admin/stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAdminStats()
        {
            var totalCustomers = await _customerRepository.GetTotalCountAsync();
            var totalAgents = await _agentRepository.GetTotalCountAsync();
            var totalOfficers = await _officerRepository.GetTotalCountAsync();
            var pendingApplications = (await _applicationRepository.GetPendingApplicationsAsync()).Count();
            var pendingClaims = (await _claimsRepository.GetPendingClaimsAsync()).Count();

            return Ok(new
            {
                totalCustomers = totalCustomers,
                totalAgents = totalAgents,
                totalClaimsOfficers = totalOfficers,
                pendingApplications = pendingApplications,
                pendingClaims = pendingClaims
            });
        }

        [HttpGet("agent/stats")]
        [Authorize(Roles = "Agent")]
        public async Task<IActionResult> GetAgentStats()
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var agent = await _agentRepository.GetByUserIdAsync(userId);
            
            if (agent == null)
                return BadRequest("Agent profile not found.");

            var assignedApplications = await _applicationRepository.GetByAgentIdAsync(agent.Id);
            var pendingReview = assignedApplications.Count(a => a.Status == ApplicationStatus.Assigned);
            var approved = assignedApplications.Count(a => a.Status == ApplicationStatus.Approved);

            return Ok(new
            {
                TotalAssigned = assignedApplications.Count(),
                PendingReview = pendingReview,
                Approved = approved
            });
        }

        [HttpGet("officer/stats")]
        [Authorize(Roles = "ClaimsOfficer")]
        public async Task<IActionResult> GetOfficerStats()
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var officer = await _officerRepository.GetByUserIdAsync(userId);
            
            if (officer == null)
                return BadRequest("Claims officer profile not found.");

            var assignedClaims = await _claimsRepository.GetByClaimsOfficerIdAsync(officer.Id);
            var underReview = assignedClaims.Count(c => c.Status == Insurance.Domain.Enums.ClaimStatus.UnderReview);
            var approved = assignedClaims.Count(c => c.Status == Insurance.Domain.Enums.ClaimStatus.Approved);
            var rejected = assignedClaims.Count(c => c.Status == Insurance.Domain.Enums.ClaimStatus.Rejected);

            return Ok(new
            {
                TotalAssigned = assignedClaims.Count(),
                UnderReview = underReview,
                Approved = approved,
                Rejected = rejected
            });
        }
    }
}
