using Application.DTOs.Policy;
using Application.Interfaces;
using Insurance.Domain.Entities;
using Insurance.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Insurance.Infrastructure.Services
{
    /// <summary>
    /// Handles upload validation, persistence to the local filesystem,
    /// and secure serving of supporting documents for policy applications.
    /// </summary>
    public class DocumentService : IDocumentService
    {
        // Permitted MIME types
        private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png",
            "application/pdf"
        };

        private readonly InsuranceDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<DocumentService> _logger;

        private long MaxFileSizeBytes =>
            _configuration.GetValue<long>("FileUploadSettings:MaxFileSizeBytes", 10_485_760);

        private string StoragePath =>
            _configuration.GetValue<string>("FileUploadSettings:StoragePath", "uploads/documents")!;

        private string ClaimStoragePath =>
            _configuration.GetValue<string>("ClaimUploadSettings:StoragePath", "uploads/claims")!;

        private long MaxClaimFileSizeBytes =>
            _configuration.GetValue<long>("ClaimUploadSettings:MaxFileSizeBytes", 10_485_760);

        public DocumentService(
            InsuranceDbContext context,
            IConfiguration configuration,
            ILogger<DocumentService> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        // ==============================
        // UPLOAD
        // ==============================
        public async Task<DocumentUploadResultDto> UploadAsync(
            IFormFile file,
            int uploadedByUserId)
        {
            if (file == null || file.Length == 0)
                throw new InvalidOperationException("No file was provided.");

            if (!AllowedContentTypes.Contains(file.ContentType))
            {
                _logger.LogWarning(
                    "Document upload rejected – unsupported content type '{ContentType}' by user {UserId}.",
                    file.ContentType, uploadedByUserId);
                throw new InvalidOperationException(
                    $"File type '{file.ContentType}' is not allowed. Please upload a JPEG, PNG, or PDF.");
            }

            if (file.Length > MaxFileSizeBytes)
            {
                _logger.LogWarning(
                    "Document upload rejected – file size {Size} bytes exceeds limit {Limit} for user {UserId}.",
                    file.Length, MaxFileSizeBytes, uploadedByUserId);
                throw new InvalidOperationException(
                    $"File size exceeds the maximum allowed size of {MaxFileSizeBytes / 1_048_576} MB.");
            }

            // NO application ownership check: document is uploaded standalone before application exists.

            // Persist file to storage
            var extension = Path.GetExtension(file.FileName);
            var storedFileName = $"{Guid.NewGuid()}{extension}";

            var absoluteStoragePath = Path.IsPathRooted(StoragePath)
                ? StoragePath
                : Path.Combine(Directory.GetCurrentDirectory(), StoragePath);

            Directory.CreateDirectory(absoluteStoragePath);
            var fullPath = Path.Combine(absoluteStoragePath, storedFileName);

            using (var fs = new FileStream(fullPath, FileMode.Create, FileAccess.Write))
            {
                await file.CopyToAsync(fs);
            }

            _logger.LogInformation(
                "Document uploaded: user {UserId}, '{FileName}' → '{StoredFile}' ({Bytes} bytes).",
                uploadedByUserId, file.FileName, storedFileName, file.Length);

            // Save metadata to DB (not yet linked to an application)
            var document = ApplicationDocument.Create(
                fileName: file.FileName,
                storedFileName: storedFileName,
                contentType: file.ContentType,
                fileSizeBytes: file.Length,
                uploadedByUserId: uploadedByUserId);

            _context.ApplicationDocuments.Add(document);
            await _context.SaveChangesAsync();

            return new DocumentUploadResultDto
            {
                DocumentId = document.Id,
                FileName = document.FileName,
                ContentType = document.ContentType,
                FileSizeBytes = document.FileSizeBytes
            };
        }

        public async Task<DocumentUploadResultDto> UploadClaimDocumentAsync(
            IFormFile file,
            int uploadedByUserId)
        {
            if (file == null || file.Length == 0)
                throw new InvalidOperationException("No file was provided.");

            if (!AllowedContentTypes.Contains(file.ContentType))
            {
                throw new InvalidOperationException(
                    $"File type '{file.ContentType}' is not allowed. Please upload a JPEG, PNG, or PDF.");
            }

            if (file.Length > MaxClaimFileSizeBytes)
            {
                throw new InvalidOperationException(
                    $"File size exceeds the maximum allowed size of {MaxClaimFileSizeBytes / 1_048_576} MB.");
            }

            var extension = Path.GetExtension(file.FileName);
            var storedFileName = $"{Guid.NewGuid()}{extension}";

            var absoluteStoragePath = Path.IsPathRooted(ClaimStoragePath)
                ? ClaimStoragePath
                : Path.Combine(Directory.GetCurrentDirectory(), ClaimStoragePath);

            Directory.CreateDirectory(absoluteStoragePath);
            var fullPath = Path.Combine(absoluteStoragePath, storedFileName);

            using (var fs = new FileStream(fullPath, FileMode.Create, FileAccess.Write))
            {
                await file.CopyToAsync(fs);
            }

            var document = new ClaimDocument(
                fileName: file.FileName,
                contentType: file.ContentType,
                filePath: storedFileName, // We store the relative path/filename
                fileSize: file.Length);

            _context.ClaimDocuments.Add(document);
            await _context.SaveChangesAsync();

            return new DocumentUploadResultDto
            {
                DocumentId = document.Id,
                FileName = document.FileName,
                ContentType = document.ContentType,
                FileSizeBytes = document.FileSize
            };
        }

        // ==============================
        // SECURE FILE SERVE
        // ==============================
        public async Task<(Stream stream, string contentType, string fileName)> GetDocumentStreamAsync(
            int documentId,
            int requestingUserId,
            string requestingRole)
        {
            var document = await _context.ApplicationDocuments
                .Include(d => d.PolicyApplication)
                    .ThenInclude(pa => pa.Customer)
                .FirstOrDefaultAsync(d => d.Id == documentId)
                ?? throw new KeyNotFoundException($"Document {documentId} not found.");

            bool allowed = requestingRole switch
            {
                "Admin" => true,
                "Customer" => document.UploadedByUserId == requestingUserId,
                "Agent" => document.PolicyApplicationId.HasValue &&
                           await AgentOwnsApplicationAsync(requestingUserId, document.PolicyApplicationId.Value),
                _ => false
            };

            if (!allowed)
            {
                _logger.LogWarning(
                    "Unauthorized document access attempt: docId={DocId}, userId={UserId}, role={Role}.",
                    documentId, requestingUserId, requestingRole);
                throw new UnauthorizedAccessException("You do not have permission to access this document.");
            }

            var absoluteStoragePath = Path.IsPathRooted(StoragePath)
                ? StoragePath
                : Path.Combine(Directory.GetCurrentDirectory(), StoragePath);

            var fullPath = Path.Combine(absoluteStoragePath, document.StoredFileName);

            if (!File.Exists(fullPath))
                throw new FileNotFoundException($"Document file not found on server: {document.StoredFileName}");

            _logger.LogInformation(
                "Document accessed: docId={DocId}, userId={UserId}, role={Role}.",
                documentId, requestingUserId, requestingRole);

            var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read, bufferSize: 4096, useAsync: true);
            return (stream, document.ContentType, document.FileName);
        }

        public async Task<(Stream stream, string contentType, string fileName)> GetClaimDocumentStreamAsync(
            int documentId,
            int requestingUserId,
            string requestingRole)
        {
            var document = await _context.ClaimDocuments
                .FirstOrDefaultAsync(d => d.Id == documentId)
                ?? throw new KeyNotFoundException($"Claim document {documentId} not found.");

            // Find the claim associated with this document to check authorization
            var claim = await _context.Claims
                .Include(c => c.Policy)
                .FirstOrDefaultAsync(c => c.DocumentId == documentId);

            int customerId = 0;
            if (requestingRole == "Customer")
            {
                customerId = await GetCustomerId(requestingUserId);
            }

            bool allowed = requestingRole switch
            {
                "Admin" => true,
                "ClaimsOfficer" => claim != null && claim.ClaimsOfficerId.HasValue &&
                                   await OfficerOwnsClaimAsync(requestingUserId, claim.Id),
                "Customer" => claim != null && claim.Policy.CustomerId == customerId, 
                _ => false
            };

            if (!allowed)
            {
                _logger.LogWarning("Unauthorized claim document access attempt: docId={DocId}, userId={UserId}, role={Role}.",
                    documentId, requestingUserId, requestingRole);
                throw new UnauthorizedAccessException("You do not have permission to access this document.");
            }

            var absoluteStoragePath = Path.IsPathRooted(ClaimStoragePath)
                ? ClaimStoragePath
                : Path.Combine(Directory.GetCurrentDirectory(), ClaimStoragePath);

            var fullPath = Path.Combine(absoluteStoragePath, document.FilePath);

            if (!File.Exists(fullPath))
                throw new FileNotFoundException($"Claim document file not found on server.");

            var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read, bufferSize: 4096, useAsync: true);
            return (stream, document.ContentType, document.FileName);
        }

        private async Task<bool> OfficerOwnsClaimAsync(int userId, int claimId)
        {
            return await _context.Claims
                .Include(c => c.ClaimsOfficer)
                .AnyAsync(c => c.Id == claimId && c.ClaimsOfficer != null && c.ClaimsOfficer.UserId == userId);
        }

        private async Task<int> GetCustomerId(int userId)
        {
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
            return customer?.Id ?? 0;
        }

        // ==============================
        // METADATA
        // ==============================
        public async Task<ApplicationDocumentDto?> GetDocumentMetaAsync(int documentId)
        {
            var document = await _context.ApplicationDocuments
                .FirstOrDefaultAsync(d => d.Id == documentId);

            if (document == null) return null;

            return new ApplicationDocumentDto
            {
                DocumentId = document.Id,
                FileName = document.FileName,
                ContentType = document.ContentType,
                FileSizeBytes = document.FileSizeBytes,
                UploadedAt = document.UploadedAt
            };
        }

        // ==============================
        // PRIVATE HELPERS
        // ==============================
        private async Task<bool> AgentOwnsApplicationAsync(int userId, int applicationId)
        {
            return await _context.PolicyApplications
                .Include(pa => pa.Agent)
                    .ThenInclude(a => a.User)
                .AnyAsync(pa =>
                    pa.Id == applicationId &&
                    pa.Agent != null &&
                    pa.Agent.UserId == userId);
        }
    }
}
