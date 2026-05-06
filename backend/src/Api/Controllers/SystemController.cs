using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/system")]
public sealed class SystemController(IWebHostEnvironment environment) : ControllerBase
{
    [HttpGet("info")]
    public ActionResult<SystemInfoDto> GetInfo()
    {
        var version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "unknown";

        return Ok(new SystemInfoDto(
            ServiceName: "Job Ticket Management System API",
            ApiBasePath: "/api",
            HealthEndpoint: "/health",
            EnvironmentName: environment.EnvironmentName,
            Version: version));
    }
}

public sealed record SystemInfoDto(
    string ServiceName,
    string ApiBasePath,
    string HealthEndpoint,
    string EnvironmentName,
    string Version);
