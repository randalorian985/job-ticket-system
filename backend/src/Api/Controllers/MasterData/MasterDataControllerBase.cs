using JobTicketSystem.Application.MasterData;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers.MasterData;

[ApiController]
public abstract class MasterDataControllerBase : ControllerBase
{
    protected ActionResult HandleValidation(Exception exception)
    {
        return exception switch
        {
            ValidationException => BadRequest(new { error = exception.Message }),
            _ => throw exception
        };
    }
}
