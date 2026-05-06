using JobTicketSystem.Application.Auth;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.Pilot;

public interface IPilotDemoSeedService
{
    Task<PilotDemoSeedSummaryDto> SeedAsync(CancellationToken cancellationToken = default);
}

public sealed class PilotDemoSeedService(ApplicationDbContext dbContext, IAuthService authService) : IPilotDemoSeedService
{
    public const string SeedMarkerAccountNumber = "PILOT-4A";
    public const string AdminUserName = "pilot.admin";
    public const string ManagerUserName = "pilot.manager";
    public const string EmployeeUserName = "pilot.tech";
    public const string DemoPassword = "PilotDemo123!";

    public async Task<PilotDemoSeedSummaryDto> SeedAsync(CancellationToken cancellationToken = default)
    {
        var existingCustomer = await dbContext.Customers
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.AccountNumber == SeedMarkerAccountNumber, cancellationToken);

        if (existingCustomer is not null)
        {
            return await BuildSummaryAsync(false, cancellationToken);
        }

        var now = DateTime.UtcNow;

        var admin = CreateUser("Avery", "Admin", AdminUserName, "pilot.admin@example.local", SystemRoles.Admin, 85m, 65m, 140m);
        var manager = CreateUser("Morgan", "Manager", ManagerUserName, "pilot.manager@example.local", SystemRoles.Manager, 75m, 55m, 125m);
        var technician = CreateUser("Taylor", "Technician", EmployeeUserName, "pilot.tech@example.local", SystemRoles.Employee, 65m, 42m, 110m);

        var customer = new Customer
        {
            Name = "Phase 4A Demo Customer",
            AccountNumber = SeedMarkerAccountNumber,
            ContactName = "Jordan Pilot",
            Email = "operations@example.local",
            Phone = "555-0140",
            BillingAddressLine1 = "100 Pilot Way",
            BillingCity = "Austin",
            BillingState = "TX",
            BillingPostalCode = "78701",
            Status = CustomerStatus.Active
        };

        var billingCustomer = new Customer
        {
            Name = "Phase 4A Billing Office",
            AccountNumber = "PILOT-4A-BILLING",
            ContactName = "Casey Billing",
            Email = "billing@example.local",
            Phone = "555-0141",
            BillingAddressLine1 = "200 Invoice Ave",
            BillingCity = "Austin",
            BillingState = "TX",
            BillingPostalCode = "78702",
            Status = CustomerStatus.Active
        };

        var serviceLocation = new ServiceLocation
        {
            Customer = customer,
            CompanyName = customer.Name,
            LocationName = "Demo Plant North",
            OnSiteContactName = "Jordan Pilot",
            OnSiteContactPhone = "555-0142",
            OnSiteContactEmail = "site@example.local",
            AddressLine1 = "300 Service Road",
            City = "Austin",
            State = "TX",
            PostalCode = "78703",
            Country = "USA",
            AccessInstructions = "Check in at the demo guard desk.",
            SafetyRequirements = "Safety glasses required in the compressor room.",
            SiteNotes = "Local pilot seed data; safe to reset with the local database volume.",
            Latitude = 30.2672m,
            Longitude = -97.7431m,
            IsActive = true
        };

        var equipment = new Equipment
        {
            Customer = customer,
            ServiceLocation = serviceLocation,
            OwnerCustomer = customer,
            ResponsibleBillingCustomer = billingCustomer,
            Name = "North Compressor Skid",
            EquipmentNumber = "EQ-PILOT-001",
            UnitNumber = "NC-01",
            Manufacturer = "Demo Industrial",
            ModelNumber = "DX-400",
            SerialNumber = "DX400-PILOT",
            EquipmentType = "Compressor",
            Year = 2024,
            LocationDescription = "North mechanical room",
            Latitude = 30.2672m,
            Longitude = -97.7431m,
            Status = EquipmentStatus.Active
        };

        var vendor = new Vendor
        {
            Name = "Phase 4A Parts Vendor",
            AccountNumber = "PILOT-VENDOR",
            ContactName = "Riley Parts",
            Email = "parts@example.local",
            Phone = "555-0143"
        };

        var category = new PartCategory
        {
            Name = "Pilot Maintenance Parts",
            Description = "Small demo part catalog for local pilot walkthroughs."
        };

        var filter = new Part
        {
            PartCategory = category,
            Vendor = vendor,
            PartNumber = "PILOT-FILTER-001",
            Name = "Compressor intake filter",
            Description = "Demo replacement filter used in the Phase 4A workflow.",
            UnitCost = 42m,
            UnitPrice = 85m,
            QuantityOnHand = 12m,
            ReorderThreshold = 4m
        };

