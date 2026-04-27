using JobTicketSystem.Api.Auth;
using JobTicketSystem.Application.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService, IJwtTokenService jwtTokenService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthLoginResponseDto>> LoginAsync([FromBody] AuthLoginRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var login = await authService.LoginAsync(request, cancellationToken);
            if (login is null)
            {
                return Unauthorized(new { error = "Invalid credentials." });
            }

            return Ok(jwtTokenService.CreateToken(login));
        }
        catch (Exception exception)
        {
            if (exception is JobTicketSystem.Application.MasterData.ValidationException)
            {
                return BadRequest(new { error = exception.Message });
            }

            throw;
        }
    }

    [Authorize(Policy = "EmployeeOrAbove")]
    [HttpGet("me")]
    public async Task<ActionResult<AuthMeDto>> MeAsync(CancellationToken cancellationToken = default)
    {
        var current = await authService.GetCurrentUserAsync(cancellationToken);
        return current is null ? Unauthorized() : Ok(current);
    }
}
