using System.Text;
using JobTicketSystem.Api.Auth;
using JobTicketSystem.Application.Auth;
using JobTicketSystem.Application.JobTickets;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Reporting;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Application.TimeEntries;
using JobTicketSystem.Infrastructure.Persistence;
using JobTicketSystem.Infrastructure.Storage;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
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
builder.Services.AddScoped<IJobTicketsService, JobTicketsService>();
var storageRoot = builder.Configuration.GetValue<string>("FileStorage:RootPath")
    ?? Path.Combine(builder.Environment.ContentRootPath, "storage");
builder.Services.AddSingleton(new LocalFileStorageOptions(storageRoot));
builder.Services.AddScoped<IFileStorageProvider, LocalFileStorageProvider>();
builder.Services.AddScoped<IJobTicketFilesService, JobTicketFilesService>();
builder.Services.AddScoped<ITimeEntriesService, TimeEntriesService>();
builder.Services.AddScoped<IReportingService, ReportingService>();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();

public partial class Program;
