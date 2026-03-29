using Insurance.Application.DTOs.Claim;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ClaimsController : ControllerBase
    {
        private readonly IClaimsService _claimsService;
        private readonly ICustomerRepository _customerRepository;
        private readonly IClaimsOfficerRepository _officerRepository;

        public ClaimsController(
            IClaimsService claimsService,
            ICustomerRepository customerRepository,
            IClaimsOfficerRepository officerRepository)
        {
            _claimsService = claimsService;
            _customerRepository = customerRepository;
            _officerRepository = officerRepository;
        }

        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> CreateClaim([FromBody] CreateClaimDto dto)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var customer = await _customerRepository.GetByUserIdAsync(userId);
            
            if (customer == null)
                return BadRequest("Customer profile not found. Please create your profile first.");

            var response = await _claimsService.CreateClaimAsync(customer.Id, dto);
            return Ok(response);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetClaimById(int id)
        {
            var response = await _claimsService.GetClaimByIdAsync(id);
            return Ok(response);
        }

        [HttpGet("my-claims")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyClaims()
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var customer = await _customerRepository.GetByUserIdAsync(userId);
            
            if (customer == null)
                return BadRequest("Customer profile not found.");

            var response = await _claimsService.GetClaimsByCustomerIdAsync(customer.Id);
            return Ok(response);
        }

        [HttpGet("officer/assigned")]
        [Authorize(Roles = "ClaimsOfficer")]
        public async Task<IActionResult> GetAssignedClaims()
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var officer = await _officerRepository.GetByUserIdAsync(userId);
            
            if (officer == null)
                return BadRequest("Claims officer profile not found.");

            var response = await _claimsService.GetClaimsByOfficerIdAsync(officer.Id);
            return Ok(response);
        }

        [HttpGet("pending")]
        [Authorize(Roles = "Admin,ClaimsOfficer")]
        public async Task<IActionResult> GetPendingClaims()
        {
            var response = await _claimsService.GetPendingClaimsAsync();
            return Ok(response);
        }

        [HttpPost("assign")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignClaim([FromBody] AssignClaimDto dto)
        {
            await _claimsService.AssignClaimToOfficerAsync(dto.ClaimId, dto.OfficerId);
            return Ok("Claim assigned successfully");
        }

        [HttpPost("review")]
        [Authorize(Roles = "ClaimsOfficer")]
        public async Task<IActionResult> ReviewClaim([FromBody] ReviewClaimDto dto)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var officer = await _officerRepository.GetByUserIdAsync(userId);
            
            if (officer == null)
                return BadRequest("Claims officer profile not found.");

            var response = await _claimsService.ReviewClaimAsync(officer.Id, dto);
            return Ok(response);
        }

        [HttpPost("approve")]
        [Authorize(Roles = "ClaimsOfficer")]
        public async Task<IActionResult> ApproveClaim([FromBody] ApproveClaimDto dto)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var officer = await _officerRepository.GetByUserIdAsync(userId);
            
            if (officer == null)
                return BadRequest("Claims officer profile not found.");

            var response = await _claimsService.ApproveClaimAsync(officer.Id, dto);
            return Ok(response);
        }

        [HttpPost("reject")]
        [Authorize(Roles = "ClaimsOfficer")]
        public async Task<IActionResult> RejectClaim([FromBody] RejectClaimDto dto)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var officer = await _officerRepository.GetByUserIdAsync(userId);
            
            if (officer == null)
                return BadRequest("Claims officer profile not found.");

            var response = await _claimsService.RejectClaimAsync(officer.Id, dto);
            return Ok(response);
        }

        [HttpPost("{id}/accept")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> AcceptClaim(int id)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var customer = await _customerRepository.GetByUserIdAsync(userId);
            
            if (customer == null)
                return BadRequest("Customer profile not found.");

            var response = await _claimsService.AcceptClaimAsync(customer.Id, id);
            return Ok(response);
        }

        [HttpPost("{id}/analyze")]
        [Authorize(Roles = "ClaimsOfficer")]
        public async Task<IActionResult> AnalyzeClaim(int id)
        {
            var response = await _claimsService.AnalyzeClaimAsync(id);
            return Ok(response);
        }
    }

    public class AssignClaimDto
    {
        public int ClaimId { get; set; }
        public int OfficerId { get; set; }
    }
}
