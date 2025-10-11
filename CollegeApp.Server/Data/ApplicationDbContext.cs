using CollegeApp.Server.Models;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Metadata;

namespace CollegeApp.Server.Data
{
    public class ApplicationDbContext: DbContext
    {
        public ApplicationDbContext(DbContextOptions options) : base(options) { }
        public DbSet<Confession> Confessions { get; set; }
        public DbSet<Comments> Comments { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Confession>()
                .HasMany(e => e.Comments)
                .WithOne(e => e.Confessions)
                .HasForeignKey(e => e.ConfessionId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired(false);

            modelBuilder.Entity<Comments>()
                .HasMany(e => e.Replies)
                .WithOne(e => e.Parent)
                .HasForeignKey(e => e.ParentId)
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired(false);
        }
        /* 
        or cases where the navigations, foreign key,
        or required/optional nature of the relationship
        are not discovered by convention, these things can
        be configured explicitly.  -Microsoft
        */
    }
}
// Reading documentation is always important in the era of AI always.
/* 
 By convention, required relationships are configured
to cascade delete; this means that when the principal
is deleted, all of its dependents are deleted as well,
since dependents cannot exist in the database without a principal.
*/