using Application.DTOs.Policy;
using Application.Interfaces;
using Insurance.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PolicyApplicationsController : ControllerBase
    {
        private readonly IPolicyApplicationService _applicationService;
        private readonly ICustomerRepository _customerRepository;
        private readonly IAgentRepository _agentRepository;
        private readonly IPolicyApplicationRepository _applicationRepository;
        private readonly IPolicyRepository _policyRepository;
        private readonly IApplicationDocumentRepository _docRepository;
        private readonly IVerificationService _verificationService;

        public PolicyApplicationsController(
            IPolicyApplicationService applicationService,
            ICustomerRepository customerRepository,
            IAgentRepository agentRepository,
            IPolicyApplicationRepository applicationRepository,
            IPolicyRepository policyRepository,
            IApplicationDocumentRepository docRepository,
            IVerificationService verificationService)
        {
            _applicationService = applicationService;
            _customerRepository = customerRepository;
            _agentRepository = agentRepository;
            _applicationRepository = applicationRepository;
            _policyRepository = policyRepository;
            _docRepository = docRepository;
            _verificationService = verificationService;
        }

        [Authorize(Roles = "Customer")]
        [HttpPost]
        public async Task<IActionResult> Apply(ApplyPolicyDto dto)
        {
            int userId = int.Parse(
                User.FindFirst(ClaimTypes.NameIdentifier).Value);

            var customer = await _customerRepository.GetByUserIdAsync(userId);
            if (customer == null)
                return BadRequest(new { message = "Please create your customer profile first" });

            var id = await _applicationService
                .SubmitApplicationAsync(customer.Id, dto);

            return Ok(new { ApplicationId = id });
        }

        [Authorize(Roles = "Customer")]
        [HttpPost("apply-with-plan")]
        public async Task<IActionResult> ApplyWithPlan(ApplyPolicyWithPlanDto dto)
        {
            try
            {
                // Validate model state
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value.Errors.Count > 0)
                        .Select(x => new { Field = x.Key, Errors = x.Value.Errors.Select(e => e.ErrorMessage) })
                        .ToList();
                    
                    return BadRequest(new { 
                        message = "Validation failed", 
                        errors = errors 
                    });
                }

                int userId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier).Value);

                var customer = await _customerRepository.GetByUserIdAsync(userId);
                if (customer == null)
                    return BadRequest(new { message = "Please create your customer profile first" });

                var id = await _applicationService
                    .SubmitApplicationWithPlanAsync(customer.Id, dto);

                return Ok(new { 
                    ApplicationId = id,
                    Message = "Application submitted successfully! An agent will review your request soon."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { 
                    message = "Failed to submit application", 
                    error = ex.Message 
                });
            }
        }

        [Authorize(Roles = "Customer")]
        [HttpGet("customer")]
        public async Task<IActionResult> GetCustomerApplications()
        {
            int userId = int.Parse(
                User.FindFirst(ClaimTypes.NameIdentifier).Value);

            var customer = await _customerRepository.GetByUserIdAsync(userId);
            if (customer == null)
                return Ok(new List<object>());

            var applications = await _applicationService.GetCustomerApplicationsAsync(customer.Id);
            return Ok(applications);
        }

        [Authorize(Roles = "Agent")]
        [HttpGet("agent")]
        public async Task<IActionResult> GetAgentApplications()
        {
            int userId = int.Parse(
                User.FindFirst(ClaimTypes.NameIdentifier).Value);

            var agent = await _agentRepository.GetByUserIdAsync(userId);
            if (agent == null)
                return Ok(new List<object>());

            var applications = await _applicationRepository.GetByAgentIdAsync(agent.Id);

            // Pull document metadata for all returned applications in one DB round-trip
            var appIds = applications.Select(a => a.Id).ToList();
            var docList = await _docRepository.GetByApplicationIdsAsync(appIds);
            var docs = docList.ToDictionary(d => d.PolicyApplicationId);

            var result = applications.Select(app =>
            {
                docs.TryGetValue(app.Id, out var doc);
                return new
                {
                    id = app.Id,
                    customerId = app.CustomerId,
                    customerName = app.Customer?.User?.FullName ?? "Unknown",
                    customerEmail = app.Customer?.User?.Email ?? "N/A",
                    policyProductId = app.PolicyProductId,
                    assetType = app.AssetType,
                    assetValue = app.AssetValue,
                    coverageAmount = app.CoverageAmount,
                    calculatedPremium = app.CalculatedPremium,
                    riskScore = app.RiskScore,
                    status = app.Status.ToString(),
                    submittedAt = app.SubmittedAt,
                    agentId = app.AgentId,
                    city = app.City,
                    state = app.State,
                    requiresManualReview = app.RequiresManualReview,
                    rejectionReason = app.RejectionReason,
                    documentId = doc?.Id,
                    documentFileName = doc?.FileName,
                    documentContentType = doc?.ContentType
                };
            });

            return Ok(result);
        }

        [Authorize(Roles = "Agent")]
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveApplication(int id)
        {
            int userId = int.Parse(
                User.FindFirst(ClaimTypes.NameIdentifier).Value);

            var agent = await _agentRepository.GetByUserIdAsync(userId);
            if (agent == null)
                return BadRequest(new { message = "Agent profile not found" });

            await _applicationService.ApproveApplicationAsync(id, agent.Id);
            return Ok(new { message = "Application approved successfully. Policy has been created." });
        }

        [Authorize(Roles = "Agent")]
        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectApplication(int id, [FromBody] RejectApplicationDto dto)
        {
            int userId = int.Parse(
                User.FindFirst(ClaimTypes.NameIdentifier).Value);

            var agent = await _agentRepository.GetByUserIdAsync(userId);
            if (agent == null)
                return BadRequest(new { message = "Agent profile not found" });

            await _applicationService.RejectApplicationAsync(id, agent.Id, dto.Reason);
            return Ok(new { message = "Application rejected" });
        }

        [Authorize(Roles = "Agent")]
        [HttpPost("{id}/verify")]
        public async Task<IActionResult> VerifyApplication(int id)
        {
            int userId = int.Parse(
                User.FindFirst(ClaimTypes.NameIdentifier).Value);

            var agent = await _agentRepository.GetByUserIdAsync(userId);
            if (agent == null)
                return BadRequest(new { message = "Agent profile not found" });

            try
            {
                var result = await _verificationService.VerifyApplicationAsync(id, agent.Id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Agent")]
        [HttpGet("agent/customers")]
        public async Task<IActionResult> GetAgentCustomers()
        {
            int userId = int.Parse(
                User.FindFirst(ClaimTypes.NameIdentifier).Value);

            var agent = await _agentRepository.GetByUserIdAsync(userId);
            if (agent == null)
                return Ok(new List<object>());

            var applications = await _applicationRepository.GetByAgentIdAsync(agent.Id);
            var policies = await _policyRepository.GetByAgentIdAsync(agent.Id);
            
            // Get unique customers from applications
            var customers = applications
                .GroupBy(app => app.CustomerId)
                .Select(g => g.First())
                .Select(app => new
                {
                    id = app.CustomerId,
                    customerId = app.CustomerId,
                    fullName = app.Customer?.User?.FullName ?? "Unknown",
                    email = app.Customer?.User?.Email ?? "N/A",
                    totalApplications = applications.Count(a => a.CustomerId == app.CustomerId),
                    approvedApplications = applications.Count(a => a.CustomerId == app.CustomerId && a.Status == Insurance.Domain.Enums.ApplicationStatus.Approved),
                    policies = policies
                        .Where(p => p.CustomerId == app.CustomerId)
                        .Select(p => new
                        {
                            id = p.Id,
                            policyNumber = p.PolicyNumber,
                            coverageAmount = p.CoverageAmount,
                            premiumAmount = p.PremiumAmount,
                            startDate = p.StartDate,
                            endDate = p.EndDate,
                            status = p.Status.ToString(),
                            claimsCount = p.Claims?.Count ?? 0,
                            claims = p.Claims?.Select(c => new
                            {
                                id = c.Id,
                                claimedAmount = c.ClaimedAmount,
                                status = c.Status.ToString(),
                                incidentDate = c.IncidentDate
                            }).ToList()
                        }).ToList()
                });

            return Ok(customers);
        }
    }
}
