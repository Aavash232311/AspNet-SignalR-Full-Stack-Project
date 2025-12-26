using CollegeApp.Server.Data;
using CollegeApp.Server.Models;
using CollegeApp.Server.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using System.ComponentModel.DataAnnotations;

namespace CollegeApp.Server.Controllers
{
    public class UserInfo
    {
        public Guid associatedTable { get; set; }
        public object userInfo { get; set; } = new object();
    }

    public class ExtendedReportTable : Report
    {
        public int frequency { get; set; } = 0;
    }

    public class FrequencyReport
    {
        public int frequency { get; set; } = 0;
        public Guid refId { get; set; } = Guid.NewGuid();
    }

    public class PaginationResult<T>
    {
        public int totalPages { get; set; }
        public List<T> data { get; set; }
        public int totalObjects { get; set; }
    }
    public class ReportData
    {
        public string x { get; set; } = string.Empty; // this is going to be the date
        public string y { get; set; } = string.Empty;
        public string label { get; set; } = string.Empty;
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
        public async Task<IActionResult> GetConfession([FromQuery, Range(1, int.MaxValue)] int page = 1)
        {

            var confessions = _context.Confessions.OrderByDescending(p => p.Added);

            var pagination = _helper.NormalPagination(10, page, confessions);
            return new JsonResult(Ok(pagination));
        }

        [Route("recent-threads")]
        [HttpGet]
        [AllowAnonymous] // the api is there in confession but works for particular confession only
        public IActionResult GetThreads
            ([FromQuery, Range(1, int.MaxValue)] int page = 1,
             [FromQuery, Range(1, int.MaxValue)] int pageSize = 10) // the default pageSize = 10
        {
            if (page < 1)
            {
                return new JsonResult(BadRequest(new { error = "Page number must be greater than 0" }));
            }
            // ToListAsync to execute the query first before pagination
            var threads = _context.Comments.OrderByDescending(p => p.Added);
            var pagination = _helper.NormalPagination(pageSize, page, threads);
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
        public async Task<IActionResult> GetAdminReport([FromQuery, Range(1, int.MaxValue)] int page = 1, [FromQuery] string status = null) // the default status = null
        {
            var reports = status == "deleted" ?
                    _context.Reports.Where(p => p.isDeleted == true) :
                    status == "active" ? _context.Reports.Where(p => p.isDeleted == false) :
                    _context.Reports.OrderByDescending(p => p.reportedAt);

            var pagination = _helper.NormalPagination(10, page, reports);
            var slicedReports = pagination.data;
            List<FrequencyReport> frequencyReports = new List<FrequencyReport>();

            foreach (var item in pagination.data)
            {
                var confessionId = item.Confession;
                var commentId = item.Comments;

                var freq = _context.Reports.Count(
                    c => c.Comments == commentId &&
                    c.Confession == confessionId
                );
                frequencyReports.Add(new FrequencyReport
                {
                    frequency = freq,
                    refId = item.id
                });
            }

            return new JsonResult(Ok(new
            {
                pagination,
                frequencyReports
            }));
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

        /* Data of the report frequency, we will fix it to report log of past one year,
         * I love blending things that I learned together, so this one came from data science course that I took.*/
        [Route("Report-logs")]
        [HttpGet]
        public async Task<IActionResult> ReportLog(Guid reportId)
        {
            if (reportId == Guid.Empty || reportId == null)
            {
                return new JsonResult(BadRequest(new { error = "Report ID cannot be empty", reportId }));
            }

            // if they are not null then we will find similar type of report
            var report = await _context.Reports.FirstOrDefaultAsync(r => r.id == reportId);
            if (report == null)
            {
                return new JsonResult(NotFound(new { error = "Report not found", reportId }));
            }

            var similarReports = _context.Reports.Where(r =>
                (r.Confession == report.Confession) &&
                (r.Comments == report.Comments) && 
                r.reportedAt >= DateTime.UtcNow.AddYears(-1)
            ).Select(item => new ReportData()
            {
                x = item.reportedAt.ToString("yyyy-MM-dd"),
                y = "1", // each report counts as one,
                label = item.reason
            }).ToList(); // then we will have the list of similar reports

            return new JsonResult(Ok(similarReports));
        }

        [Route("get-confession-admin")]
        [HttpGet]
        public async Task<IActionResult> GetConfesionAdmin([FromQuery, Range(1, int.MaxValue)] int page = 1)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            /* In the default model I have addded a JsonIgnore due to safety reasons, 
             * Now what I want to do is, exempt that case for this particular API. */
            var getConfession = _context.Confessions
                .Select(obj => new
                {
                    obj.Id,
                    obj.Topic,
                    obj.Description,
                    obj.Added,
                    obj.deleted,
                    obj.UserId,
                    obj.LastModified
                })
                .OrderByDescending(c => c.Added);
            var pagination = _helper.NormalPagination(10, page, getConfession);
            return new JsonResult(Ok(pagination));
        }

        [Route("Search-confession-by-query")]
        [HttpGet]
        public async Task<IActionResult> SearchConfessions(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return new JsonResult(BadRequest("Search query cannot be empty."));
            }

            //  base quyery
            var confessionsQuery = _context.Confessions.AsQueryable();

            // we might need to check for a guid search
            if (Guid.TryParse(query, out Guid guidId))
            {
                // if it's a GUID, search by exact ID match
                confessionsQuery = confessionsQuery.Where(x => x.Id == guidId);
            }
            else
            {
                // search might be through anything
                confessionsQuery = confessionsQuery.Where(x =>
                    x.Topic.Contains(query) ||
                    x.Description.Contains(query) || x.UserId.Contains(query));
            }

            // There might be a case when application scales so large that we might need to paginate the search result,
            // Although, I am aware of that I will leave it for now as it is not that necessary at the moment.

            var results = await confessionsQuery.ToListAsync(); // executing the query  

            if (results == null || !results.Any())
            {
                return new JsonResult(NotFound("No confessions matched your search."));
            }

            return new JsonResult(Ok(results));
        }

        [Route("search-thread-by-query")]
        [HttpGet]
        public async Task<IActionResult> SearchThreadByQuery(string query)
        {
            // same as above api
            if (string.IsNullOrWhiteSpace(query))
            {
                return new JsonResult(BadRequest("Search query cannot be empty."));
            }
            var commentsQuery = _context.Comments.AsQueryable();
            // we only have two cases in this API
            if (Guid.TryParse(query, out Guid guidId))
            {
                commentsQuery = commentsQuery.Where(x => x.Id == guidId);
            }
            else
            {
                commentsQuery = commentsQuery.Where(x =>
                    x.comments.Contains(query) || x.UserId.Contains(query)); // search only in comments
            }
            var results = await commentsQuery.ToListAsync(); // execute this one
            if (results == null || !results.Any())
            {
                return new JsonResult(NotFound("No comments matched your search."));
            }
            return new JsonResult(Ok(results));
        }

    }
}

