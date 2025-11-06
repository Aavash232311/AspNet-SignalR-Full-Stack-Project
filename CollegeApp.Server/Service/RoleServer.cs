using System.Text.Json;
using System.Text;
using System.Net.Http.Headers;

namespace CollegeApp.Server.Service
{
    public class Auth0
    {
        public readonly IConfiguration _configuration;
        public readonly HttpClient _httpClient;
        private dynamic _managementApiToken;
        /* Just be careful with the client secret on the frontend,
         * Here just some http request to the auth0 server.
         * https://auth0.com/docs/api/management/v2 */
        public Auth0(IConfiguration config, HttpClient httpClient)
        {
            this._configuration = config;
            this._httpClient = httpClient;
        }

        private async Task<string> GetManagementApiToken()
        {
            if (!string.IsNullOrEmpty(_managementApiToken)) return _managementApiToken;

            var domain = _configuration["Auth0:Domain"];
            var clientId = _configuration["Auth0:ClientId"];
            var clientSecret = _configuration["Auth0:ClientSecret"];
            var audience = _configuration["Auth0:ManagementApiAudience"];

            var requestBody = new
            {
                client_id = clientId,
                client_secret = clientSecret,
                audience = audience,
                grant_type = "client_credentials"
            };

            var requestContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"https://{domain}/oauth/token", requestContent);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception($"Failed to get Auth0 token: {responseContent}");

            var json = JsonSerializer.Deserialize<JsonElement>(responseContent);
            var token = json.GetProperty("access_token").GetString();
            _managementApiToken = token;
            return token;
        }

        public async Task<object> AssignRoleToUserAsync(string UserId, string RoleId)
        {
            var token = await GetManagementApiToken();
            var domain = _configuration["Auth0:Domain"];
            var request = new HttpRequestMessage(HttpMethod.Post, $"https://{domain}/api/v2/users/{UserId}/roles")
            {
                Content = new StringContent(JsonSerializer.Serialize(new { roles = new[] { RoleId } }), Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.SendAsync(request);
            return response;
        }

        // we need to grab the user info from auth0, this involves using "client secret" so calling from backend
        public async Task<JsonElement> GetUserInfo(string clientId)
        {
            var domain = _configuration["Auth0:Domain"];
            var clientSecret = _configuration["Auth0:ClientSecret"];
            var audience = _configuration["Auth0:ManagementApiAudience"];

            var request = new HttpRequestMessage(HttpMethod.Get, $"https://{domain}/api/v2/users/{Uri.EscapeUriString(clientId)}");
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var getManagementAPIToken = await GetManagementApiToken(); // this is another request call for management api token
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", getManagementAPIToken);

            var response = await _httpClient.SendAsync(request);

            response.EnsureSuccessStatusCode();
            return JsonSerializer.Deserialize<JsonElement>(await response.Content.ReadAsStringAsync());
        }

        public async Task<string> RefreshToken(string refreshToken)
        {
            var domain = _configuration["Auth0:Domain"];
            var clientId = _configuration["Auth0:ClientId"];
            var clientSecret = _configuration["Auth0:ClientSecret"];

            var requestBody = new
            {
                client_id = clientId,
                client_secret = clientSecret,
                grant_type = "refresh_token",
                refresh_token = refreshToken
            };
            var requestContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"https://{domain}/oauth/token", requestContent);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception($"Failed to refresh token: {responseContent} Try reloggin in.");

            var json = JsonSerializer.Deserialize<JsonElement>(responseContent);
            return json.GetProperty("access_token").GetString();
        }
    }
}
