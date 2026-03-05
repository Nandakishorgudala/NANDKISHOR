using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Insurance.Application.DTOs.Policy;
using Insurance.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Application.Services;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PolicyProductController : ControllerBase
    {
        private readonly PolicyProductService _service;

        public PolicyProductController(PolicyProductService service)
        {
            _service = service;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create(CreatePolicyProductRequest dto)
        {
            var result = await _service.CreateAsync(dto);
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _service.GetAllAsync());
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            return Ok(await _service.GetActiveAsync());
        }
    }
}
