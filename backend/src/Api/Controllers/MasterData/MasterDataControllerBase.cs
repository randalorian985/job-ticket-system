using System.Runtime.ExceptionServices;
using JobTicketSystem.Application.MasterData;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers.MasterData;

[ApiController]
[Authorize(Policy = "ManagerOrAdmin")]
public abstract class MasterDataControllerBase : ControllerBase
{
    protected ActionResult HandleValidation(Exception exception)
    {
        return exception switch
        {
            ValidationException => BadRequest(new { error = exception.Message }),
            _ => Rethrow(exception)
        };
    }

    private static ActionResult Rethrow(Exception exception)
    {
        ExceptionDispatchInfo.Capture(exception).Throw();
        throw new UnreachableException();
    }
}
