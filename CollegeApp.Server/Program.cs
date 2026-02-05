using CollegeApp.Server.Service;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using CollegeApp.Server.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
/* Connecting database server, Local SQL  */
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));


/* Auth 0 configuration */
var domain = $"https://{builder.Configuration["Auth0:Domain"]}/";
builder.AddServiceDefaults();

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireClaim("roles/roles", "Superuser"));
});


builder.Services.AddSingleton<IAuthorizationHandler, HasScopeHandler>();
builder.Services.AddSingleton<Helper>();
builder.Services.AddHttpClient<Auth0>(); // for custon auth0 service dependency injection
builder.Services.AddAutoMapper(typeof(Program)); 

builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicyReact", builder =>
    {
        builder.WithOrigins("https://localhost:49986")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

// for authentication with singalR

builder.Services.AddAuthentication(options =>
{
    // Identity made Cookie authentication the default.
    // However, we want JWT Bearer Auth to be the default.
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    // Configure the Authority to the expected value for
    // the authentication provider. This ensures the token
    // is appropriately validated.
    options.Authority = domain;
    options.Audience = builder.Configuration["Auth0:Audience"];
    options.TokenValidationParameters = new TokenValidationParameters
    {
        NameClaimType = "sub",
    };

    // We have to hook the OnMessageReceived event in order to
    // allow the JWT authentication handler to read the access
    // token from the query string when a WebSocket or 
    // Server-Sent Events request comes in.

    // Sending the access token in the query string is required when using WebSockets or ServerSentEvents
    // due to a limitation in Browser APIs. We restrict it to only calls to the
    // SignalR hub in this code.
    // See https://docs.microsoft.com/aspnet/core/signalr/security#access-token-logging
    // for more information about security considerations when using
    // the query string to transmit the access token.
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];

            // If the request is for our hub...
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) &&
                (path.StartsWithSegments("/notificationHub")))
            {
                // Read the token out of the query string
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();
/* Image will be saved in a folder, so configring directory */
app.MapHub<ChatHub>("/chatHub");
app.MapHub<NotificationHub>("/notificationHub");


app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), "images")),
    RequestPath = "/images"
});

app.MapDefaultEndpoints();

app.UseDefaultFiles();
app.MapStaticAssets();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.UseCors("CorsPolicyReact");
app.MapFallbackToFile("/index.html");

app.Run();
