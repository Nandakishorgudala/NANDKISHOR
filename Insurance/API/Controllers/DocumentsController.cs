using Application.DTOs.Policy;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Insurance.Application.Interfaces;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentsController : ControllerBase
    {
        private readonly IDocumentService _documentService;
        private readonly ICustomerRepository _customerRepository;
        private readonly ILogger<DocumentsController> _logger;

        public DocumentsController(
            IDocumentService documentService,
            ICustomerRepository customerRepository,
            ILogger<DocumentsController> logger)
        {
            _documentService = documentService;
            _customerRepository = customerRepository;
            _logger = logger;
        }

        /// <summary>
        /// Upload a supporting document (JPEG, PNG, PDF; max 10 MB) before submitting an application.
        /// Returns a documentId to include in the application submission body.
        /// </summary>
        [Authorize(Roles = "Customer")]
        [HttpPost("upload")]
        [RequestSizeLimit(52_428_800)]
        [RequestFormLimits(MultipartBodyLengthLimit = 52_428_800)]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "No file was provided." });

                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

                var result = await _documentService.UploadAsync(file, userId);

                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning("Document upload validation failed for user {UserId}: {Message}",
                    User.FindFirst(ClaimTypes.NameIdentifier)?.Value, ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during document upload.");
                return StatusCode(500, new { message = "An unexpected error occurred." });
            }
        }

        /// <summary>
        /// Upload a supporting document for a claim.
        /// </summary>
        [Authorize(Roles = "Customer")]
        [HttpPost("claim/upload")]
        public async Task<IActionResult> UploadClaimDocument(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "No file was provided." });

                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var result = await _documentService.UploadClaimDocumentAsync(file, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Securely stream a document file.
        /// Access restricted to: the uploading customer, the assigned agent, or any Admin.
        /// </summary>
        [Authorize]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetDocument(int id)
        {
            try
            {
                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                string role = User.FindFirst(ClaimTypes.Role)?.Value
                           ?? User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value
                           ?? string.Empty;

                var (stream, contentType, fileName) = await _documentService.GetDocumentStreamAsync(id, userId, role);
                return File(stream, contentType, fileName);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (FileNotFoundException)
            {
                return NotFound(new { message = "Document file not found on server." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error retrieving document {DocumentId}.", id);
                return StatusCode(500, new { message = "An unexpected error occurred." });
            }
        }

        /// <summary>
        /// Securely stream a claim document file.
        /// </summary>
        [Authorize]
        [HttpGet("claim/{id:int}")]
        public async Task<IActionResult> GetClaimDocument(int id)
        {
            try
            {
                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                string role = User.FindFirst(ClaimTypes.Role)?.Value
                           ?? User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value
                           ?? string.Empty;

                var (stream, contentType, fileName) = await _documentService.GetClaimDocumentStreamAsync(id, userId, role);
                
                // Ensure browser tries to preview instead of download immediately
                Response.Headers.Append("Content-Disposition", $"inline; filename=\"{fileName}\"");
                
                return File(stream, contentType);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (FileNotFoundException)
            {
                return NotFound(new { message = "Claim document file not found on server." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error retrieving claim document {DocumentId}.", id);
                return StatusCode(500, new { message = "An unexpected error occurred." });
            }
        }

        /// <summary>
        /// Get metadata for a document without streaming its contents.
        /// </summary>
        [Authorize]
        [HttpGet("{id:int}/meta")]
        public async Task<IActionResult> GetDocumentMeta(int id)
        {
            var meta = await _documentService.GetDocumentMetaAsync(id);
            if (meta == null)
                return NotFound(new { message = $"Document {id} not found." });

            return Ok(meta);
        }
    }
}