        var belt = new Part
        {
            PartCategory = category,
            Vendor = vendor,
            PartNumber = "PILOT-BELT-002",
            Name = "Drive belt kit",
            Description = "Demo belt kit reserved for waiting-on-parts walkthrough.",
            UnitCost = 58m,
            UnitPrice = 125m,
            QuantityOnHand = 6m,
            ReorderThreshold = 2m
        };

        var completedTicket = BuildTicket("PILOT-READY-001", customer, billingCustomer, serviceLocation, equipment, manager, JobTicketStatus.Completed, JobTicketPriority.High, now.AddDays(-5), now.AddDays(-2), now.AddDays(-1), "Completed compressor PM ready for invoice review");
        completedTicket.CompletedAtUtc = now.AddDays(-1);
        completedTicket.CustomerFacingNotes = "Preventive maintenance completed and ready for invoice review.";
        completedTicket.WorkEntries.Add(new JobWorkEntry
        {
            Employee = technician,
            EntryType = WorkEntryType.Repair,
            Notes = "Replaced intake filter, inspected belt tension, and verified operating pressure.",
            PerformedAtUtc = now.AddDays(-1).AddHours(-2)
        });
        completedTicket.AssignedEmployees.Add(new JobTicketEmployee { Employee = technician, AssignedAtUtc = now.AddDays(-5), AssignedByUserId = manager.Id, IsLead = true });
        completedTicket.TimeEntries.Add(new TimeEntry
        {
            Employee = technician,
            StartedAtUtc = now.AddDays(-1).AddHours(-4),
            EndedAtUtc = now.AddDays(-1).AddHours(-1),
            TotalMinutes = 180,
            LaborHours = 3m,
            BillableHours = 3m,
            HourlyRate = 0m,
            CostRateSnapshot = technician.CostRate,
            BillRateSnapshot = technician.BillRate,
            ApprovalStatus = TimeEntryApprovalStatus.Approved,
            ApprovedByUserId = manager.Id,
            ApprovedAtUtc = now.AddDays(-1).AddMinutes(30),
            ClockInLatitude = 30.2672m,
            ClockInLongitude = -97.7431m,
            ClockInDeviceMetadata = "phase-4a-seed",
            ClockOutLatitude = 30.2673m,
            ClockOutLongitude = -97.7430m,
            WorkSummary = "Completed compressor PM and documented findings."
        });
        completedTicket.Parts.Add(new JobTicketPart
        {
            Part = filter,
            Equipment = equipment,
            Quantity = 1m,
            UnitCostSnapshot = filter.UnitCost,
            SalePriceSnapshot = filter.UnitPrice,
            ComponentCategory = "Air intake",
            FailureDescription = "Filter restricted by normal operating debris.",
            RepairDescription = "Installed new intake filter and verified airflow.",
            TechnicianNotes = "No follow-up required.",
            InstalledAtUtc = now.AddDays(-1).AddHours(-2),
            WasSuccessful = true,
            Notes = "Seed approved part for invoice-ready report.",
            IsBillable = true,
            Status = PartTransactionStatus.Used,
            ApprovalStatus = JobPartApprovalStatus.Approved,
            AddedAtUtc = now.AddDays(-1).AddHours(-3),
            AddedByUserId = technician.Id,
            AddedByEmployee = technician,
            ApprovedByUserId = manager.Id,
            ApprovedAtUtc = now.AddDays(-1).AddMinutes(35)
        });
        completedTicket.InvoiceSummary = new InvoiceSummary
        {
            Customer = customer,
            Status = InvoiceStatus.Ready,
            LaborSubtotal = 330m,
            PartsSubtotal = 85m,
            TaxAmount = 0m,
            DiscountAmount = 0m,
            TotalAmount = 415m,
            ReadyAtUtc = now.AddDays(-1).AddHours(1)
        };

        var assignedTicket = BuildTicket("PILOT-ACTIVE-002", customer, billingCustomer, serviceLocation, equipment, manager, JobTicketStatus.Assigned, JobTicketPriority.Normal, now.AddDays(-1), now.AddDays(1), now.AddDays(3), "Assigned compressor inspection for employee mobile walkthrough");
        assignedTicket.CustomerFacingNotes = "Technician can open this assigned job from the employee workflow.";
        assignedTicket.AssignedEmployees.Add(new JobTicketEmployee { Employee = technician, AssignedAtUtc = now.AddDays(-1), AssignedByUserId = manager.Id, IsLead = true });
        assignedTicket.WorkEntries.Add(new JobWorkEntry
        {
            Employee = manager,
            EntryType = WorkEntryType.Note,
            Notes = "Pilot active job seeded for clock-in, work note, parts, and photo walkthrough.",
            PerformedAtUtc = now.AddHours(-12)
        });

