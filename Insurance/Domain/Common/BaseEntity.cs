using System;

namespace Insurance.Domain.Common
{
    /// <summary>
    /// Represents the base class for all domain entities.
    /// Provides common auditing fields.
    /// </summary>
    public abstract class BaseEntity
    {
        /// <summary>
        /// Primary key identifier.
        /// </summary>
        public int Id { get; protected set; }

        /// <summary>
        /// Date and time when the entity was created (UTC).
        /// </summary>
        public DateTime CreatedAt { get; protected set; }

        /// <summary>
        /// Date and time when the entity was last modified (UTC).
        /// Nullable because it may not be updated yet.
        /// </summary>
        public DateTime? UpdatedAt { get; protected set; }

        /// <summary>
        /// Sets the creation timestamp.
        /// Should be called inside entity constructor.
        /// </summary>
        public void SetCreationTime()
        {
            CreatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Sets the modification timestamp.
        /// Should be called inside update methods.
        /// </summary>
        public void SetUpdatedTime()
        {
            UpdatedAt = DateTime.UtcNow;
        }
    }
}