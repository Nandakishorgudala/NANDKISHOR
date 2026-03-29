using Insurance.Application.DTOs.Admin;
using Insurance.Application.DTOs.Agent;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Insurance.Application.Interfaces;

namespace API.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly IUserManagementService _userService;
        private readonly IPolicyApplicationRepository _applicationRepo;
        private readonly IPolicyRepository _policyRepo;
        private readonly IAgentRepository _agentRepo;
        private readonly IClaimsOfficerRepository _officerRepo;
        private readonly IClaimsRepository _claimsRepo;
        private readonly ICommissionRepository _commissionRepo;
        private readonly ICustomerService _customerService;

        public AdminController(
            IUserManagementService userService,
            IPolicyApplicationRepository applicationRepo,
            IPolicyRepository policyRepo,
            IAgentRepository agentRepo,
            IClaimsOfficerRepository officerRepo,
            IClaimsRepository claimsRepo,
            ICommissionRepository commissionRepo,
            ICustomerService customerService)
        {
            _userService = userService;
            _applicationRepo = applicationRepo;
            _policyRepo = policyRepo;
            _agentRepo = agentRepo;
            _officerRepo = officerRepo;
            _claimsRepo = claimsRepo;
            _commissionRepo = commissionRepo;
            _customerService = customerService;
        }

        [HttpPost("staff")]
        public async Task<IActionResult> CreateStaff([FromBody] CreateStaffDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                if (dto.Role?.ToLower() == "agent")
                {
                    var agentDto = new CreateAgentDto
                    {
                        FullName = dto.FullName,
                        Email = dto.Email,
                        Password = dto.Password
                    };
                    await _userService.CreateAgentAsync(agentDto);
                    return Created("", new { message = "Agent created successfully" });
                }
                else if (dto.Role?.ToLower() == "claimsofficer")
                {
                    var officerDto = new CreateClaimsOfficerDto
                    {
                        FullName = dto.FullName,
                        Email = dto.Email,
                        Password = dto.Password
                    };
                    await _userService.CreateClaimsOfficerAsync(officerDto);
                    return Created("", new { message = "Claims Officer created successfully" });
                }
                else
                {
                    return BadRequest(new { message = "Invalid role specified. Must be 'agent' or 'claimsOfficer'." });
                }
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("User already exists", StringComparison.OrdinalIgnoreCase))
                {
                    return Conflict(new { message = "Email already exists" });
                }
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("create-claims-officer")]
        public async Task<IActionResult> CreateClaimsOfficer(CreateClaimsOfficerDto dto)
        {
            try
            {
                await _userService.CreateClaimsOfficerAsync(dto);
                return Ok(new { message = "Claims Officer created successfully" });
            }
            catch (Exception ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }


        [HttpPost("create-agent")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateAgent(CreateAgentDto dto)
        {
            try
            {
                await _userService.CreateAgentAsync(dto);
                return Ok(new { message = "Agent created successfully" });
            }
            catch (Exception ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpGet("customers")]
        public async Task<IActionResult> GetAllCustomers()
        {
            var customers = await _customerService.GetAllCustomersAsync();
            return Ok(customers);
        }

        [HttpGet("applications")]
        public async Task<IActionResult> GetAllApplications()
        {
            var applications = await _applicationRepo.GetAllWithDetailsAsync();
            
            var result = applications.Select(app => new
            {
                app.Id,
                app.CustomerId,
                CustomerName = app.Customer?.User?.FullName ?? "Unknown",
                CustomerEmail = app.Customer?.User?.Email ?? "N/A",
                app.AgentId,
                AgentName = app.Agent?.User?.FullName,
                AgentEmail = app.Agent?.User?.Email,
                PolicyProductName = app.PolicyProduct?.Name ?? "N/A",
                app.AssetType,
                app.AssetValue,
                app.City,
                app.State,
                app.ZipCode,
                app.CoverageAmount,
                app.CalculatedPremium,
                app.RiskScore,
                Status = app.Status.ToString(),
                SubmittedAt = app.SubmittedAt
            });

            return Ok(result);
        }

        [HttpGet("policies")]
        public async Task<IActionResult> GetAllPolicies()
        {
            var policies = await _policyRepo.GetAllWithDetailsAsync();
            
            var result = policies.Select(policy => new
            {
                policy.Id,
                policy.PolicyNumber,
                policy.CustomerId,
                CustomerName = policy.Customer?.User?.FullName ?? "Unknown",
                CustomerEmail = policy.Customer?.User?.Email ?? "N/A",
                AgentId = policy.Application?.AgentId,
                AgentName = policy.Application?.Agent?.User?.FullName,
                AgentEmail = policy.Application?.Agent?.User?.Email,
                policy.CoverageAmount,
                policy.PremiumAmount,
                Status = policy.Status.ToString(),
                policy.StartDate,
                policy.EndDate,
                Claims = policy.Claims.Select(c => new
                {
                    c.Id,
                    c.ClaimedAmount,
                    c.IncidentDate,
                    Status = c.Status.ToString()
                }).ToList()
            });

            return Ok(result);
        }

        [HttpGet("agent-performance")]
        public async Task<IActionResult> GetAgentPerformance()
        {
            var agents = await _agentRepo.GetAllWithDetailsAsync();
            var allApplications = await _applicationRepo.GetAllAsync();
            var allPolicies = await _policyRepo.GetAllAsync();
            var allCommissions = await _commissionRepo.GetAllAsync();

            var result = agents.Select(agent => new
            {
                agentId = agent.Id,
                fullName = agent.User?.FullName ?? "Unknown",
                email = agent.User?.Email ?? "N/A",
                totalApplications = allApplications.Count(a => a.AgentId == agent.Id),
                approvedApplications = allApplications.Count(a => a.AgentId == agent.Id && a.Status == Insurance.Domain.Enums.ApplicationStatus.Approved),
                pendingApplications = allApplications.Count(a => a.AgentId == agent.Id && (a.Status == Insurance.Domain.Enums.ApplicationStatus.Pending || a.Status == Insurance.Domain.Enums.ApplicationStatus.Assigned || a.Status == Insurance.Domain.Enums.ApplicationStatus.AgentApproved)),
                activePolicies = allPolicies.Count(p => p.Application.AgentId == agent.Id && p.Status == Insurance.Domain.Enums.PolicyStatus.Active),
                totalCommissions = allCommissions.Where(c => c.AgentId == agent.Id).Sum(c => c.Amount),
                isActive = agent.IsActive
            });

            return Ok(result);
        }

        [HttpGet("available-agents")]
        public async Task<IActionResult> GetAvailableAgents()
        {
            var agents = await _agentRepo.GetAllWithDetailsAsync();
            
            var result = agents.Where(a => a.IsActive).Select(agent => new
            {
                agent.Id,
                FullName = agent.User?.FullName ?? "Unknown",
                Email = agent.User?.Email ?? "N/A",
                LicenseNumber = agent.LicenseNumber,
                Branch = agent.Branch
            });

            return Ok(result);
        }

        [HttpPost("assign-agent")]
        public async Task<IActionResult> AssignAgent([FromBody] AssignAgentRequest request)
        {
            try
            {
                var application = await _applicationRepo.GetByIdAsync(request.ApplicationId);
                if (application == null)
                    return NotFound(new { message = "Application not found" });

                var agent = await _agentRepo.GetByIdAsync(request.AgentId);
                if (agent == null)
                    return NotFound(new { message = "Agent not found" });

                application.AssignAgent(request.AgentId);
                await _applicationRepo.SaveChangesAsync();

                return Ok(new { message = "Agent assigned successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("assign-agent-to-policy")]
        public async Task<IActionResult> AssignAgentToPolicy([FromBody] AssignAgentToPolicyRequest request)
        {
            try
            {
                var policy = await _policyRepo.GetByIdAsync(request.PolicyId);
                if (policy == null)
                    return NotFound(new { message = "Policy not found" });

                var agent = await _agentRepo.GetByIdAsync(request.AgentId);
                if (agent == null)
                    return NotFound(new { message = "Agent not found" });

                // Get the associated application and assign the agent
                var application = await _applicationRepo.GetByIdAsync(policy.ApplicationId);
                if (application == null)
                    return NotFound(new { message = "Associated application not found" });

                application.AssignAgent(request.AgentId);
                await _applicationRepo.SaveChangesAsync();

                return Ok(new { message = "Agent assigned to policy successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("officer-performance")]
        public async Task<IActionResult> GetOfficerPerformance()
        {
            var officers = await _officerRepo.GetAllWithDetailsAsync();
            var allClaims = await _claimsRepo.GetAllAsync();

            var result = officers.Select(officer => new
            {
                officerId = officer.Id,
                fullName = officer.User?.FullName ?? "Unknown",
                email = officer.User?.Email ?? "N/A",
                employeeId = officer.EmployeeId,
                department = officer.Department,
                totalClaims = allClaims.Count(c => c.ClaimsOfficerId == officer.Id),
                pendingClaims = allClaims.Count(c => c.ClaimsOfficerId == officer.Id && c.Status == Insurance.Domain.Enums.ClaimStatus.Submitted),
                underReviewClaims = allClaims.Count(c => c.ClaimsOfficerId == officer.Id && c.Status == Insurance.Domain.Enums.ClaimStatus.UnderReview),
                approvedClaims = allClaims.Count(c => c.ClaimsOfficerId == officer.Id && c.Status == Insurance.Domain.Enums.ClaimStatus.Approved),
                rejectedClaims = allClaims.Count(c => c.ClaimsOfficerId == officer.Id && c.Status == Insurance.Domain.Enums.ClaimStatus.Rejected),
                isActive = officer.IsActive
            });

            return Ok(result);
        }

        [HttpGet("available-officers")]
        public async Task<IActionResult> GetAvailableOfficers()
        {
            var officers = await _officerRepo.GetAllActiveAsync();
            var result = officers.Select(officer => new
            {
                id = officer.Id,
                fullName = officer.User?.FullName ?? "Unknown",
                email = officer.User?.Email ?? "N/A",
                employeeId = officer.EmployeeId,
                department = officer.Department
            });

            return Ok(result);
        }

        [HttpGet("unassigned-claims")]
        public async Task<IActionResult> GetUnassignedClaims()
        {
            var unassignedClaims = await _claimsRepo.GetUnassignedClaimsAsync();

            var result = new List<object>();
            foreach (var claim in unassignedClaims)
            {
                var policy = await _policyRepo.GetByIdWithDetailsAsync(claim.PolicyId);

                var customerName = policy?.Customer?.User?.FullName ?? "Unknown";
                var policyProductName = policy?.Application?.PolicyProduct?.Name ?? policy?.PolicyNumber ?? "N/A";
                var agentName = policy?.Application?.Agent?.User?.FullName;

                result.Add(new
                {
                    id = claim.Id,
                    policyId = claim.PolicyId,
                    policyNumber = policy?.PolicyNumber ?? "N/A",
                    policyProductName = policyProductName,
                    customerId = policy?.CustomerId,
                    customerName = customerName,
                    agentName = agentName,
                    incidentDate = claim.IncidentDate,
                    incidentLocation = claim.IncidentLocation,
                    incidentZipCode = claim.IncidentZipCode,
                    incidentDescription = claim.IncidentDescription,
                    claimedAmount = claim.ClaimedAmount,
                    totalCoverage = (policy?.Application?.CoverageAmount ?? 0) - (policy?.Claims?.Where(c => c.Status == Insurance.Domain.Enums.ClaimStatus.Approved || c.Status == Insurance.Domain.Enums.ClaimStatus.Settled).Sum(c => c.ApprovedAmount) ?? 0),
                    status = claim.Status.ToString(),
                    createdAt = claim.CreatedAt
                });
            }

            return Ok(result);
        }

        [HttpPost("assign-officer")]
        public async Task<IActionResult> AssignOfficerToClaim([FromBody] AssignOfficerRequest request)
        {
            var claim = await _claimsRepo.GetByIdAsync(request.ClaimId);
            if (claim == null)
                return NotFound(new { message = "Claim not found" });

            var officer = await _officerRepo.GetByIdAsync(request.OfficerId);
            if (officer == null || !officer.IsActive)
                return BadRequest(new { message = "Claims officer not found or inactive" });

            claim.AssignOfficer(request.OfficerId);
            await _claimsRepo.UpdateAsync(claim);
            await _claimsRepo.SaveChangesAsync();

            return Ok(new { message = "Claims officer assigned successfully" });
        }

        [HttpPut("agents/{id}/toggle-status")]
        public async Task<IActionResult> ToggleAgentStatus(int id)
        {
            try
            {
                await _userService.ToggleAgentStatusAsync(id);
                return Ok(new { message = "Agent status toggled successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("officers/{id}/toggle-status")]
        public async Task<IActionResult> ToggleOfficerStatus(int id)
        {
            try
            {
                await _userService.ToggleClaimsOfficerStatusAsync(id);
                return Ok(new { message = "Claims officer status toggled successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public class AssignAgentRequest
    {
        public int ApplicationId { get; set; }
        public int AgentId { get; set; }
    }

    public class AssignAgentToPolicyRequest
    {
        public int PolicyId { get; set; }
        public int AgentId { get; set; }
    }

    public class AssignOfficerRequest
    {
        public int ClaimId { get; set; }
        public int OfficerId { get; set; }
    }
}
