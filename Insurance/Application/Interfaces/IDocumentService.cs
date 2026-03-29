using Application.DTOs.Policy;
using Microsoft.AspNetCore.Http;

namespace Application.Interfaces
{
    /// <summary>
    /// Service for uploading and securely serving supporting documents
    /// associated with policy applications.
    /// </summary>
    public interface IDocumentService
    {
        /// <summary>
        /// Validates and persists a document file to the local filesystem.
        /// Saves metadata to the database and returns the new document's ID.
        /// The returned documentId should be included when submitting the application.
        /// </summary>
        /// <param name="file">The uploaded file (IFormFile).</param>
        /// <param name="uploadedByUserId">The user ID of the uploading customer.</param>
        Task<DocumentUploadResultDto> UploadAsync(
            IFormFile file,
            int uploadedByUserId);

        Task<DocumentUploadResultDto> UploadClaimDocumentAsync(
            IFormFile file, 
            int uploadedByUserId);

        /// <summary>
        /// Returns the file stream, content type, and original filename for download.
        /// Enforces ownership/role-based access control.
        /// </summary>
        /// <param name="documentId">DB ID of the document.</param>
        /// <param name="requestingUserId">User ID making the request.</param>
        /// <param name="requestingRole">Role of the requesting user (Customer, Agent, Admin).</param>
        Task<(Stream stream, string contentType, string fileName)> GetDocumentStreamAsync(
            int documentId,
            int requestingUserId,
            string requestingRole);

        Task<(Stream stream, string contentType, string fileName)> GetClaimDocumentStreamAsync(
            int documentId,
            int requestingUserId,
            string requestingRole);

        /// <summary>
        /// Returns document metadata without streaming the file.
        /// </summary>
        Task<ApplicationDocumentDto?> GetDocumentMetaAsync(int documentId);
    }
}