        var waitingTicket = BuildTicket("PILOT-PARTS-003", customer, billingCustomer, serviceLocation, equipment, manager, JobTicketStatus.WaitingOnParts, JobTicketPriority.Urgent, now.AddDays(-3), now.AddDays(2), now.AddDays(5), "Waiting-on-parts follow-up for manager review");
        waitingTicket.AssignedEmployees.Add(new JobTicketEmployee { Employee = technician, AssignedAtUtc = now.AddDays(-3), AssignedByUserId = manager.Id, IsLead = true });
        waitingTicket.Parts.Add(new JobTicketPart
        {
            Part = belt,
            Equipment = equipment,
            Quantity = 1m,
            UnitCostSnapshot = belt.UnitCost,
            SalePriceSnapshot = belt.UnitPrice,
            ComponentCategory = "Drive system",
            FailureDescription = "Existing belt is near replacement threshold.",
            RepairDescription = "Reserve belt kit before return visit.",
            TechnicianNotes = "Manager approval pending in demo data.",
            Notes = "Seed pending part for approval queue walkthrough.",
            IsBillable = true,
            Status = PartTransactionStatus.Reserved,
            ApprovalStatus = JobPartApprovalStatus.Pending,
            AddedAtUtc = now.AddDays(-2),
            AddedByUserId = technician.Id,
            AddedByEmployee = technician
        });

        dbContext.AddRange(admin, manager, technician, customer, billingCustomer, serviceLocation, equipment, vendor, category, filter, belt, completedTicket, assignedTicket, waitingTicket);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await BuildSummaryAsync(true, cancellationToken);
    }

    private Employee CreateUser(string firstName, string lastName, string userName, string email, string role, decimal laborRate, decimal costRate, decimal billRate)
        => new()
        {
            FirstName = firstName,
            LastName = lastName,
            UserName = userName,
            Email = email,
            Role = role,
            PasswordHash = authService.HashPassword(DemoPassword),
            Status = EmployeeStatus.Active,
            LaborRate = laborRate,
            CostRate = costRate,
            BillRate = billRate
        };

    private static JobTicket BuildTicket(
        string ticketNumber,
        Customer customer,
        Customer billingCustomer,
        ServiceLocation serviceLocation,
        Equipment equipment,
        Employee manager,
        JobTicketStatus status,
        JobTicketPriority priority,
        DateTime requestedAtUtc,
        DateTime scheduledStartAtUtc,
        DateTime dueAtUtc,
        string title)
        => new()
        {
            TicketNumber = ticketNumber,
            Customer = customer,
            BillingPartyCustomer = billingCustomer,
            ServiceLocation = serviceLocation,
            Equipment = equipment,
            Title = title,
            Description = "Seeded Phase 4A pilot job ticket for local end-to-end validation.",
            JobType = "Pilot Demo",
            Status = status,
            Priority = priority,
            RequestedAtUtc = requestedAtUtc,
            ScheduledStartAtUtc = scheduledStartAtUtc,
            DueAtUtc = dueAtUtc,
            AssignedManagerEmployee = manager,
            PurchaseOrderNumber = "PO-PILOT-4A",
            BillingContactName = "Casey Billing",
            BillingContactPhone = "555-0141",
            BillingContactEmail = "billing@example.local",
            InternalNotes = "Local-only Phase 4A seed record. Do not use in production data."
        };

    private async Task<PilotDemoSeedSummaryDto> BuildSummaryAsync(bool created, CancellationToken cancellationToken)
    {
        var users = await dbContext.Employees.CountAsync(x => x.UserName != null && x.UserName.StartsWith("pilot."), cancellationToken);
        var customers = await dbContext.Customers.CountAsync(x => x.AccountNumber != null && x.AccountNumber.StartsWith("PILOT-4A"), cancellationToken);
        var tickets = await dbContext.JobTickets.CountAsync(x => x.TicketNumber.StartsWith("PILOT-"), cancellationToken);
        var invoiceReadyTickets = await dbContext.JobTickets.CountAsync(x => x.TicketNumber.StartsWith("PILOT-") && x.InvoiceSummary != null && x.InvoiceSummary.Status == InvoiceStatus.Ready, cancellationToken);

        return new PilotDemoSeedSummaryDto(created, users, customers, tickets, invoiceReadyTickets, AdminUserName, ManagerUserName, EmployeeUserName, DemoPassword);
    }
}

public sealed record PilotDemoSeedSummaryDto(
    bool Created,
    int DemoUserCount,
    int DemoCustomerCount,
    int DemoJobTicketCount,
    int InvoiceReadyJobTicketCount,
    string AdminUserName,
    string ManagerUserName,
    string EmployeeUserName,
    string DemoPassword);
