using JobTicketSystem.Domain.Common;
using JobTicketSystem.Domain.Enums;

namespace JobTicketSystem.Domain.Entities;

public sealed class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAtUtc { get; set; }
    public Guid? UserId { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public AuditActionType ActionType { get; set; }
    public string? OldValuesJson { get; set; }
    public string? NewValuesJson { get; set; }
    public string? IpAddress { get; set; }
}

public sealed class Customer : SoftDeletableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? AccountNumber { get; set; }
    public string? ContactName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? BillingAddressLine1 { get; set; }
    public string? BillingAddressLine2 { get; set; }
    public string? BillingCity { get; set; }
    public string? BillingState { get; set; }
    public string? BillingPostalCode { get; set; }
    public CustomerStatus Status { get; set; } = CustomerStatus.Active;
    public ICollection<Equipment> Equipment { get; set; } = new List<Equipment>();
    public ICollection<JobTicket> JobTickets { get; set; } = new List<JobTicket>();
    public ICollection<InvoiceSummary> InvoiceSummaries { get; set; } = new List<InvoiceSummary>();
    public ICollection<ServiceLocation> ServiceLocations { get; set; } = new List<ServiceLocation>();
}

public sealed class Employee : SoftDeletableEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? UserName { get; set; }
    public string? PasswordHash { get; set; }
    public string? Phone { get; set; }
    public string? Role { get; set; }
    public decimal? LaborRate { get; set; }
    public decimal? CostRate { get; set; }
    public decimal? BillRate { get; set; }
    public EmployeeStatus Status { get; set; } = EmployeeStatus.Active;
    public ICollection<JobTicketEmployee> JobTickets { get; set; } = new List<JobTicketEmployee>();
    public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
    public ICollection<JobWorkEntry> WorkEntries { get; set; } = new List<JobWorkEntry>();
}

