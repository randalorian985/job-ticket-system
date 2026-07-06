using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTicketSystem.Api.Controllers;

[ApiController]
[Route("api/equipment/{equipmentId:guid}/compatible-parts")]
[Authorize(Policy = "ManagerOrAdmin")]
public sealed class EquipmentCompatiblePartsController(
    IEquipmentCompatiblePartsService service,
    ICurrentUserContext currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<EquipmentCompatiblePartsDto>> GetAsync(Guid equipmentId, CancellationToken cancellationToken)
        => Ok(await service.GetForEquipmentAsync(equipmentId, cancellationToken));

    [HttpGet("for-field")]
    [Authorize(Policy = "EmployeeOrAbove")]
    public async Task<ActionResult<IReadOnlyList<EquipmentCompatiblePartFieldDto>>> GetForFieldAsync(Guid equipmentId, CancellationToken cancellationToken)
        => Ok(await service.GetCatalogForFieldAsync(equipmentId, cancellationToken));

    [HttpPost]
    public async Task<ActionResult<EquipmentCompatiblePartDto>> AddAsync(Guid equipmentId, [FromBody] AddEquipmentCompatiblePartDto request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await service.AddAsync(equipmentId, request, currentUser.UserId, cancellationToken);
            return Created($"api/equipment/{equipmentId}/compatible-parts/{request.PartId}", result);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{partId:guid}")]
    public async Task<IActionResult> RemoveAsync(Guid equipmentId, Guid partId, CancellationToken cancellationToken)
    {
        var removed = await service.RemoveAsync(equipmentId, partId, cancellationToken);
        return removed ? NoContent() : NotFound();
    }

    [HttpPatch("{partId:guid}")]
    public async Task<IActionResult> UpdateAsync(Guid equipmentId, Guid partId, [FromBody] UpdateEquipmentCompatiblePartDto request, CancellationToken cancellationToken)
    {
        var updated = await service.UpdateNotesAsync(equipmentId, partId, request, cancellationToken);
        return updated ? NoContent() : NotFound();
    }
}
