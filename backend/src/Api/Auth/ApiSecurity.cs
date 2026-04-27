using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using JobTicketSystem.Application.Auth;
using JobTicketSystem.Application.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace JobTicketSystem.Api.Auth;

public sealed class JwtSettings
{
    public const string SectionName = "Jwt";
    public string Issuer { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
    public string SigningKey { get; init; } = string.Empty;
    public int ExpirationMinutes { get; init; } = 120;
}

public interface IJwtTokenService
{
    AuthLoginResponseDto CreateToken(AuthLoginResultDto login);
}

public sealed class JwtTokenService(IOptions<JwtSettings> options) : IJwtTokenService
{
    private readonly JwtSettings _settings = options.Value;

    public AuthLoginResponseDto CreateToken(AuthLoginResultDto login)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SigningKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddMinutes(_settings.ExpirationMinutes);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, login.EmployeeId.ToString()),
            new Claim(ClaimTypes.NameIdentifier, login.EmployeeId.ToString()),
            new Claim("employee_id", login.EmployeeId.ToString()),
            new Claim("username", login.Username),
            new Claim(ClaimTypes.Role, login.Role)
        };

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds);

        var encodedToken = new JwtSecurityTokenHandler().WriteToken(token);
        return new AuthLoginResponseDto(encodedToken, expiresAt, new AuthMeDto(login.EmployeeId, login.Username, login.Email, login.FirstName, login.LastName, login.Role));
    }
}

public sealed class HttpCurrentUserContext(IHttpContextAccessor accessor) : ICurrentUserContext
{
    private ClaimsPrincipal? User => accessor.HttpContext?.User;

    public Guid UserId => EmployeeId;

    public Guid EmployeeId => Guid.TryParse(User?.FindFirstValue("employee_id") ?? User?.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
        ? id
        : Guid.Empty;

    public string Role => User?.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;
    public bool IsAdmin => string.Equals(Role, SystemRoles.Admin, StringComparison.OrdinalIgnoreCase);
    public bool IsManager => IsAdmin || string.Equals(Role, SystemRoles.Manager, StringComparison.OrdinalIgnoreCase);
    public bool IsEmployee => IsManager || string.Equals(Role, SystemRoles.Employee, StringComparison.OrdinalIgnoreCase);
}

public sealed class AssignedEmployeeOrManagerRequirement : IAuthorizationRequirement;

public sealed class AssignedEmployeeOrManagerHandler(JobTicketSystem.Infrastructure.Persistence.ApplicationDbContext dbContext) : AuthorizationHandler<AssignedEmployeeOrManagerRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, AssignedEmployeeOrManagerRequirement requirement)
    {
        if (!context.User.Identity?.IsAuthenticated ?? true)
        {
            return;
        }

        if (context.User.IsInRole(SystemRoles.Admin) || context.User.IsInRole(SystemRoles.Manager))
        {
            context.Succeed(requirement);
            return;
        }

        if (context.Resource is not HttpContext httpContext
            || !httpContext.Request.RouteValues.TryGetValue("jobTicketId", out var routeValue)
            || !Guid.TryParse(routeValue?.ToString(), out var jobTicketId)
            || !Guid.TryParse(context.User.FindFirstValue("employee_id") ?? context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var employeeId))
        {
            return;
        }

        var isAssigned = await dbContext.JobTicketEmployees.AnyAsync(x => x.JobTicketId == jobTicketId && x.EmployeeId == employeeId, httpContext.RequestAborted);
        if (isAssigned)
        {
            context.Succeed(requirement);
        }
    }
}
