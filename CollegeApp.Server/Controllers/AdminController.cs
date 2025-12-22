using CollegeApp.Server.Data;
using CollegeApp.Server.Models;
using CollegeApp.Server.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CollegeApp.Server.Controllers
{
    public class UserInfo
    {
        public Guid associatedTable { get; set; }
        public object userInfo { get; set; } = new object();
    }

    [Route("[controller]")]
    [ApiController]
    [AllowAnonymous]
    [Authorize(Policy = "AdminOnly")]
    public class AdminController : ControllerBase
    {
        public readonly ApplicationDbContext _context;
        public readonly Auth0 _userManager;
        public readonly Helper _helper;
        public AdminController(ApplicationDbContext context, Auth0 userManager, Helper helper)
        {
            this._context = context;
            this._userManager = userManager;
            this._helper = helper;
        }

        [Route("get-confessions")]
        [HttpGet]
        [AllowAnonymous] // This can be used as a public as well as long as it's just get
        public async Task<IActionResult> GetConfession(int page)
        {
            if (page < 1)
            {
                return new JsonResult(BadRequest(new { error = "Page number must be greater than 0" }));
            }
            var confessions = await _context.Confessions.OrderByDescending(p => p.Added).ToListAsync();

            var pagination = _helper.NormalPagination(10, page, confessions.AsQueryable());
            return new JsonResult(Ok(pagination));
        }

        [Route("recent-threads")]
        [HttpGet]
        [AllowAnonymous] // the api is there in confession but works for particular confession only
        public async Task<IActionResult> GetThreads(int page, int pageSize)
        {
            if (page < 1)
            {
                return new JsonResult(BadRequest(new { error = "Page number must be greater than 0" }));
            }

            var threads = await _context.Comments.OrderByDescending(p => p.Added).ToListAsync();
            var pagination = _helper.NormalPagination(pageSize, page, threads.AsQueryable());
            return new JsonResult(Ok(pagination));
        }

        [Route("get-clientinfo")]
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetUserInfo(string auth0Id)
        {
            if (string.IsNullOrEmpty(auth0Id))
            {
                return new JsonResult(BadRequest(new { error = "Id is required" }));
            }

            var response = await _userManager.GetUserInfo(auth0Id);

            return new JsonResult(Ok(response));

        }

        [Route("get-admin-report")]
        [HttpGet]
        public async Task<IActionResult> GetAdminReport(int page)
        {
            if (page < 1)
            {
                return new JsonResult(BadRequest(new { error = "Page number must be greater than 0" }));
            }

            var reports = await _context.Reports.OrderByDescending(p => p.reportedAt).ToListAsync();

            var pagination = _helper.NormalPagination(10, page, reports.AsQueryable());

            return new JsonResult(Ok(pagination));
        }

        [Route("report-verified")]
        [HttpPost]
        public async Task<IActionResult> ReportVerified(Guid reportId, bool status)
        {
            var report = await _context.Reports.FirstOrDefaultAsync(r => r.id == reportId);
            if (report == null)
            {
                return new JsonResult(NotFound(new { error = "Report not found", reportId, status }));
            }
            report.isVerified = status;
            _context.Reports.Update(report);
            await _context.SaveChangesAsync();
            return new JsonResult(Ok(new { message = "Report marked as verified", status }));
        }

        [Route("delete-comment-conf")]
        [HttpDelete]
        public async Task<IActionResult> DeleteComment(string type, Guid id, Guid recordId, bool status)
        {
            /* It's not a casade delete or something, from which if one parent is deleted
             * all the other will be deleted. We just want to hide the comment */

            // we need to keep the record in the record model itself,
            // then why are we keeping the boolean in comment and confession, because we want the api from backend to exclude the comment text if it's deleted
            var getRecords = await _context.Reports.FirstOrDefaultAsync(r => r.id == recordId);
            if (getRecords == null)
            {
                return new JsonResult(NotFound(new { error = "Record not found", recordId }));
            }

            if (type == "confession")
            {
                var confession = await _context.Confessions.FirstOrDefaultAsync(c => c.Id == id);
                if (confession == null)
                {
                    return new JsonResult(NotFound(new { error = "Confession not found", id }));
                }
                getRecords.isDeleted = status; // since we want to toggle that, admin might accidently delete and want to un-delete
                confession.deleted = status;
                await _context.SaveChangesAsync();
            }
            else if (type == "comment")
            {
                var comment = await _context.Comments.FirstOrDefaultAsync(c => c.Id == id);
                if (comment == null)
                {
                    return new JsonResult(NotFound(new { error = "Comment not found", id }));
                }
                getRecords.isDeleted = status;
                comment.deleted = status;
                await _context.SaveChangesAsync();
            }

            // we need to update all the record with same report as well!
            await _context.Reports
            .Where(x => x.Confession == getRecords.Confession &&
                x.Comments == getRecords.Comments &&
                x.parentConfessionId == getRecords.parentConfessionId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(r => r.isDeleted, status)  
            );
            await _context.SaveChangesAsync();
            // The list of record we get from this thing will be same for all the records associated with whatever


            // After that what we want to do is, restrict that message doing to api from the backend
            return new JsonResult(Ok());
        }
    }
}
