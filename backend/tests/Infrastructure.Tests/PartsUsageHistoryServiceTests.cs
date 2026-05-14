using JobTicketSystem.Application.JobTickets;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class PartsUsageHistoryServiceTests
{
    [Fact]
    public async Task Manager_can_view_cautious_parts_usage_history_for_equipment_and_model()
    {
        await using var context = CreateContext();
        var refs = await SeedHistoryAsync(context);
        var service = new PartsUsageHistoryService(context, new TestCurrentUserContext(refs.ManagerId, SystemRoles.Manager));

        var history = await service.ListAsync(new PartsUsageHistoryQuery(refs.TargetEquipmentId, null));

        Assert.Equal(2, history.Count);
        var exact = Assert.Single(history, x => x.EquipmentId == refs.TargetEquipmentId);
        Assert.Contains("previously used on this equipment", exact.EvidenceTags);
        Assert.Contains("technician-confirmed", exact.EvidenceTags);

        var sameModel = Assert.Single(history, x => x.EquipmentId == refs.ModelPeerEquipmentId);
        Assert.Contains("commonly used with this model", sameModel.EvidenceTags);
        Assert.Contains("needs verification", sameModel.EvidenceTags);
        Assert.DoesNotContain(history, x => x.JobTicketPartId == refs.ArchivedJobTicketPartId);
        Assert.DoesNotContain(history, x => x.JobTicketPartId == refs.UnrelatedEquipmentPartOnTargetJobId);
    }

    [Fact]
    public async Task Employee_context_cannot_view_manager_parts_usage_history()
    {
        await using var context = CreateContext();
        var refs = await SeedHistoryAsync(context);
        var service = new PartsUsageHistoryService(context, new TestCurrentUserContext(refs.EmployeeId, SystemRoles.Employee));

        await Assert.ThrowsAsync<ValidationException>(() => service.ListAsync(new PartsUsageHistoryQuery(refs.TargetEquipmentId, null)));
    }

    [Fact]
    public async Task Unknown_equipment_filter_is_rejected()
    {
        await using var context = CreateContext();
        var refs = await SeedHistoryAsync(context);
        var service = new PartsUsageHistoryService(context, new TestCurrentUserContext(refs.ManagerId, SystemRoles.Manager));

        await Assert.ThrowsAsync<ValidationException>(() => service.ListAsync(new PartsUsageHistoryQuery(Guid.NewGuid(), null)));
    }

    private static async Task<HistoryRefs> SeedHistoryAsync(ApplicationDbContext context)
    {
        var customer = new Customer { Name = "Acme" };
        var billingCustomer = new Customer { Name = "Acme Billing" };
        var location = new ServiceLocation
        {
            Customer = customer,
            CompanyName = "Acme",
            LocationName = "Yard",
            AddressLine1 = "1 Main",
            City = "Tulsa",
            State = "OK",
            PostalCode = "74101",
            Country = "USA"
        };
        var manager = new Employee { FirstName = "Manager", LastName = "One", Role = SystemRoles.Manager };
        var employee = new Employee { FirstName = "Tech", LastName = "One", Role = SystemRoles.Employee };
        var category = new PartCategory { Name = "Hydraulic" };
        var part = new Part { PartCategory = category, PartNumber = "SEAL-1", Name = "Seal Kit", UnitCost = 10m, UnitPrice = 20m };
        var targetEquipment = new Equipment { Customer = customer, ServiceLocation = location, Name = "Crane A", ModelNumber = "X100", EquipmentType = "Crane" };
        var modelPeerEquipment = new Equipment { Customer = customer, ServiceLocation = location, Name = "Crane B", ModelNumber = "X100", EquipmentType = "Crane" };
        var unrelatedEquipment = new Equipment { Customer = customer, ServiceLocation = location, Name = "Forklift A", ModelNumber = "F900", EquipmentType = "Forklift" };

        context.AddRange(customer, billingCustomer, location, manager, employee, category, part, targetEquipment, modelPeerEquipment, unrelatedEquipment);
        await context.SaveChangesAsync();

        var targetJob = NewJob(customer.Id, billingCustomer.Id, location.Id, targetEquipment.Id, "JT-2026-000101");
        var modelPeerJob = NewJob(customer.Id, billingCustomer.Id, location.Id, modelPeerEquipment.Id, "JT-2026-000102");
        var archivedJob = NewJob(customer.Id, billingCustomer.Id, location.Id, targetEquipment.Id, "JT-2026-000103");
        context.JobTickets.AddRange(targetJob, modelPeerJob, archivedJob);
        await context.SaveChangesAsync();

        var exact = NewPart(targetJob.Id, part.Id, targetEquipment.Id, JobPartApprovalStatus.Approved, true);
        var sameModel = NewPart(modelPeerJob.Id, part.Id, modelPeerEquipment.Id, JobPartApprovalStatus.Pending, null);
        var archived = NewPart(archivedJob.Id, part.Id, targetEquipment.Id, JobPartApprovalStatus.Approved, true);
        var unrelatedEquipmentPartOnTargetJob = NewPart(targetJob.Id, part.Id, unrelatedEquipment.Id, JobPartApprovalStatus.Approved, true);
        archived.IsDeleted = true;
        context.JobTicketParts.AddRange(exact, sameModel, archived, unrelatedEquipmentPartOnTargetJob);
        await context.SaveChangesAsync();

        return new HistoryRefs(
            manager.Id,
            employee.Id,
            targetEquipment.Id,
            modelPeerEquipment.Id,
            archived.Id,
            unrelatedEquipmentPartOnTargetJob.Id);
    }

    private static JobTicket NewJob(Guid customerId, Guid billingCustomerId, Guid locationId, Guid equipmentId, string ticketNumber) => new()
    {
        TicketNumber = ticketNumber,
        CustomerId = customerId,
        ServiceLocationId = locationId,
        BillingPartyCustomerId = billingCustomerId,
        EquipmentId = equipmentId,
        Title = "Service crane",
        Status = JobTicketStatus.Completed,
        Priority = JobTicketPriority.Normal
    };

    private static JobTicketPart NewPart(Guid jobTicketId, Guid partId, Guid equipmentId, JobPartApprovalStatus approvalStatus, bool? wasSuccessful) => new()
    {
        JobTicketId = jobTicketId,
        PartId = partId,
        EquipmentId = equipmentId,
        Quantity = 1m,
        UnitCostSnapshot = 10m,
        SalePriceSnapshot = 20m,
        IsBillable = true,
        ApprovalStatus = approvalStatus,
        WasSuccessful = wasSuccessful,
        AddedAtUtc = DateTime.UtcNow,
        InstalledAtUtc = DateTime.UtcNow.AddHours(-1),
        ComponentCategory = "Hydraulic",
        TechnicianNotes = "Observed after install"
    };

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private sealed record HistoryRefs(
        Guid ManagerId,
        Guid EmployeeId,
        Guid TargetEquipmentId,
        Guid ModelPeerEquipmentId,
        Guid ArchivedJobTicketPartId,
        Guid UnrelatedEquipmentPartOnTargetJobId);
}
