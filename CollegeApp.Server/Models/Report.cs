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
        public Guid? Confession { get; set; } = null; // required foreign key property according to Microsoft
        public Guid? Comments { get; set; } = null;
        public bool isVerified { get; set; } = false;
        // It might be reported comment, or confession, we still need to trak it's parent
        public Guid? parentConfessionId { get; set; }
        public bool isDeleted { get; set; } = false;
        /* Okay now what we want to do is, make this thing as a parent table, 
         * and one table can have multiple reports. It will make us easy to account
         for the frequency of items! */
        // let's make a sperate table with record of reported items!, not one to may self referencing, its better for production
        public Report? ParentReport { get; set; } = null;
        public Guid? ParentReportForeginKeyId { get; set; } 
    }
}
