using Application.DTOs.Payment;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace API.Controllers
{
    [Authorize(Roles = "Customer")]
    [ApiController]
    [Route("api/payments")]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly ICustomerRepository _customerRepository;

        public PaymentsController(
            IPaymentService paymentService,
            ICustomerRepository customerRepository)
        {
            _paymentService = paymentService;
            _customerRepository = customerRepository;
        }

        [HttpPost("pay-policy")]
        public async Task<IActionResult> PayPolicy([FromBody] PaymentRecordDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
                {
                    return Unauthorized("Invalid User ID.");
                }

                var customer = await _customerRepository.GetByUserIdAsync(userId);
                if (customer == null)
                {
                    return NotFound(new { message = "Customer profile not found." });
                }

                int policyId = await _paymentService.PayAndCreatePolicyAsync(customer.Id, dto);
                
                return Ok(new { message = "Payment successful. Policy activated.", policyId = policyId });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while processing your payment.", details = ex.Message });
            }
        }
    }
}
