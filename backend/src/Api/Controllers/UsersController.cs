using JobTicketSystem.Application.Auth;
using JobTicketSystem.Application.MasterData;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Policy = "AdminOnly")]
public sealed class UsersController(IUsersService usersService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UserDto>>> ListAsync(CancellationToken cancellationToken = default)
        => Ok(await usersService.ListAsync(cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDto>> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await usersService.GetAsync(id, cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateAsync([FromBody] CreateUserDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var created = await usersService.CreateAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetAsync), new { id = created.Id }, created);
        }
        catch (Exception ex) when (ex is ValidationException)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UserDto>> UpdateAsync(Guid id, [FromBody] UpdateUserDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var updated = await usersService.UpdateAsync(id, request, cancellationToken);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (Exception ex) when (ex is ValidationException)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<ActionResult<UserDto>> ArchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await usersService.ArchiveAsync(id, cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPost("{id:guid}/reset-password")]
    public async Task<ActionResult<UserDto>> ResetPasswordAsync(Guid id, [FromBody] ResetPasswordDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await usersService.ResetPasswordAsync(id, request.NewPassword, cancellationToken);
            return user is null ? NotFound() : Ok(user);
        }
        catch (Exception ex) when (ex is ValidationException)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
