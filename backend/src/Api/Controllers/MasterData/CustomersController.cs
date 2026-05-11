using JobTicketSystem.Application.MasterData;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers.MasterData;

[Route("api/customers")]
public sealed class CustomersController(ICustomersService service) : MasterDataControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CustomerDto>>> ListAsync([FromQuery] int offset = 0, [FromQuery] int limit = 50, [FromQuery] bool includeArchived = false, CancellationToken cancellationToken = default)
        => Ok(await service.ListAsync(new PagedQuery(offset, limit, includeArchived), cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CustomerDto>> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var item = await service.GetAsync(id, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<CustomerDto>> CreateAsync([FromBody] CreateCustomerDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var created = await service.CreateAsync(request, cancellationToken);
            return Created($"{Request.Path}/{created.Id}", created);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CustomerDto>> UpdateAsync(Guid id, [FromBody] UpdateCustomerDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var updated = await service.UpdateAsync(id, request, cancellationToken);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (Exception exception)
        {
            return HandleValidation(exception);
        }
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<ActionResult> ArchiveAsync(Guid id, CancellationToken cancellationToken = default)
        => await service.ArchiveAsync(id, cancellationToken) ? NoContent() : NotFound();

    [HttpPost("{id:guid}/unarchive")]
    public async Task<ActionResult> UnarchiveAsync(Guid id, CancellationToken cancellationToken = default)
        => await service.UnarchiveAsync(id, cancellationToken) ? NoContent() : NotFound();
}
