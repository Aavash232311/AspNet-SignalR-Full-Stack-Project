using CollegeApp.Server.Data;
using CollegeApp.Server.Service;
using Microsoft.AspNetCore.Mvc;
using RestSharp;
using System.Runtime.CompilerServices;
using System.Text.Json;

namespace CollegeApp.Server.Controllers
{
    /* auth0 returns something like this.. read docs for more */
    public class ExpectedSerilazationResponse
    {
        public string access_token { get; set; } = string.Empty;
        public string id_token { get; set; } = string.Empty;
        public double expires_in { get; set; }
        public string scope { get; set; } = string.Empty;
        public string token_type { get; set; } = string.Empty;
        public string refresh_token { get; set; } = string.Empty;
    }

    [Route("[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        public ApplicationDbContext context;
        public IConfiguration configuration;
        private readonly Auth0 _userManager;

        public AuthController(ApplicationDbContext context, IConfiguration config, Auth0 userManager)
        {
            this.context = context;
            configuration = config;
            this._userManager = userManager;
        }

        [Route("login")]
        [HttpPost]
        public async Task<IActionResult> Login(string email, string password)
        {
            var client = new RestClient();
            var auth0Settings = configuration.GetSection("Auth0");
            string url = $"https://{auth0Settings["Domain"]}/oauth/token";
            var request = new RestRequest(url, Method.Post);
            request.AddHeader("Content-Type", "application/json");
            request.AddJsonBody(new
            {
                grant_type = "http://auth0.com/oauth/grant-type/password-realm",
                username = email,
                password = password,
                client_id = auth0Settings["ClientId"],
                client_secret = configuration["Auth0:ClientSecret"], // secret manager
                audience = auth0Settings["Audience"],
                scope = "openid profile email offline_access",
                realm = "Username-Password-Authentication"
            });
            var response = await client.ExecuteAsync(request);
            ExpectedSerilazationResponse data = JsonSerializer.Deserialize<ExpectedSerilazationResponse>(response.Content!)!;
            if (!(response.IsSuccessful)) return new JsonResult(Unauthorized(new {errorString = response.Content, passedUsername = email, passwedPassword = password}));
            /* For testing lets not poke other server, and simple ourself make a false token */
            //var data = new {
            //    access_token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJGNUdtTmJLZjBIdUVERE9ZTXdHdSJ9.eyJpc3MiOiJodHRwczovL2Rldi0zZ2ZvNDJpZC51cy5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8Njc5MGVmYmI0ZDNkODdhYWJjYzg5ODRkIiwiYXVkIjpbImh0dHBzOi8vbG9jYWxob3N0OjQ5OTg2L2FwaSIsImh0dHBzOi8vZGV2LTNnZm80MmlkLnVzLmF1dGgwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE3Mzc3MTExNDksImV4cCI6MTczNzc5NzU0OSwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCIsImd0eSI6InBhc3N3b3JkIiwiYXpwIjoiaWF1dlF5Z3NuaUM5UE1SOU1idElDUGMxdmc5Q3kxUVciLCJwZXJtaXNzaW9ucyI6W119.wbUBVcl2q4gn_5wO0lFMI0cjQuq25vFR7LUFELNclzKzzcB6-CD5EDOt0KHiB99OPblxiAP0wyJnB2kc4pg0Y3GRwcyEKcRtQjBuj9D0icm8g7CagJH40CnXmL7t4Dx_BStN1K_Nt6aIzut25QqDTDUy2TYUhbhuK7C5r48vfiQCkQ-azTDUC5jx0BbWvyymlWHozweidsfvaYDHEDc_X3ur5B1T7JJDKawHjXbnoIS6fiRl7K9u9DZHRXQqszdYZcaIo_iEUYCrt-n556olVWx-QJrOkkGSk4Ofzbf90gj9T9-0hm9RDgrSFMfTCMVbYnGryHXF3b27NiNOB-p-jw",
            //    id_token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJGNUdtTmJLZjBIdUVERE9ZTXdHdSJ9.eyJuaWNrbmFtZSI6ImFhdmFzaDIwMDUiLCJuYW1lIjoiYWF2YXNoMjAwNUBnbWFpbC5jb20iLCJwaWN0dXJlIjoiaHR0cHM6Ly9zLmdyYXZhdGFyLmNvbS9hdmF0YXIvNTFhZWZlOGU3ZjZhYTcyNjhjYmJiYjE0NGRmNmM5OGQ_cz00ODAmcj1wZyZkPWh0dHBzJTNBJTJGJTJGY2RuLmF1dGgwLmNvbSUyRmF2YXRhcnMlMkZhYS5wbmciLCJ1cGRhdGVkX2F0IjoiMjAyNS0wMS0yNFQwOTozMjoyOS4wNjNaIiwiZW1haWwiOiJhYXZhc2gyMDA1QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczovL2Rldi0zZ2ZvNDJpZC51cy5hdXRoMC5jb20vIiwiYXVkIjoiaWF1dlF5Z3NuaUM5UE1SOU1idElDUGMxdmc5Q3kxUVciLCJpYXQiOjE3Mzc3MTExNDksImV4cCI6MTczNzc0NzE0OSwic3ViIjoiYXV0aDB8Njc5MGVmYmI0ZDNkODdhYWJjYzg5ODRkIn0.IcXfUSnr91HESCnGhwZjJc1tKrrgXNnmgbvqvUgkbszDUMQU5dNyHpKLNZL2rZDzv7FefJw5ouOZ2girneX2R6i2Npi1nRluahxZ2tgsOPaHubakpZ2M2jFX-RVZw801PiNZixI10GbTovl5vhtJrBuKP8yBYAHdG4q5e-4IlR3Jh6WgDToeVRJdUIgg-crYK1cALQdM2zd2cFDLg8vMdIT2r0cQ1YEu4n8kBYj-3kU49JVEMujnHcObgcBd6qO5yc8UHVL2vFjk5jrgy_K9kUp7mGGEVGtShPFYpMqxiewvNIyVDIvL_xUvHiF47gqT6TqTUVhgcWRQF8iWKXI2oA",
            //    scope = "openid profile email",
            //    expires_in = 86400,
            //    token_type = "Bearer"
            //};
            // We need to store tokens in http only cookie, and we can send id token as a json response
            return new JsonResult(new { status = 200, data = new { data.id_token, data.scope, data.expires_in, data.token_type, data.access_token, data.refresh_token} });
        }

        [Route("refresh-token")]
        [HttpPost]
        public async Task<IActionResult> RefreshToken(string validRerfeshToken)
        {
            if (validRerfeshToken == null) return new JsonResult(Unauthorized());
            try
            {
                var refresh = await _userManager.RefreshToken(validRerfeshToken);
                return new JsonResult(Ok(refresh)); // that would refresh the token as string.
            }catch (Exception ex)
            {
                return new JsonResult(Unauthorized(ex.Message));
            }
        }

    }
}