public sealed class Equipment : SoftDeletableEntity
{
    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public Guid ServiceLocationId { get; set; }
    public ServiceLocation ServiceLocation { get; set; } = null!;
    public Guid? OwnerCustomerId { get; set; }
    public Customer? OwnerCustomer { get; set; }
    public Guid? ResponsibleBillingCustomerId { get; set; }
    public Customer? ResponsibleBillingCustomer { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? EquipmentNumber { get; set; }
    public string? UnitNumber { get; set; }
    public string? Manufacturer { get; set; }
    public string? ModelNumber { get; set; }
    public string? EquipmentType { get; set; }
    public int? Year { get; set; }
    public string? Make { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public string? LocationDescription { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public EquipmentStatus Status { get; set; } = EquipmentStatus.Active;
    public ICollection<JobTicket> JobTickets { get; set; } = new List<JobTicket>();
}

public sealed class ServiceLocation : SoftDeletableEntity
{
    public Guid? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;
    public string? OnSiteContactName { get; set; }
    public string? OnSiteContactPhone { get; set; }
    public string? OnSiteContactEmail { get; set; }
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string? ParishCounty { get; set; }
    public string Country { get; set; } = string.Empty;
    public string? GateCode { get; set; }
    public string? AccessInstructions { get; set; }
    public string? SafetyRequirements { get; set; }
    public string? SiteNotes { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<JobTicket> JobTickets { get; set; } = new List<JobTicket>();
    public ICollection<Equipment> Equipment { get; set; } = new List<Equipment>();
}

public sealed class Vendor : SoftDeletableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? AccountNumber { get; set; }
    public string? ContactName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public ICollection<Part> Parts { get; set; } = new List<Part>();
    public ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();
}

public sealed class PartCategory : SoftDeletableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ICollection<Part> Parts { get; set; } = new List<Part>();
}

public sealed class Part : SoftDeletableEntity
{
    public Guid PartCategoryId { get; set; }
    public PartCategory PartCategory { get; set; } = null!;
    public Guid? VendorId { get; set; }
    public Vendor? Vendor { get; set; }
    public string PartNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal UnitCost { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal QuantityOnHand { get; set; }
    public decimal ReorderThreshold { get; set; }
    public ICollection<JobTicketPart> JobTicketParts { get; set; } = new List<JobTicketPart>();
    public ICollection<PurchaseOrderLine> PurchaseOrderLines { get; set; } = new List<PurchaseOrderLine>();
}

public sealed class PurchaseOrder : SoftDeletableEntity
{
    public Guid VendorId { get; set; }
    public Vendor Vendor { get; set; } = null!;
    public string PurchaseOrderNumber { get; set; } = string.Empty;
    public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Draft;
    public DateTime OrderedAtUtc { get; set; }
    public DateTime? ExpectedAtUtc { get; set; }
    public DateTime? ReceivedAtUtc { get; set; }
    public string? VendorInvoiceNumber { get; set; }
    public DateTime? VendorInvoiceDateUtc { get; set; }
    public VendorInvoiceStatus InvoiceStatus { get; set; } = VendorInvoiceStatus.Pending;
    public decimal FreightCost { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal OtherLandedCost { get; set; }
    public string? LandedCostNotes { get; set; }
    public string? Notes { get; set; }
    public ICollection<PurchaseOrderLine> Lines { get; set; } = new List<PurchaseOrderLine>();
}

public sealed class PurchaseOrderLine : SoftDeletableEntity
{
    public Guid PurchaseOrderId { get; set; }
    public PurchaseOrder PurchaseOrder { get; set; } = null!;
    public Guid PartId { get; set; }
    public Part Part { get; set; } = null!;
    public decimal QuantityOrdered { get; set; }
    public decimal QuantityReceived { get; set; }
    public decimal UnitCost { get; set; }
    public string? Notes { get; set; }
}

public sealed class JobTicket : SoftDeletableEntity
{
    public string TicketNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public Guid ServiceLocationId { get; set; }
    public ServiceLocation ServiceLocation { get; set; } = null!;
    public Guid BillingPartyCustomerId { get; set; }
    public Customer BillingPartyCustomer { get; set; } = null!;
    public Guid? EquipmentId { get; set; }
    public Equipment? Equipment { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? JobType { get; set; }
    public JobTicketStatus Status { get; set; } = JobTicketStatus.Draft;
    public JobTicketPriority Priority { get; set; } = JobTicketPriority.Normal;
    public DateTime? RequestedAtUtc { get; set; }
    public DateTime? ScheduledStartAtUtc { get; set; }
    public DateTime? ScheduledEndAtUtc { get; set; }
    public DateTime? DueAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public Guid? AssignedManagerEmployeeId { get; set; }
    public Employee? AssignedManagerEmployee { get; set; }
    public string? BillingContactName { get; set; }
    public string? BillingContactPhone { get; set; }
    public string? BillingContactEmail { get; set; }
    public string? PurchaseOrderNumber { get; set; }
    public string? InternalNotes { get; set; }
    public string? CustomerFacingNotes { get; set; }
    public string? ArchiveReason { get; set; }
    public decimal? SiteLatitude { get; set; }
    public decimal? SiteLongitude { get; set; }
    public ICollection<JobTicketEmployee> AssignedEmployees { get; set; } = new List<JobTicketEmployee>();
    public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
    public ICollection<JobWorkEntry> WorkEntries { get; set; } = new List<JobWorkEntry>();
    public ICollection<JobTicketPart> Parts { get; set; } = new List<JobTicketPart>();
    public ICollection<JobTicketFile> Files { get; set; } = new List<JobTicketFile>();
    public InvoiceSummary? InvoiceSummary { get; set; }
}

public sealed class JobTicketEmployee : SoftDeletableEntity
{
    public Guid JobTicketId { get; set; }
    public JobTicket JobTicket { get; set; } = null!;
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public DateTime AssignedAtUtc { get; set; }
    public Guid? AssignedByUserId { get; set; }
    public bool IsLead { get; set; }
}

public sealed class TimeEntry : SoftDeletableEntity
{
    public Guid JobTicketId { get; set; }
    public JobTicket JobTicket { get; set; } = null!;
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public DateTime StartedAtUtc { get; set; }
    public DateTime? EndedAtUtc { get; set; }
    public decimal LaborHours { get; set; }
    public decimal BillableHours { get; set; }
    public decimal HourlyRate { get; set; }
    public decimal? CostRateSnapshot { get; set; }
    public decimal? BillRateSnapshot { get; set; }
    public int? TotalMinutes { get; set; }
    public TimeEntryApprovalStatus ApprovalStatus { get; set; } = TimeEntryApprovalStatus.Pending;
    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAtUtc { get; set; }
    public string? RejectionReason { get; set; }
    public decimal ClockInLatitude { get; set; }
    public decimal ClockInLongitude { get; set; }
    public decimal? ClockInAccuracy { get; set; }
    public string? ClockInDeviceMetadata { get; set; }
    public decimal? ClockOutLatitude { get; set; }
    public decimal? ClockOutLongitude { get; set; }
    public decimal? ClockOutAccuracy { get; set; }
    public string? WorkSummary { get; set; }
    public string? ClockInNote { get; set; }
    public string? ClockOutNote { get; set; }
    public string? Notes { get; set; }
    public ICollection<TimeEntryAdjustment> Adjustments { get; set; } = new List<TimeEntryAdjustment>();
}

public sealed class TimeEntryAdjustment : AuditableEntity
{
    public Guid TimeEntryId { get; set; }
    public TimeEntry TimeEntry { get; set; } = null!;
    public AdjustmentType AdjustmentType { get; set; }
    public decimal Hours { get; set; }
    public string Reason { get; set; } = string.Empty;
    public Guid AdjustedByUserId { get; set; }
    public DateTime OriginalStartedAtUtc { get; set; }
    public DateTime? OriginalEndedAtUtc { get; set; }
    public decimal OriginalLaborHours { get; set; }
    public decimal OriginalBillableHours { get; set; }
    public decimal OriginalHourlyRate { get; set; }
    public string? OriginalNotes { get; set; }
    public DateTime NewStartedAtUtc { get; set; }
    public DateTime? NewEndedAtUtc { get; set; }
    public decimal NewLaborHours { get; set; }
    public decimal NewBillableHours { get; set; }
    public decimal NewHourlyRate { get; set; }
    public string? NewNotes { get; set; }
}

public sealed class JobWorkEntry : SoftDeletableEntity
{
    public Guid JobTicketId { get; set; }
    public JobTicket JobTicket { get; set; } = null!;
    public Guid? EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public WorkEntryType EntryType { get; set; } = WorkEntryType.Note;
    public string Notes { get; set; } = string.Empty;
    public DateTime PerformedAtUtc { get; set; }
}

public sealed class JobTicketPart : SoftDeletableEntity
{
    public Guid JobTicketId { get; set; }
    public JobTicket JobTicket { get; set; } = null!;
    public Guid PartId { get; set; }
    public Part Part { get; set; } = null!;
    public Guid? EquipmentId { get; set; }
    public Equipment? Equipment { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitCostSnapshot { get; set; }
    public decimal SalePriceSnapshot { get; set; }
    public string? ComponentCategory { get; set; }
    public string? FailureDescription { get; set; }
    public string? RepairDescription { get; set; }
    public string? TechnicianNotes { get; set; }
    public DateTime? InstalledAtUtc { get; set; }
    public bool? WasSuccessful { get; set; }
    public DateTime? RemovedAtUtc { get; set; }
    public Guid? ReplacedByJobTicketPartId { get; set; }
    public JobTicketPart? ReplacedByJobTicketPart { get; set; }
    public ICollection<JobTicketPart> ReplacedJobTicketParts { get; set; } = new List<JobTicketPart>();
    public string? CompatibilityNotes { get; set; }
    public string? Notes { get; set; }
    public bool IsBillable { get; set; } = true;
    public PartTransactionStatus Status { get; set; } = PartTransactionStatus.Reserved;
    public JobPartApprovalStatus ApprovalStatus { get; set; } = JobPartApprovalStatus.Pending;
    public DateTime AddedAtUtc { get; set; }
    public Guid? AddedByUserId { get; set; }
    public Guid? AddedByEmployeeId { get; set; }
    public Employee? AddedByEmployee { get; set; }
    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAtUtc { get; set; }
    public Guid? RejectedByUserId { get; set; }
    public DateTime? RejectedAtUtc { get; set; }
    public string? RejectionReason { get; set; }
}

public sealed class JobTicketFile : SoftDeletableEntity
{
    public Guid JobTicketId { get; set; }
    public JobTicket JobTicket { get; set; } = null!;
    public Guid? EquipmentId { get; set; }
    public Equipment? Equipment { get; set; }
    public Guid? WorkEntryId { get; set; }
    public JobWorkEntry? WorkEntry { get; set; }
    public Guid? UploadedByEmployeeId { get; set; }
    public Employee? UploadedByEmployee { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string StorageKey { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string FileExtension { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string? Caption { get; set; }
    public FileVisibility Visibility { get; set; } = FileVisibility.Internal;
    public bool IsInvoiceAttachment { get; set; }
    public DateTime UploadedAtUtc { get; set; }
}

public sealed class InvoiceSummary : SoftDeletableEntity
{
    public Guid JobTicketId { get; set; }
    public JobTicket JobTicket { get; set; } = null!;
    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public string? InvoiceNumber { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.NotReady;
    public decimal LaborSubtotal { get; set; }
    public decimal PartsSubtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime? ReadyAtUtc { get; set; }
    public DateTime? InvoicedAtUtc { get; set; }
    public DateTime? PaidAtUtc { get; set; }
}
