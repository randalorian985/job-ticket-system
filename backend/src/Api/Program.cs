using JobTicketSystem.Infrastructure.Persistence;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.JobTickets;
using JobTicketSystem.Application.TimeEntries;
using JobTicketSystem.Application.Reporting;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHealthChecks();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<ICustomersService, CustomersService>();
builder.Services.AddScoped<IServiceLocationsService, ServiceLocationsService>();
builder.Services.AddScoped<IEquipmentService, EquipmentService>();
builder.Services.AddScoped<IVendorsService, VendorsService>();
builder.Services.AddScoped<IPartCategoriesService, PartCategoriesService>();
builder.Services.AddScoped<IPartsService, PartsService>();
builder.Services.AddScoped<IJobTicketsService, JobTicketsService>();
builder.Services.AddScoped<ITimeEntriesService, TimeEntriesService>();
builder.Services.AddScoped<IReportingService, ReportingService>();

var app = builder.Build();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
