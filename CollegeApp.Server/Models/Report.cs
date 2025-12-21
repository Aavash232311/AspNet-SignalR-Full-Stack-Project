using System.ComponentModel.DataAnnotations;

namespace CollegeApp.Server.Models
{
    public class Report
    {
        public Guid id { get; set; }
        [Required]
        [MaxLength(500)]
        public string reason { get; set; } = string.Empty;
        public DateTime reportedAt { get; set; } = DateTime.UtcNow;
        public string? reportedByUserId { get; set; } = string.Empty; // UserId of the user who reported from auth0
        public Confession? Confession { get; set; } = null; // required foregin key property according to microsoft
        public Comments? Comments { get; set; } = null!; 
        public bool isVerified { get; set; } = false;

    }
}
