namespace JobTicketSystem.Domain.Enums;

public enum CustomerStatus { Active = 1, Inactive = 2, OnHold = 3 }
public enum EmployeeStatus { Active = 1, Inactive = 2, Terminated = 3 }
public enum EquipmentStatus { Active = 1, Inactive = 2, OutOfService = 3 }
public enum JobTicketStatus { Draft = 1, Submitted = 2, Assigned = 3, InProgress = 4, WaitingOnParts = 5, WaitingOnCustomer = 6, Completed = 7, Cancelled = 8, Invoiced = 9, Reviewed = 10 }
public enum JobTicketPriority { Low = 1, Normal = 2, High = 3, Urgent = 4 }
public enum TimeEntryApprovalStatus { Pending = 1, Approved = 2, Rejected = 3 }
public enum AdjustmentType { Add = 1, Deduct = 2, Override = 3 }
public enum WorkEntryType { Note = 1, Diagnosis = 2, Repair = 3, Inspection = 4, Recommendation = 5 }
public enum PartTransactionStatus { Reserved = 1, Used = 2, Returned = 3, Cancelled = 4 }
public enum JobPartApprovalStatus { Pending = 1, Approved = 2, Rejected = 3, Invoiced = 4 }
public enum FileVisibility { Internal = 1, Customer = 2, Vendor = 3 }
public enum AuditActionType { Create = 1, Update = 2, Delete = 3, Restore = 4, StatusChange = 5, Assignment = 6, Approval = 7 }
public enum InvoiceStatus { NotReady = 1, Ready = 2, Drafted = 3, Sent = 4, Paid = 5, Void = 6 }
