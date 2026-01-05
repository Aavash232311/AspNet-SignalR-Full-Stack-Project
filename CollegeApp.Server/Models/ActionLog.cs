using System.ComponentModel.DataAnnotations;

namespace CollegeApp.Server.Models
{
    public class ActionLog
    {
        public Guid id { get; set; }
        [Required]
        [MaxLength(100)]
        public string userId { get; set; } = string.Empty;
        [Required]
        [MaxLength(100)]
        public string actionType { get; set; } = string.Empty;
        [MaxLength(500)]
        [Required]
        public string remarks { get; set; } = string.Empty;
        public DateTime timeStampAt { get; set; } = DateTime.UtcNow;

    }
}
