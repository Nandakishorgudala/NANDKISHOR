using Insurance.Domain.Common;

namespace Insurance.Domain.Entities
{
    /// <summary>
    /// Represents a supporting document uploaded by a customer for a policy application.
    /// Files are stored on the server filesystem; this entity holds only metadata.
    /// </summary>
    public class ApplicationDocument : BaseEntity
    {
        // FK back to the application (nullable: document may be uploaded before the application is created)
        public int? PolicyApplicationId { get; private set; }
        public PolicyApplication? PolicyApplication { get; private set; }

        /// <summary>Original filename as uploaded by the customer (e.g. "id-proof.pdf").</summary>
        public string FileName { get; private set; } = string.Empty;

        /// <summary>Server-side GUID-based filename used for storage (prevents collisions / path traversal).</summary>
        public string StoredFileName { get; private set; } = string.Empty;

        /// <summary>MIME type – one of: image/jpeg, image/png, application/pdf.</summary>
        public string ContentType { get; private set; } = string.Empty;

        /// <summary>File size in bytes.</summary>
        public long FileSizeBytes { get; private set; }

        /// <summary>UTC timestamp of upload.</summary>
        public DateTime UploadedAt { get; private set; }

        /// <summary>UserId of the customer who uploaded the document.</summary>
        public int UploadedByUserId { get; private set; }

        private ApplicationDocument() { } // Required for EF Core

        public static ApplicationDocument Create(
            string fileName,
            string storedFileName,
            string contentType,
            long fileSizeBytes,
            int uploadedByUserId,
            int? policyApplicationId = null)
        {
            if (string.IsNullOrWhiteSpace(fileName))
                throw new ArgumentException("File name cannot be empty.", nameof(fileName));
            if (string.IsNullOrWhiteSpace(storedFileName))
                throw new ArgumentException("Stored file name cannot be empty.", nameof(storedFileName));
            if (string.IsNullOrWhiteSpace(contentType))
                throw new ArgumentException("Content type cannot be empty.", nameof(contentType));
            if (fileSizeBytes <= 0)
                throw new ArgumentException("File size must be positive.", nameof(fileSizeBytes));

            var doc = new ApplicationDocument
            {
                PolicyApplicationId = policyApplicationId,
                FileName = fileName,
                StoredFileName = storedFileName,
                ContentType = contentType,
                FileSizeBytes = fileSizeBytes,
                UploadedAt = DateTime.UtcNow,
                UploadedByUserId = uploadedByUserId
            };
            doc.SetCreationTime();
            return doc;
        }

        /// <summary>Links this document to an application after the application is created.</summary>
        public void LinkToApplication(int applicationId)
        {
            PolicyApplicationId = applicationId;
        }
    }
}
