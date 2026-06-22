using JobTicketSystem.Application.CompanyConfiguration;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers;

[ApiController]
[Route("api/company-configuration")]
public sealed class CompanyConfigurationController(
    ICompanyConfigurationService service,
    ICurrentUserContext currentUserContext) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<CompanyConfigurationDto>> GetAsync(CancellationToken cancellationToken = default)
    {
        return Ok(await service.GetAsync(cancellationToken));
    }

    [HttpPut]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<CompanyConfigurationDto>> UpdateAsync(
        [FromBody] UpdateCompanyConfigurationDto request,
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

    [HttpPost("logo")]
    [Authorize(Policy = "AdminOnly")]
    [RequestSizeLimit(CompanyConfigurationService.MaxLogoFileSizeBytes)]
    public async Task<ActionResult<CompanyConfigurationDto>> UploadLogoAsync(
        [FromForm] UploadCompanyLogoRequestDto request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (request.File is null)
            {
                return BadRequest(new { error = "Logo file is required." });
            }

            await using var stream = request.File.OpenReadStream();
            return Ok(await service.UploadLogoAsync(
                new UploadCompanyLogoDto(
                    request.File.FileName,
                    request.File.ContentType,
                    request.File.Length,
                    stream),
                currentUserContext.UserId,
                cancellationToken));
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpGet("logo")]
    [AllowAnonymous]
    public async Task<ActionResult> GetLogoAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var logo = await service.GetLogoAsync(cancellationToken);
            if (logo is null)
            {
                return NotFound();
            }

            return File(logo.ContentStream, logo.ContentType, logo.OriginalFileName);
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

public sealed record UploadCompanyLogoRequestDto(IFormFile File);
