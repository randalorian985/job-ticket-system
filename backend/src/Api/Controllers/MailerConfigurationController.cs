using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Notifications;
using JobTicketSystem.Application.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers;

[ApiController]
[Route("api/mailer-configuration")]
[Authorize(Policy = "AdminOnly")]
public sealed class MailerConfigurationController(
    IMailerConfigurationService service,
    ICurrentUserContext currentUserContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<MailerConfigurationDto>> GetAsync(CancellationToken cancellationToken = default)
    {
        return Ok(await service.GetAsync(cancellationToken));
    }

    [HttpPut]
    public async Task<ActionResult<MailerConfigurationDto>> UpdateAsync(
        [FromBody] UpdateMailerConfigurationDto request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await service.UpdateAsync(request, currentUserContext.UserId, cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("test")]
    public async Task<ActionResult<MailerTestResultDto>> SendTestAsync(
        [FromBody] SendMailerTestRequestDto request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await service.SendTestAsync(request, currentUserContext.UserId, cancellationToken);
            return result.Success ? Ok(result) : BadRequest(result);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    private ActionResult HandleValidation(Exception exception)
    {
        return exception switch
        {
            ValidationException => BadRequest(new { error = exception.Message }),
            _ => throw exception
        };
    }
}
