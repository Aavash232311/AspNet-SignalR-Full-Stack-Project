using CollegeApp.Server.Data;
using CollegeApp.Server.Models;
using CollegeApp.Server.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CollegeApp.Server.Controllers
{
    [Route("[controller]")]
    [ApiController]
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
    }
}
