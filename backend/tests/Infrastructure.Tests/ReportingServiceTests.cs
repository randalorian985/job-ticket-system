using JobTicketSystem.Application.Reporting;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class ReportingServiceTests
{
    [Fact]
    public async Task Invoice_ready_summary_includes_approved_labor_only()
    {
        await using var context = CreateContext();
        var refs = await SeedAsync(context);
        var service = new ReportingService(context);

        var result = await service.GetInvoiceReadySummaryAsync(refs.MainJob.Id);

        Assert.NotNull(result);
        Assert.Single(result!.ApprovedLaborEntries);
        Assert.Equal(2m, result.LaborHours);
    }

    [Fact]
    public async Task Invoice_ready_summary_excludes_pending_or_rejected_labor()
    {
        await using var context = CreateContext();
        var refs = await SeedAsync(context);
        var service = new ReportingService(context);

        var result = await service.GetInvoiceReadySummaryAsync(refs.MainJob.Id);

        Assert.DoesNotContain(result!.ApprovedLaborEntries, x => x.LaborHours == 1m);
        Assert.DoesNotContain(result.ApprovedLaborEntries, x => x.LaborHours == 3m);
    }

    [Fact]
    public async Task Invoice_ready_summary_includes_approved_parts_only()
    {
        await using var context = CreateContext();
        var refs = await SeedAsync(context);
        var service = new ReportingService(context);

        var result = await service.GetInvoiceReadySummaryAsync(refs.MainJob.Id);

        Assert.Single(result!.ApprovedParts);
    }

    [Fact]
    public async Task Invoice_ready_summary_excludes_archived_rejected_and_pending_parts()
    {
        await using var context = CreateContext();
        var refs = await SeedAsync(context);
        var service = new ReportingService(context);

        var result = await service.GetInvoiceReadySummaryAsync(refs.MainJob.Id);

        Assert.All(result!.ApprovedParts, x => Assert.Equal(refs.ApprovedPart.Id, x.JobTicketPartId));
    }

    [Fact]
    public async Task Parts_totals_use_snapshot_prices()
    {
        await using var context = CreateContext();
        var refs = await SeedAsync(context);
        refs.Part.UnitCost = 1000m;
        refs.Part.UnitPrice = 2000m;
        await context.SaveChangesAsync();

        var service = new ReportingService(context);
        var result = await service.GetInvoiceReadySummaryAsync(refs.MainJob.Id);

        Assert.Equal(20m, result!.PartsCostTotal);
        Assert.Equal(50m, result.PartsBillableTotal);
    }

    [Fact]
    public async Task Job_cost_summary_calculates_labor_and_parts_totals()
    {
        await using var context = CreateContext();
        var refs = await SeedAsync(context);
        var service = new ReportingService(context);

        var result = await service.GetJobCostSummaryAsync(refs.MainJob.Id);

        Assert.NotNull(result);
        Assert.Equal(100m, result!.LaborCostTotal);
        Assert.Equal(240m, result.LaborBillableTotal);
        Assert.Equal(20m, result.PartsCostTotal);
        Assert.Equal(50m, result.PartsBillableTotal);
    }

    [Fact]
    public async Task Jobs_ready_to_invoice_excludes_invoiced_jobs()
    {
        await using var context = CreateContext();
        var refs = await SeedAsync(context);
        var service = new ReportingService(context);

        var result = await service.GetJobsReadyToInvoiceAsync(new ReportQueryFiltersDto());

        Assert.Contains(result, x => x.JobTicketId == refs.MainJob.Id);
        Assert.DoesNotContain(result, x => x.JobTicketId == refs.InvoicedJob.Id);
    }

    [Fact]
    public async Task Labor_by_employee_aggregates_approved_hours_correctly()
    {
        await using var context = CreateContext();
        await SeedAsync(context);
        var service = new ReportingService(context);

        var result = await service.GetLaborByEmployeeAsync(new ReportQueryFiltersDto());

        var tech = Assert.Single(result.Where(x => x.EmployeeName == "Tech One"));
        Assert.Equal(3m, tech.ApprovedLaborHours);
    }

    [Fact]
    public async Task Parts_by_job_aggregates_approved_parts_correctly()
    {
        await using var context = CreateContext();
        var refs = await SeedAsync(context);
        var service = new ReportingService(context);

        var result = await service.GetPartsByJobAsync(new ReportQueryFiltersDto());

        var job = Assert.Single(result.Where(x => x.JobTicketId == refs.MainJob.Id));
        Assert.Equal(2m, job.ApprovedPartQuantity);
        Assert.Equal(20m, job.PartsCostTotal);
    }

    [Fact]
    public async Task Customer_service_history_returns_jobs_for_requesting_customer()
    {
        await using var context = CreateContext();
        var refs = await SeedAsync(context);
        var service = new ReportingService(context);

        var result = await service.GetCustomerServiceHistoryAsync(refs.Customer.Id, new ReportQueryFiltersDto());

        Assert.All(result, x => Assert.Equal(refs.Customer.Id, x.CustomerId));
        Assert.Contains(result, x => x.JobTicketId == refs.MainJob.Id);
    }

    [Fact]
    public async Task Equipment_service_history_returns_jobs_for_equipment()
    {
        await using var context = CreateContext();
        var refs = await SeedAsync(context);
        var service = new ReportingService(context);

        var result = await service.GetEquipmentServiceHistoryAsync(refs.Equipment.Id, new ReportQueryFiltersDto());

        Assert.All(result, x => Assert.Equal(refs.Equipment.Id, x.EquipmentId));
        Assert.Contains(result, x => x.JobTicketId == refs.MainJob.Id);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private static async Task<SeedRefs> SeedAsync(ApplicationDbContext context)
    {
        var customer = new Customer { Name = "Customer A" };
        var billing = new Customer { Name = "Billing A" };
        var location = new ServiceLocation
        {
            Customer = customer,
            CompanyName = "Customer A",
            LocationName = "HQ",
            AddressLine1 = "1 Main",
            City = "Austin",
            State = "TX",
            PostalCode = "78701",
            Country = "USA"
        };

        var employee = new Employee { FirstName = "Tech", LastName = "One", CostRate = 50m, BillRate = 120m };
        var category = new PartCategory { Name = "General" };
        var part = new Part { PartCategory = category, PartNumber = "P-1", Name = "Filter", UnitCost = 2m, UnitPrice = 5m, QuantityOnHand = 100m, ReorderThreshold = 1m };
        var equipment = new Equipment { Customer = customer, ServiceLocation = location, Name = "Pump A" };

        context.AddRange(customer, billing, location, employee, category, part, equipment);
        await context.SaveChangesAsync();

        var mainJob = new JobTicket
        {
            TicketNumber = "JT-2026-000001",
            CustomerId = customer.Id,
            BillingPartyCustomerId = billing.Id,
            ServiceLocationId = location.Id,
            EquipmentId = equipment.Id,
            Title = "Main Job",
            Status = JobTicketStatus.Completed,
            CompletedAtUtc = DateTime.UtcNow
        };

        var invoicedJob = new JobTicket
        {
            TicketNumber = "JT-2026-000002",
            CustomerId = customer.Id,
            BillingPartyCustomerId = billing.Id,
            ServiceLocationId = location.Id,
            Title = "Invoiced Job",
            Status = JobTicketStatus.Invoiced,
            CompletedAtUtc = DateTime.UtcNow
        };

        context.JobTickets.AddRange(mainJob, invoicedJob);
        await context.SaveChangesAsync();

        context.InvoiceSummaries.Add(new InvoiceSummary
        {
            JobTicketId = invoicedJob.Id,
            CustomerId = customer.Id,
            Status = InvoiceStatus.Sent,
            LaborSubtotal = 10m,
            PartsSubtotal = 10m,
            TaxAmount = 0,
            TotalAmount = 20m
        });

        context.TimeEntries.AddRange(
            new TimeEntry { JobTicketId = mainJob.Id, EmployeeId = employee.Id, StartedAtUtc = DateTime.UtcNow.AddHours(-3), EndedAtUtc = DateTime.UtcNow.AddHours(-1), LaborHours = 2m, BillableHours = 2m, ApprovalStatus = TimeEntryApprovalStatus.Approved, ClockInLatitude = 1, ClockInLongitude = 1 },
            new TimeEntry { JobTicketId = mainJob.Id, EmployeeId = employee.Id, StartedAtUtc = DateTime.UtcNow.AddHours(-2), EndedAtUtc = DateTime.UtcNow.AddHours(-1), LaborHours = 1m, BillableHours = 1m, ApprovalStatus = TimeEntryApprovalStatus.Pending, ClockInLatitude = 1, ClockInLongitude = 1 },
            new TimeEntry { JobTicketId = mainJob.Id, EmployeeId = employee.Id, StartedAtUtc = DateTime.UtcNow.AddHours(-4), EndedAtUtc = DateTime.UtcNow.AddHours(-1), LaborHours = 3m, BillableHours = 3m, ApprovalStatus = TimeEntryApprovalStatus.Rejected, ClockInLatitude = 1, ClockInLongitude = 1 },
            new TimeEntry { JobTicketId = invoicedJob.Id, EmployeeId = employee.Id, StartedAtUtc = DateTime.UtcNow.AddHours(-2), EndedAtUtc = DateTime.UtcNow.AddHours(-1), LaborHours = 1m, BillableHours = 1m, ApprovalStatus = TimeEntryApprovalStatus.Approved, ClockInLatitude = 1, ClockInLongitude = 1 });

        var approvedPart = new JobTicketPart { JobTicketId = mainJob.Id, PartId = part.Id, Quantity = 2m, UnitCostSnapshot = 10m, SalePriceSnapshot = 25m, ApprovalStatus = JobPartApprovalStatus.Approved, AddedAtUtc = DateTime.UtcNow, Status = PartTransactionStatus.Used };
        context.JobTicketParts.AddRange(
            approvedPart,
            new JobTicketPart { JobTicketId = mainJob.Id, PartId = part.Id, Quantity = 1m, UnitCostSnapshot = 9m, SalePriceSnapshot = 20m, ApprovalStatus = JobPartApprovalStatus.Pending, AddedAtUtc = DateTime.UtcNow, Status = PartTransactionStatus.Used },
            new JobTicketPart { JobTicketId = mainJob.Id, PartId = part.Id, Quantity = 1m, UnitCostSnapshot = 9m, SalePriceSnapshot = 20m, ApprovalStatus = JobPartApprovalStatus.Rejected, AddedAtUtc = DateTime.UtcNow, Status = PartTransactionStatus.Used },
            new JobTicketPart { JobTicketId = mainJob.Id, PartId = part.Id, Quantity = 1m, UnitCostSnapshot = 9m, SalePriceSnapshot = 20m, ApprovalStatus = JobPartApprovalStatus.Approved, AddedAtUtc = DateTime.UtcNow, Status = PartTransactionStatus.Used, IsDeleted = true, DeletedAtUtc = DateTime.UtcNow });

        await context.SaveChangesAsync();
        return new SeedRefs(customer, equipment, mainJob, invoicedJob, part, approvedPart);
    }

    private sealed record SeedRefs(Customer Customer, Equipment Equipment, JobTicket MainJob, JobTicket InvoicedJob, Part Part, JobTicketPart ApprovedPart);
}
