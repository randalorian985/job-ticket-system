using System.Text;
using System.Text.Json;
using JobTicketSystem.Api.Auth;
using JobTicketSystem.Api.Pilot;
using JobTicketSystem.Application.Auth;
using JobTicketSystem.Application.JobTickets;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Pilot;
using JobTicketSystem.Application.Purchasing;
using JobTicketSystem.Application.Reporting;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Application.TimeEntries;
using JobTicketSystem.Infrastructure.Persistence;
using JobTicketSystem.Infrastructure.Storage;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHealthChecks();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(JwtSettings.SectionName));
var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>() ?? new JwtSettings();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SigningKey))
        };
        options.EventsType = typeof(ActiveEmployeeTokenValidationEvents);
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole(SystemRoles.Admin));
    options.AddPolicy("ManagerOrAdmin", policy => policy.RequireRole(SystemRoles.Admin, SystemRoles.Manager));
    options.AddPolicy("EmployeeOrAbove", policy => policy.RequireRole(SystemRoles.Admin, SystemRoles.Manager, SystemRoles.Employee));
    options.AddPolicy("AssignedEmployeeOrManager", policy =>
    {
        policy.RequireRole(SystemRoles.Admin, SystemRoles.Manager, SystemRoles.Employee);
        policy.AddRequirements(new AssignedEmployeeOrManagerRequirement());
    });
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserContext, HttpCurrentUserContext>();
builder.Services.AddScoped<ActiveEmployeeTokenValidationEvents>();
builder.Services.AddScoped<IAuthorizationHandler, AssignedEmployeeOrManagerHandler>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUsersService, UsersService>();
builder.Services.AddScoped<ICustomersService, CustomersService>();
builder.Services.AddScoped<IServiceLocationsService, ServiceLocationsService>();
builder.Services.AddScoped<IEquipmentService, EquipmentService>();
builder.Services.AddScoped<IVendorsService, VendorsService>();
builder.Services.AddScoped<IPartCategoriesService, PartCategoriesService>();
builder.Services.AddScoped<IPartsService, PartsService>();
builder.Services.AddScoped<IPurchaseOrdersService, PurchaseOrdersService>();
builder.Services.AddScoped<IJobTicketsService, JobTicketsService>();
builder.Services.AddScoped<IPartsUsageHistoryService, PartsUsageHistoryService>();
var storageRoot = builder.Configuration.GetValue<string>("FileStorage:RootPath")
    ?? Path.Combine(builder.Environment.ContentRootPath, "storage");
builder.Services.AddSingleton(new LocalFileStorageOptions(storageRoot));
builder.Services.AddScoped<IFileStorageProvider, LocalFileStorageProvider>();
builder.Services.AddScoped<IJobTicketFilesService, JobTicketFilesService>();
builder.Services.AddScoped<ITimeEntriesService, TimeEntriesService>();
builder.Services.AddScoped<IReportingService, ReportingService>();
builder.Services.AddScoped<IPilotDemoSeedService, PilotDemoSeedService>();
builder.Services.AddHostedService<PilotDemoSeedHostedService>();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json; charset=utf-8";

        var payload = new
        {
            status = report.Status.ToString(),
            totalDuration = report.TotalDuration,
            entries = report.Entries.ToDictionary(
                entry => entry.Key,
                entry => new
                {
                    status = entry.Value.Status.ToString(),
                    duration = entry.Value.Duration,
                    description = entry.Value.Description
                })
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
    }
});

app.Run();

public partial class Program;
