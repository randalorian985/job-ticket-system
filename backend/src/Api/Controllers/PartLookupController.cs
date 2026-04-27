using JobTicketSystem.Application.MasterData;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers;

[ApiController]
[Route("api/parts/lookup")]
[Authorize(Policy = "EmployeeOrAbove")]
public sealed class PartLookupController(IPartsService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PartLookupDto>>> ListAsync([FromQuery] int offset = 0, [FromQuery] int limit = 50, CancellationToken cancellationToken = default)
        => Ok(await service.ListLookupAsync(new PagedQuery(offset, limit), cancellationToken));
}
