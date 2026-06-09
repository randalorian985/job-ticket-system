import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { filesApi } from "../../api/filesApi";
import { ApiError } from "../../api/httpClient";
import { jobTicketsApi } from "../../api/jobTicketsApi";
import { masterDataApi } from "../../api/masterDataApi";
import { partRequestsApi } from "../../api/partRequestsApi";
import { reportsApi } from "../../api/reportsApi";
import { timeEntriesApi } from "../../api/timeEntriesApi";
import { usersApi } from "../../api/usersApi";
import { useAuth } from "../../features/auth/AuthContext";
import type {
  CreateJobTicketDto,
  CustomerDto,
  EquipmentDto,
  InvoiceReadySummaryDto,
  JobTicketAssignmentDto,
  JobTicketDto,
  JobTicketFileDto,
  JobTicketPartDto,
  JobWorkEntryDto,
  PartDto,
  ServiceLocationDto,
  TimeEntryDto,
  AssignableEmployeeDto,
} from "../../types";
import {
  getJobTicketPriorityLabel,
  getJobTicketStatusLabel,
} from "../employee/jobDisplay";
import {
  formatDate,
  getApprovalLabel,
  jobStatusOptions,
  JOB_PART_APPROVAL_STATUS,
  TIME_ENTRY_APPROVAL_STATUS,
} from "./managerDisplay";
import { JobTicketEditorForm } from "./JobTicketEditorForm";

type WorkbenchDrawer = "ticket" | "status" | "archive" | "part" | null;

type ActivityItem = {
  id: string;
  type: string;
  occurredAtUtc?: string | null;
  title: string;
  detail?: string | null;
};

const activeDispatchStatusValues = new Set([2, 3, 4, 5, 6]);
const emptyDisplay = "-";
const displayValue = (value?: string | null) => value?.trim() ? value : emptyDisplay;

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
});

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

const formatCurrency = (value?: number | null) => currencyFormatter.format(value ?? 0);
const formatHours = (value: number) => `${numberFormatter.format(value)}h`;

const formatFileSize = (bytes?: number | null) => {
  if (typeof bytes !== "number" || !Number.isFinite(bytes)) {
    return "Size unknown";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${numberFormatter.format(bytes / (1024 * 1024))} MB`;
};

const getPartDisplayName = (part: JobTicketPartDto) => {
  if (part.partNumber && part.partName) {
    return `${part.partNumber} - ${part.partName}`;
  }

  return part.partName || part.partNumber || `Part ${part.partId ?? "unlisted"}`;
};

const getPartReviewLabel = (status: number) => {
  if (status === JOB_PART_APPROVAL_STATUS.Pending) {
    return "Pending review";
  }

  return getApprovalLabel(status);
};

const getPartRequestLabel = (part: JobTicketPartDto) => {
  if (part.officeOrderRequested) {
    return "Needs ordered";
  }

  return "Ticket part only";
};

const getAddressLine = (location?: ServiceLocationDto) => {
  if (!location) {
    return emptyDisplay;
  }

  return [
    location.addressLine1,
    [location.city, location.state, location.postalCode].filter(Boolean).join(", "),
    location.country,
  ]
    .filter((item) => item?.trim())
    .join(" ");
};

const sortActivityDescending = (left: ActivityItem, right: ActivityItem) => {
  const leftTime = left.occurredAtUtc ? new Date(left.occurredAtUtc).getTime() : 0;
  const rightTime = right.occurredAtUtc ? new Date(right.occurredAtUtc).getTime() : 0;
  return rightTime - leftTime;
};

export function JobTicketDetailPage() {
  const { jobTicketId } = useParams<{ jobTicketId: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<JobTicketDto | null>(null);
  const [assignments, setAssignments] = useState<JobTicketAssignmentDto[]>([]);
  const [assignmentLoadFailed, setAssignmentLoadFailed] = useState(false);
  const [entries, setEntries] = useState<JobWorkEntryDto[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntryDto[]>([]);
  const [parts, setParts] = useState<JobTicketPartDto[]>([]);
  const [catalogParts, setCatalogParts] = useState<PartDto[]>([]);
  const [files, setFiles] = useState<JobTicketFileDto[]>([]);
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceReadySummaryDto | null>(null);
  const [invoiceSummaryError, setInvoiceSummaryError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [locations, setLocations] = useState<ServiceLocationDto[]>([]);
  const [equipment, setEquipment] = useState<EquipmentDto[]>([]);
  const [employees, setEmployees] = useState<AssignableEmployeeDto[]>([]);
  const [statusValue, setStatusValue] = useState("1");
  const [archiveReason, setArchiveReason] = useState("");
  const [archiveConfirmationOpen, setArchiveConfirmationOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [assignmentEmployeeId, setAssignmentEmployeeId] = useState("");
  const [isLeadAssignment, setIsLeadAssignment] = useState(false);
  const [partDescription, setPartDescription] = useState("");
  const [selectedCatalogPartId, setSelectedCatalogPartId] = useState("");
  const [partQuantity, setPartQuantity] = useState("1");
  const [partNotes, setPartNotes] = useState("");
  const [partNeedsOrdered, setPartNeedsOrdered] = useState(true);
  const [partUrgency, setPartUrgency] = useState("");
  const [partNeededBy, setPartNeededBy] = useState("");
  const [isSubmittingPart, setIsSubmittingPart] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<WorkbenchDrawer>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canShow = useMemo(() => Boolean(jobTicketId), [jobTicketId]);
  const customersById = useMemo(
    () => Object.fromEntries(customers.map((item) => [item.id, item])),
    [customers],
  );
  const locationsById = useMemo(
    () => Object.fromEntries(locations.map((item) => [item.id, item])),
    [locations],
  );
  const equipmentById = useMemo(
    () => Object.fromEntries(equipment.map((item) => [item.id, item])),
    [equipment],
  );
  const employeesById = useMemo(
    () => Object.fromEntries(employees.map((item) => [item.id, item])),
    [employees],
  );
  const leadAssignment = useMemo(
    () => assignments.find((item) => item.isLead) ?? null,
    [assignments],
  );
  const selectedCatalogPart = useMemo(
    () => catalogParts.find((part) => part.id === selectedCatalogPartId) ?? null,
    [catalogParts, selectedCatalogPartId],
  );
  const selectedCustomer = job ? customersById[job.customerId] : undefined;
  const selectedLocation = job ? locationsById[job.serviceLocationId] : undefined;
  const selectedEquipment = job?.equipmentId ? equipmentById[job.equipmentId] : undefined;
  const billingParty = job ? customersById[job.billingPartyCustomerId] : undefined;

  const catalogPartMatches = useMemo(() => {
    const search = partDescription.trim().toLowerCase();
    if (!search) {
      return catalogParts.slice(0, 12);
    }

    return catalogParts
      .filter((part) => `${part.partNumber} ${part.name} ${part.description ?? ""}`.toLowerCase().includes(search))
      .slice(0, 12);
  }, [catalogParts, partDescription]);

  const getEmployeeDisplayName = (assignment: JobTicketAssignmentDto) => {
    const employee = employeesById[assignment.employeeId];
    const name = employee
      ? `${employee.firstName} ${employee.lastName}`.trim()
      : "";

    return assignment.employeeName?.trim() || name || assignment.employeeId;
  };

  const getEmployeeNameById = (employeeId?: string | null) => {
    if (!employeeId) {
      return "Unassigned";
    }

    const employee = employeesById[employeeId];
    return employee ? `${employee.firstName} ${employee.lastName}`.trim() : employeeId;
  };

  const partsReview = useMemo(() => {
    const needsOrdered = parts.filter((part) => part.officeOrderRequested);
    const pendingNeedsOrdered = needsOrdered.filter((part) => part.approvalStatus === JOB_PART_APPROVAL_STATUS.Pending);
    const approvedNeedsOrdered = needsOrdered.filter((part) => part.approvalStatus === JOB_PART_APPROVAL_STATUS.Approved);
    const rejectedNeedsOrdered = needsOrdered.filter((part) => part.approvalStatus === JOB_PART_APPROVAL_STATUS.Rejected);
    const ticketOnlyParts = parts.filter((part) => !part.officeOrderRequested);
    const approvedParts = parts.filter((part) => part.approvalStatus === JOB_PART_APPROVAL_STATUS.Approved);
    const isWaitingStatus = job?.status === 5;
    const blockerCount = pendingNeedsOrdered.length + (isWaitingStatus && !approvedNeedsOrdered.length ? 1 : 0);

    return {
      needsOrdered,
      pendingNeedsOrdered,
      approvedNeedsOrdered,
      rejectedNeedsOrdered,
      ticketOnlyParts,
      approvedParts,
      blockerCount,
      statusLabel: pendingNeedsOrdered.length
        ? "Waiting on parts review"
        : isWaitingStatus
          ? "Ticket marked waiting on parts"
          : needsOrdered.length
            ? "Parts requests reviewed"
            : parts.length
              ? "Parts recorded"
              : "No parts recorded",
      nextAction: pendingNeedsOrdered.length
        ? "Review pending Needs ordered items in the parts request queue."
        : isWaitingStatus
          ? "Confirm whether parts are still blocking this ticket before moving status forward."
          : needsOrdered.length
            ? "Needs ordered items have no pending review blockers."
            : parts.length
              ? "No Needs ordered blockers are recorded on this ticket."
              : "Add or request parts from this ticket if field work needs them.",
    };
  }, [job?.status, parts]);

  const laborSummary = useMemo(() => {
    const approvedClosedTimeEntries = timeEntries.filter(
      (entry) => entry.approvalStatus === TIME_ENTRY_APPROVAL_STATUS.Approved && Boolean(entry.endedAtUtc),
    );
    const pendingTimeEntries = timeEntries.filter(
      (entry) => entry.approvalStatus === TIME_ENTRY_APPROVAL_STATUS.Pending,
    );
    const openTimeEntries = timeEntries.filter((entry) => !entry.endedAtUtc);
    const laborHours = timeEntries.reduce((total, entry) => total + (entry.laborHours ?? 0), 0);
    const billableHours = timeEntries.reduce((total, entry) => total + (entry.billableHours ?? 0), 0);
    const approvedLaborHours = approvedClosedTimeEntries.reduce((total, entry) => total + (entry.laborHours ?? 0), 0);

    return {
      approvedClosedTimeEntries,
      pendingTimeEntries,
      openTimeEntries,
      laborHours,
      billableHours,
      approvedLaborHours,
    };
  }, [timeEntries]);

  const dispatchReadiness = useMemo(() => {
    const assignedEmployeeNames = assignments.map((item) => getEmployeeDisplayName(item));
    const leadTechName = leadAssignment ? getEmployeeDisplayName(leadAssignment) : null;
    const isActiveDispatchStatus = Boolean(job && activeDispatchStatusValues.has(job.status));
    const assignmentChecks = assignmentLoadFailed
      ? [
          {
            label: "Assignment data",
            isReady: false,
            detail: "Assignment data could not be loaded. Refresh or retry before dispatch review.",
          },
        ]
      : [
          {
            label: "Assigned employees",
            isReady: Boolean(assignments.length),
            detail: assignments.length
              ? `Assigned employees: ${assignedEmployeeNames.join(", ")}.`
              : "No employees are assigned.",
          },
          {
            label: "Lead tech",
            isReady: Boolean(leadAssignment),
            detail: leadTechName
              ? `Lead tech is ${leadTechName}.`
              : "No lead tech is marked.",
          },
        ];
    const checks = [
      {
        label: "Dispatch status",
        isReady: isActiveDispatchStatus,
        detail: isActiveDispatchStatus
          ? "Ticket is in the active dispatch queue."
          : "Ticket is outside the active dispatch queue.",
      },
      ...assignmentChecks,
      {
        label: "Scheduled start",
        isReady: Boolean(job?.scheduledStartAtUtc),
        detail: job?.scheduledStartAtUtc
          ? "Scheduled start is set."
          : "No scheduled start is set.",
      },
      {
        label: "Due date",
        isReady: Boolean(job?.dueAtUtc),
        detail: job?.dueAtUtc
          ? "Due date is set."
          : "No due date is set.",
      },
      {
        label: "Customer",
        isReady: Boolean(job?.customerId),
        detail: job?.customerId
          ? "Customer is selected."
          : "No customer is selected.",
      },
      {
        label: "Service location",
        isReady: Boolean(job?.serviceLocationId),
        detail: job?.serviceLocationId
          ? "Service location is selected."
          : "Service location is not selected.",
      },
      {
        label: "Equipment or no-equipment context",
        isReady: Boolean(job),
        detail: job?.equipmentId
          ? "Equipment context is selected."
          : "No equipment is attached; no-equipment context is allowed for this ticket.",
      },
    ];
    const warnings = checks
      .filter((check) => !check.isReady)
      .map((check) => check.detail);

    return {
      checks,
      readyCount: checks.filter((check) => check.isReady).length,
      statusLabel: !isActiveDispatchStatus
        ? "Not active dispatch"
        : assignmentLoadFailed
          ? "Assignment data unavailable"
          : warnings.length
            ? "Needs attention"
            : "Ready for dispatch review",
      warnings,
    };
  }, [assignmentLoadFailed, assignments, employeesById, job, leadAssignment]);

  const dispatchWarnings = dispatchReadiness.warnings;
  const nextDispatchFix = dispatchWarnings[0] ?? "No dispatch blockers found.";

  const closeoutReview = useMemo(() => {
    const warnings: string[] = [];
    const hasUnapprovedTimeEntries = timeEntries.some(
      (entry) => entry.approvalStatus !== TIME_ENTRY_APPROVAL_STATUS.Approved,
    );
    const hasOpenApprovedTimeEntries = timeEntries.some(
      (entry) => entry.approvalStatus === TIME_ENTRY_APPROVAL_STATUS.Approved && !entry.endedAtUtc,
    );
    const checks = [
      {
        label: "Customer and location",
        isReady: Boolean(job?.customerId && job?.serviceLocationId),
        detail: job?.customerId && job?.serviceLocationId
          ? "Customer and service location are present."
          : "Customer or service location is missing.",
      },
      {
        label: "Equipment context",
        isReady: Boolean(job?.equipmentId),
        detail: job?.equipmentId
          ? "Equipment is attached for review."
          : "No equipment is attached; confirm that this ticket does not require equipment context.",
      },
      {
        label: "Billing handoff context",
        isReady: Boolean(
          job?.billingPartyCustomerId ||
          job?.purchaseOrderNumber?.trim() ||
          job?.billingContactName?.trim() ||
          job?.billingContactEmail?.trim() ||
          job?.billingContactPhone?.trim(),
        ),
        detail: job?.billingPartyCustomerId || job?.purchaseOrderNumber?.trim() || job?.billingContactName?.trim()
          ? "Billing party, purchase order, or billing contact context is present."
          : "Add purchase-order, billing-party, or billing-contact context before invoice handoff.",
      },
      {
        label: "Labor and work notes",
        isReady: Boolean(entries.length || timeEntries.length),
        detail: entries.length || timeEntries.length
          ? "Labor or work-entry activity is present."
          : "No labor or work-entry activity is recorded.",
      },
      {
        label: "Time approval review",
        isReady: Boolean(timeEntries.length && laborSummary.approvedClosedTimeEntries.length === timeEntries.length),
        detail: timeEntries.length
          ? hasUnapprovedTimeEntries
            ? "Some loaded time entries still need approval review."
            : hasOpenApprovedTimeEntries
              ? "Approved time entries must be clocked out before invoice handoff."
              : "All loaded time entries are approved and clocked out."
          : "No time entries are loaded for approval review.",
      },
      {
        label: "Parts usage review",
        isReady: Boolean(partsReview.approvedParts.length),
        detail: parts.length
          ? partsReview.approvedParts.length
            ? "Approved parts usage is available for invoice review."
            : "Parts are recorded, but none are approved for invoice review."
          : "No parts usage is recorded; confirm that no parts were needed.",
      },
      {
        label: "Files and photos",
        isReady: Boolean(files.length),
        detail: files.length
          ? "Files or photos are attached for documentation review."
          : "No files or photos are attached; confirm that documentation is not required.",
      },
      {
        label: "Closeout notes",
        isReady: Boolean(job?.description?.trim() || job?.customerFacingNotes?.trim() || job?.internalNotes?.trim()),
        detail: job?.description?.trim() || job?.customerFacingNotes?.trim() || job?.internalNotes?.trim()
          ? "Description or closeout notes are present."
          : "Add closeout notes before invoice handoff.",
      },
      {
        label: "Closeout status",
        isReady: Boolean(job && [7, 9, 10].includes(job.status)),
        detail: job && [7, 9, 10].includes(job.status)
          ? "Ticket status is in a closeout-ready state."
          : "Move the ticket to Completed before invoice handoff review.",
      },
    ];

    checks.forEach((check) => {
      if (!check.isReady) {
        warnings.push(check.detail);
      }
    });

    return {
      checks,
      readyCount: checks.filter((check) => check.isReady).length,
      warnings,
    };
  }, [entries.length, files.length, job, laborSummary.approvedClosedTimeEntries.length, parts.length, partsReview.approvedParts.length, timeEntries]);

  const statusReview = useMemo(() => {
    const nextStatus = Number(statusValue);
    const currentStatus = job?.status ?? null;
    const currentLabel = currentStatus !== null ? getJobTicketStatusLabel(currentStatus) : emptyDisplay;
    const nextLabel = getJobTicketStatusLabel(nextStatus);
    const warnings: string[] = [];
    const hasChange = currentStatus !== null && nextStatus !== currentStatus;

    let summary = hasChange
      ? `This change will move the ticket from ${currentLabel} to ${nextLabel}.`
      : `Choose a different status when you are ready to move this ticket out of ${currentLabel}.`;

    if (job) {
      switch (nextStatus) {
        case 3:
          if (!assignments.length) {
            warnings.push("Assigned status usually needs at least one employee assignment.");
          }
          if (!leadAssignment) {
            warnings.push("Assigned status is clearer once a lead tech is marked.");
          }
          break;
        case 4:
          if (dispatchWarnings.length) {
            warnings.push(
              ...dispatchWarnings.map((warning) => `Dispatch readiness: ${warning}`),
            );
          }
          break;
        case 5:
        case 6:
          if (!assignments.length) {
            warnings.push("Waiting statuses are easier to review when an owner is assigned.");
          }
          break;
        case 7:
          if (!entries.length && !timeEntries.length && !parts.length) {
            warnings.push("This ticket does not yet show labor, work-entry, or parts activity.");
          }
          break;
        case 9:
        case 10:
          if (closeoutReview.warnings.length) {
            warnings.push(
              ...closeoutReview.warnings.map((warning) => `Invoice readiness: ${warning}`),
            );
          }
          break;
        default:
          break;
      }
    }

    if (hasChange && !warnings.length) {
      summary = `${summary} Current dispatch and history cues do not show any obvious blockers.`;
    }

    return {
      currentLabel,
      nextLabel,
      hasChange,
      summary,
      warnings,
    };
  }, [assignments.length, closeoutReview.warnings, dispatchWarnings, entries.length, job, leadAssignment, parts.length, statusValue, timeEntries.length]);

  const archiveReviewWarnings = useMemo(() => {
    const warnings = job && activeDispatchStatusValues.has(job.status)
      ? dispatchWarnings.map((warning) => `Before archiving: ${warning}`)
      : [];

    if (job && ![7, 8, 9, 10].includes(job.status)) {
      warnings.unshift(`This ticket is currently ${getJobTicketStatusLabel(job.status)}.`);
    }

    return warnings;
  }, [dispatchWarnings, job]);

  const activityItems = useMemo<ActivityItem[]>(() => {
    const workActivity = entries.map((entry) => ({
      id: `work-${entry.id}`,
      type: "Work note",
      occurredAtUtc: entry.performedAtUtc,
      title: entry.notes,
      detail: entry.employeeId ? `Recorded by ${getEmployeeNameById(entry.employeeId)}` : "Recorded on ticket",
    }));

    const timeActivity = timeEntries.map((entry) => ({
      id: `time-${entry.id}`,
      type: "Time entry",
      occurredAtUtc: entry.startedAtUtc,
      title: `${getEmployeeNameById(entry.employeeId)} - ${formatHours(entry.laborHours)} labor / ${formatHours(entry.billableHours)} billable`,
      detail: `${getApprovalLabel(entry.approvalStatus)}${entry.workSummary ? ` - ${entry.workSummary}` : ""}`,
    }));

    const partActivity = parts.map((part) => ({
      id: `part-${part.id}`,
      type: "Part",
      occurredAtUtc: part.addedAtUtc,
      title: `${getPartDisplayName(part)} - Qty ${numberFormatter.format(part.quantity)}`,
      detail: `${getPartRequestLabel(part)} - ${getPartReviewLabel(part.approvalStatus)}`,
    }));

    const fileActivity = files.map((file) => ({
      id: `file-${file.id}`,
      type: "File/photo",
      occurredAtUtc: file.uploadedAtUtc,
      title: file.originalFileName,
      detail: `${formatFileSize(file.fileSizeBytes)}${file.caption ? ` - ${file.caption}` : ""}`,
    }));

    return [
      ...workActivity,
      ...timeActivity,
      ...partActivity,
      ...fileActivity,
    ].sort(sortActivityDescending).slice(0, 12);
  }, [entries, employeesById, files, parts, timeEntries]);

  const load = async () => {
    if (!jobTicketId) return;

    setIsLoading(true);
    const [
      jobResponse,
      assignmentResponse,
      entryResponse,
      timeResponse,
      partsResponse,
      filesResponse,
      invoiceResponse,
      customerResponse,
      locationResponse,
      equipmentResponse,
      catalogPartResponse,
    ] = await Promise.all([
      jobTicketsApi.get(jobTicketId),
      jobTicketsApi.listAssignments(jobTicketId)
        .then((items) => ({ items, failed: false }))
        .catch(() => ({ items: [], failed: true })),
      jobTicketsApi.listWorkEntries(jobTicketId),
      timeEntriesApi.listByJob(jobTicketId).catch(() => []),
      jobTicketsApi.listParts(jobTicketId),
      filesApi.list(jobTicketId),
      reportsApi.getInvoiceReadySummary(jobTicketId)
        .then((summary) => ({ summary, error: null as string | null }))
        .catch((requestError) => {
          if (requestError instanceof ApiError && requestError.status === 404) {
            return { summary: null, error: null };
          }

          return { summary: null, error: "Invoice-ready summary is unavailable right now." };
        }),
      masterDataApi.listCustomers(),
      masterDataApi.listServiceLocations(),
      masterDataApi.listEquipment(),
      masterDataApi.listParts(),
    ]);

    setJob(jobResponse);
    setStatusValue(String(jobResponse.status));
    setAssignmentLoadFailed(assignmentResponse.failed);
    setAssignments(assignmentResponse.items);
    setEntries(entryResponse);
    setTimeEntries(timeResponse);
    setParts(partsResponse);
    setFiles(filesResponse);
    setInvoiceSummary(invoiceResponse.summary);
    setInvoiceSummaryError(invoiceResponse.error);
    setCustomers(customerResponse);
    setLocations(locationResponse);
    setEquipment(equipmentResponse);
    setCatalogParts(catalogPartResponse.filter((part) => !part.isArchived));

    if (user?.role === "Admin" || user?.role === "Manager") {
      setEmployees(await usersApi.listAssignableEmployees().catch(() => []));
    }

    setError(null);
    setIsLoading(false);
  };

  useEffect(() => {
    load().catch((requestError) => {
      if (
        requestError instanceof ApiError &&
        (requestError.status === 401 || requestError.status === 403)
      ) {
        setError("You do not have permission to load this manager view.");
        setIsLoading(false);
        return;
      }
      setError("Unable to load job ticket details.");
      setIsLoading(false);
    });
  }, [jobTicketId]);

  const toggleDrawer = (drawer: WorkbenchDrawer) => {
    setActiveDrawer((current) => (current === drawer ? null : drawer));
    setError(null);
    setMessage(null);
  };

  const onStatusChange = async (event: FormEvent) => {
    event.preventDefault();
    if (!jobTicketId) return;
    if (!statusReview.hasChange) {
      setError("Select a different status before applying an update.");
      setMessage(null);
      return;
    }

    try {
      await jobTicketsApi.changeStatus(jobTicketId, {
        status: Number(statusValue),
      });
      setError(null);
      setMessage("Status updated.");
      setActiveDrawer(null);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to update status.",
      );
      setMessage(null);
    }
  };

  const onArchiveRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!jobTicketId) return;
    if (!archiveReason.trim()) {
      setError("Archive reason is required before confirmation.");
      setMessage(null);
      return;
    }
    setArchiveConfirmationOpen(true);
    setError(null);
    setMessage(null);
  };

  const onArchiveConfirm = async () => {
    if (!jobTicketId || !archiveReason.trim() || isArchiving) return;
    setIsArchiving(true);
    try {
      await jobTicketsApi.archive(jobTicketId, {
        archiveReason: archiveReason.trim(),
      });
      setError(null);
      setMessage("Ticket archived.");
      setArchiveConfirmationOpen(false);
      setArchiveReason("");
      setActiveDrawer(null);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to archive ticket.",
      );
      setMessage(null);
    } finally {
      setIsArchiving(false);
    }
  };

  const onAddAssignment = async (event: FormEvent) => {
    event.preventDefault();
    if (!jobTicketId) return;
    if (assignmentLoadFailed) {
      setError("Assignment data must load before assignments can be changed.");
      setMessage(null);
      return;
    }
    if (!assignmentEmployeeId) {
      setError("Select an employee before assigning.");
      setMessage(null);
      return;
    }
    if (assignments.some((x) => x.employeeId === assignmentEmployeeId)) {
      setError("Employee is already assigned.");
      setMessage(null);
      return;
    }
    if (isLeadAssignment && leadAssignment) {
      setError(
        "A lead tech is already assigned. Remove the current lead before setting a new lead.",
      );
      setMessage(null);
      return;
    }
    try {
      await jobTicketsApi.addAssignment(jobTicketId, {
        employeeId: assignmentEmployeeId,
        isLead: isLeadAssignment,
      });
      setError(null);
      setMessage("Employee assigned.");
      setAssignmentEmployeeId("");
      setIsLeadAssignment(false);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to add assignment.",
      );
      setMessage(null);
    }
  };

  const onRemoveAssignment = async (employeeId: string) => {
    if (!jobTicketId) return;
    if (assignmentLoadFailed) {
      setError("Assignment data must load before assignments can be changed.");
      setMessage(null);
      return;
    }
    if (!window.confirm("Remove this assignment?")) return;
    try {
      await jobTicketsApi.removeAssignment(jobTicketId, employeeId);
      setError(null);
      setMessage("Assignment removed.");
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to remove assignment.",
      );
      setMessage(null);
    }
  };

  const onPartDescriptionChange = (value: string) => {
    setPartDescription(value);
    setSelectedCatalogPartId("");
  };

  const onSubmitPart = async (event: FormEvent) => {
    event.preventDefault();
    const selectedPartName = selectedCatalogPart?.name ?? null;
    const normalizedDescription = selectedPartName ?? partDescription.trim();
    const quantity = Number(partQuantity);

    if (!jobTicketId || !normalizedDescription) {
      setError("Select an existing part or enter a new part name or description.");
      setMessage(null);
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Quantity must be greater than zero.");
      setMessage(null);
      return;
    }

    setIsSubmittingPart(true);
    setError(null);
    setMessage(null);
    try {
      await partRequestsApi.createForJobTicket(jobTicketId, {
        partDescription: normalizedDescription,
        partId: selectedCatalogPart?.id ?? null,
        needsOrdered: partNeedsOrdered,
        quantity,
        notes: partNotes || null,
        urgency: partNeedsOrdered ? partUrgency || null : null,
        neededByUtc: partNeedsOrdered && partNeededBy ? new Date(partNeededBy).toISOString() : null,
      });
      setPartDescription("");
      setSelectedCatalogPartId("");
      setPartQuantity("1");
      setPartNotes("");
      setPartNeedsOrdered(true);
      setPartUrgency("");
      setPartNeededBy("");
      setMessage(partNeedsOrdered ? "Part request added to the back-office queue." : "Ticket part added.");
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to add or request part.",
      );
    } finally {
      setIsSubmittingPart(false);
    }
  };

  const editPayload: CreateJobTicketDto | null = job
    ? {
        customerId: job.customerId,
        serviceLocationId: job.serviceLocationId,
        billingPartyCustomerId: job.billingPartyCustomerId,
        equipmentId: job.equipmentId,
        title: job.title,
        description: job.description,
        jobType: job.jobType,
        priority: job.priority,
        status: job.status,
        requestedAtUtc: job.requestedAtUtc,
        scheduledStartAtUtc: job.scheduledStartAtUtc,
        dueAtUtc: job.dueAtUtc,
        assignedManagerEmployeeId: job.assignedManagerEmployeeId,
        purchaseOrderNumber: job.purchaseOrderNumber,
        billingContactName: job.billingContactName,
        billingContactPhone: job.billingContactPhone,
        billingContactEmail: job.billingContactEmail,
        internalNotes: job.internalNotes,
        customerFacingNotes: job.customerFacingNotes,
      }
    : null;

  if (!canShow) return <section className="card">Missing job id.</section>;

  return (
    <section className="ticket-workbench-page stack">
      <p className="breadcrumb-line">
        <Link to="/manage/job-tickets">Back to Job Tickets</Link>
      </p>
      {isLoading ? (
        <p className="muted" role="status">
          Loading job review details...
        </p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success" role="status">{message}</p> : null}
      {job ? (
        <>
          <header className="ticket-workbench-hero print-review">
            <div className="ticket-workbench-title">
              <span className="muted">Service ticket</span>
              <h2>{job.ticketNumber}</h2>
              <p>{job.title}</p>
            </div>
            <div className="ticket-workbench-command-bar no-print">
              <button
                type="button"
                className="secondary-button"
                onClick={() => window.print()}
              >
                Print Job Review
              </button>
              <button type="button" onClick={() => toggleDrawer("ticket")}>
                {activeDrawer === "ticket" ? "Close Ticket Editor" : "Edit Ticket"}
              </button>
              <button type="button" onClick={() => toggleDrawer("status")}>
                {activeDrawer === "status" ? "Close Status Panel" : "Change Status"}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => toggleDrawer("archive")}
              >
                {activeDrawer === "archive" ? "Close Archive Panel" : "Archive Review"}
              </button>
            </div>
            <div className="ticket-workbench-hero-meta" aria-label="ticket overview">
              <div>
                <span>Status</span>
                <strong>{getJobTicketStatusLabel(job.status)}</strong>
              </div>
              <div>
                <span>Priority</span>
                <strong>{getJobTicketPriorityLabel(job.priority)}</strong>
              </div>
              <div>
                <span>Customer</span>
                <strong>{selectedCustomer?.name ?? job.customerId}</strong>
              </div>
              <div>
                <span>Service location</span>
                <strong>{selectedLocation?.locationName ?? job.serviceLocationId}</strong>
              </div>
              <div>
                <span>Equipment</span>
                <strong>{job.equipmentId ? (selectedEquipment?.name ?? job.equipmentId) : emptyDisplay}</strong>
              </div>
              <div>
                <span>Due</span>
                <strong>{formatDate(job.dueAtUtc)}</strong>
              </div>
            </div>
          </header>

          <section className="ticket-workbench-kpis" aria-label="ticket workspace summary">
            <div className={dispatchWarnings.length ? "metric-tile metric-tile-review" : "metric-tile metric-tile-ready"}>
              <span>Dispatch</span>
              <strong>{dispatchReadiness.statusLabel}</strong>
              <small>{dispatchReadiness.readyCount} / {dispatchReadiness.checks.length} checks</small>
            </div>
            <div className={closeoutReview.warnings.length ? "metric-tile metric-tile-review" : "metric-tile metric-tile-ready"}>
              <span>Closeout</span>
              <strong>{closeoutReview.warnings.length ? "Needs review" : "Ready"}</strong>
              <small>{closeoutReview.warnings.length} open items</small>
            </div>
            <div className={partsReview.blockerCount ? "metric-tile metric-tile-alert" : "metric-tile"}>
              <span>Parts</span>
              <strong>{partsReview.statusLabel}</strong>
              <small>{partsReview.blockerCount} blockers</small>
            </div>
            <div className="metric-tile">
              <span>Labor</span>
              <strong>{formatHours(laborSummary.approvedLaborHours)}</strong>
              <small>{laborSummary.approvedClosedTimeEntries.length} approved entries</small>
            </div>
            <div className="metric-tile">
              <span>Files/photos</span>
              <strong>{files.length}</strong>
              <small>{files.filter((file) => file.isInvoiceAttachment).length} invoice attachments</small>
            </div>
            <div className="metric-tile metric-tile-money">
              <span>Invoice-ready</span>
              <strong>{invoiceSummary ? formatCurrency(invoiceSummary.grandTotal) : "Not ready"}</strong>
              <small>{invoiceSummary ? "Report summary loaded" : "Use closeout checks"}</small>
            </div>
          </section>

          <section className="ticket-workbench-layout">
            <aside className="ticket-workbench-rail no-print" aria-label="ticket actions and readiness">
              <section className="workbench-panel workbench-panel-compact">
                <h3>Workbench Actions</h3>
                <button type="button" onClick={() => toggleDrawer("ticket")}>Edit Ticket</button>
                <button type="button" onClick={() => toggleDrawer("status")}>Change Status</button>
                <button type="button" onClick={() => toggleDrawer("part")}>Open Add / Request Part Panel</button>
                <button type="button" className="secondary-button" onClick={() => toggleDrawer("archive")}>Archive Review</button>
              </section>

              <section className="workbench-panel workbench-panel-compact">
                <h3>Ownership</h3>
                <div className="rail-facts">
                  <div>
                    <span>Lead tech</span>
                    <strong>{leadAssignment ? getEmployeeDisplayName(leadAssignment) : "Needs assignment"}</strong>
                  </div>
                  <div>
                    <span>Assigned</span>
                    <strong>{assignments.length}</strong>
                  </div>
                  <div>
                    <span>Scheduled</span>
                    <strong>{formatDate(job.scheduledStartAtUtc)}</strong>
                  </div>
                  <div>
                    <span>Requested</span>
                    <strong>{formatDate(job.requestedAtUtc)}</strong>
                  </div>
                </div>
              </section>

              <section className="workbench-panel workbench-panel-compact">
                <h3>Readiness</h3>
                <ul className="check-list" aria-label="dispatch readiness checks">
                  {dispatchReadiness.checks.map((check) => (
                    <li className={check.isReady ? "check-item-ready" : "check-item-open"} key={check.label}>
                      <strong>{check.label}</strong>
                      <span>{check.detail}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>

            <div className="ticket-workbench-main">
              {activeDrawer === "ticket" && editPayload ? (
                <section className="workbench-drawer no-print" aria-label="ticket editor panel">
                  <div className="workbench-panel-heading">
                    <div>
                      <h3>Edit Ticket</h3>
                      <p className="muted">Customer, service location, equipment, scope, billing handoff, dates, status, and priority.</p>
                    </div>
                    <button type="button" className="secondary-button" onClick={() => setActiveDrawer(null)}>Close</button>
                  </div>
                  <JobTicketEditorForm
                    initial={editPayload}
                    customers={customers}
                    serviceLocations={locations}
                    equipment={equipment}
                    submitLabel="Save Ticket"
                    onCustomerCreated={(created) => setCustomers((prev) => [created, ...prev.filter((item) => item.id !== created.id)])}
                    onServiceLocationCreated={(created) => setLocations((prev) => [created, ...prev.filter((item) => item.id !== created.id)])}
                    onEquipmentCreated={(created) => setEquipment((prev) => [created, ...prev.filter((item) => item.id !== created.id)])}
                    onSubmit={async (payload) => {
                      if (!jobTicketId) return;

                      try {
                        await jobTicketsApi.update(jobTicketId, payload);
                        setActiveDrawer(null);
                        setError(null);
                        setMessage("Ticket updated.");
                        await load();
                      } catch (requestError) {
                        setError(
                          requestError instanceof ApiError
                            ? requestError.message
                            : "Unable to update ticket.",
                        );
                        setMessage(null);
                      }
                    }}
                  />
                </section>
              ) : null}

              {activeDrawer === "status" ? (
                <section className="workbench-drawer no-print" aria-label="status workflow review">
                  <div className="workbench-panel-heading">
                    <div>
                      <h3>Status Review</h3>
                      <p className="muted">{statusReview.summary}</p>
                    </div>
                    <button type="button" className="secondary-button" onClick={() => setActiveDrawer(null)}>Close</button>
                  </div>
                  <div className="fact-grid">
                    <div>
                      <span>Current Status</span>
                      <strong>{statusReview.currentLabel}</strong>
                    </div>
                    <div>
                      <span>Selected Status</span>
                      <strong>{statusReview.nextLabel}</strong>
                    </div>
                    <div>
                      <span>Dispatch Readiness</span>
                      <strong>{dispatchReadiness.statusLabel}</strong>
                    </div>
                  </div>
                  {statusReview.warnings.length ? (
                    <ul className="muted" aria-label="status review warnings">
                      {statusReview.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  ) : null}
                  <form onSubmit={onStatusChange} className="stack">
                    <label className="stack">
                      Next Status
                      <select
                        value={statusValue}
                        onChange={(event) => setStatusValue(event.target.value)}
                      >
                        {jobStatusOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit" disabled={!statusReview.hasChange}>
                      {statusReview.hasChange ? `Update to ${statusReview.nextLabel}` : "Choose a new status"}
                    </button>
                  </form>
                </section>
              ) : null}

              {activeDrawer === "archive" ? (
                <section className="workbench-drawer no-print" aria-label="archive workflow review">
                  <div className="workbench-panel-heading">
                    <div>
                      <h3>Archive Review</h3>
                      <p className="muted">Archive keeps this ticket available for reporting and history. It does not hard delete the record.</p>
                    </div>
                    <button type="button" className="secondary-button" onClick={() => setActiveDrawer(null)}>Close</button>
                  </div>
                  {archiveReviewWarnings.length ? (
                    <ul className="muted" aria-label="archive review warnings">
                      {archiveReviewWarnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">This ticket looks ready for archive review if work is complete.</p>
                  )}
                  <form onSubmit={onArchiveRequest} className="stack">
                    <label className="stack">
                      Archive Reason
                      <input
                        value={archiveReason}
                        onChange={(event) => {
                          setArchiveReason(event.target.value);
                          if (archiveConfirmationOpen) {
                            setArchiveConfirmationOpen(false);
                          }
                        }}
                        placeholder="Archive reason"
                      />
                    </label>
                    <button type="submit">Review Archive</button>
                  </form>
                  {archiveConfirmationOpen ? (
                    <section className="confirmation-panel stack" aria-label="archive confirmation">
                      <p>Confirm archive for this job ticket?</p>
                      <div className="fact-grid">
                        <div>
                          <span>Current Status</span>
                          <strong>{getJobTicketStatusLabel(job.status)}</strong>
                        </div>
                        <div>
                          <span>Assigned Employees</span>
                          <strong>{assignments.length}</strong>
                        </div>
                        <div>
                          <span>Archive Reason</span>
                          <strong>{archiveReason.trim()}</strong>
                        </div>
                      </div>
                      <div className="row">
                        <button
                          type="button"
                          onClick={onArchiveConfirm}
                          disabled={isArchiving}
                        >
                          {isArchiving ? "Archiving..." : "Confirm Archive"}
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => setArchiveConfirmationOpen(false)}
                          disabled={isArchiving}
                        >
                          Cancel
                        </button>
                      </div>
                    </section>
                  ) : null}
                </section>
              ) : null}

              <article className="workbench-panel" aria-label="ticket overview, customer, location, and equipment">
                <div className="workbench-panel-heading">
                  <div>
                    <h3>Ticket Overview</h3>
                    <p className="muted">Customer, service location, equipment, service scope, and billing handoff.</p>
                  </div>
                  <button type="button" className="secondary-button no-print" onClick={() => toggleDrawer("ticket")}>Edit Ticket</button>
                </div>
                <div className="context-grid">
                  <section className="context-block" aria-label="customer">
                    <span>Customer</span>
                    <h4>{selectedCustomer?.name ?? job.customerId}</h4>
                    <p>{displayValue(selectedCustomer?.contactName)}</p>
                    <p className="muted">{displayValue(selectedCustomer?.phone)} | {displayValue(selectedCustomer?.email)}</p>
                    <p className="muted">Account {displayValue(selectedCustomer?.accountNumber)}</p>
                  </section>
                  <section className="context-block" aria-label="service location">
                    <span>Service Location</span>
                    <h4>{selectedLocation?.locationName ?? job.serviceLocationId}</h4>
                    <p>{getAddressLine(selectedLocation)}</p>
                    <p className="muted">{selectedLocation?.isActive === false ? "Inactive location" : "Active location"}</p>
                  </section>
                  <section className="context-block" aria-label="equipment">
                    <span>Equipment</span>
                    <h4>{job.equipmentId ? (selectedEquipment?.name ?? job.equipmentId) : "No equipment attached"}</h4>
                    <p>{displayValue(selectedEquipment?.equipmentType)} {displayValue(selectedEquipment?.manufacturer)} {displayValue(selectedEquipment?.modelNumber)}</p>
                    <p className="muted">Unit {displayValue(selectedEquipment?.unitNumber)} | Serial {displayValue(selectedEquipment?.serialNumber)}</p>
                  </section>
                </div>

                <div className="fact-grid" aria-label="job dispatch details">
                  <div>
                    <span>Job Type</span>
                    <strong>{displayValue(job.jobType)}</strong>
                  </div>
                  <div>
                    <span>Requested</span>
                    <strong>{formatDate(job.requestedAtUtc)}</strong>
                  </div>
                  <div>
                    <span>Scheduled</span>
                    <strong>{formatDate(job.scheduledStartAtUtc)}</strong>
                  </div>
                  <div>
                    <span>Due</span>
                    <strong>{formatDate(job.dueAtUtc)}</strong>
                  </div>
                  <div>
                    <span>Completed</span>
                    <strong>{formatDate(job.completedAtUtc)}</strong>
                  </div>
                  <div>
                    <span>Purchase Order</span>
                    <strong>{displayValue(job.purchaseOrderNumber)}</strong>
                  </div>
                </div>

                <div className="scope-grid">
                  <section>
                    <h4>Service Scope</h4>
                    <p>{job.description ?? "No work description."}</p>
                  </section>
                  <section>
                    <h4>Internal Notes</h4>
                    <p>{displayValue(job.internalNotes)}</p>
                  </section>
                  <section>
                    <h4>Customer Notes</h4>
                    <p>{displayValue(job.customerFacingNotes)}</p>
                  </section>
                  <section>
                    <h4>Billing Contact</h4>
                    <p>{billingParty?.name ?? job.billingPartyCustomerId}</p>
                    <p className="muted">{displayValue(job.billingContactName)} | {displayValue(job.billingContactPhone)} | {displayValue(job.billingContactEmail)}</p>
                  </section>
                </div>
              </article>

              <article className="workbench-panel" aria-label="assignments panel">
                <div className="workbench-panel-heading">
                  <div>
                    <h3>Assignments</h3>
                    <p className="muted">Current lead: {leadAssignment ? getEmployeeDisplayName(leadAssignment) : "Needs assignment"}</p>
                  </div>
                  <span className={assignmentLoadFailed ? "status-chip status-chip-alert" : "status-chip"}>{assignments.length} assigned</span>
                </div>
                {assignmentLoadFailed ? (
                  <p className="error" role="alert">Assignment data could not be loaded. Refresh before editing assignments or dispatch review.</p>
                ) : null}
                {assignments.length ? (
                  <ul className="record-list">
                    {assignments.map((item) => (
                      <li className="record-row" key={item.employeeId}>
                        <div>
                          <strong>{getEmployeeDisplayName(item)}</strong> {item.isLead ? <span className="status-chip">Lead Tech</span> : null}
                          <span className="muted">Assigned {formatDate(item.assignedAtUtc)}</span>
                        </div>
                        <button
                          type="button"
                          className="secondary-button no-print compact-button"
                          onClick={() => onRemoveAssignment(item.employeeId)}
                          disabled={assignmentLoadFailed}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No employees are assigned yet.</p>
                )}
                <form onSubmit={onAddAssignment} className="assignment-form no-print">
                  {employees.length ? (
                    <label>
                      Employee
                      <select
                        value={assignmentEmployeeId}
                        onChange={(e) => setAssignmentEmployeeId(e.target.value)}
                        aria-label="assignment employee"
                        disabled={assignmentLoadFailed}
                      >
                        <option value="">Select employee</option>
                        {employees
                          .filter((x) => !assignments.some((a) => a.employeeId === x.id))
                          .map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.firstName} {x.lastName}
                            </option>
                          ))}
                      </select>
                    </label>
                  ) : (
                    <label>
                      Employee
                      <input
                        value={assignmentEmployeeId}
                        onChange={(e) => setAssignmentEmployeeId(e.target.value)}
                        placeholder="Employee id"
                        aria-label="assignment employee"
                        disabled={assignmentLoadFailed}
                      />
                    </label>
                  )}
                  <label className="inline-check">
                    <input
                      type="checkbox"
                      checked={isLeadAssignment}
                      onChange={(e) => setIsLeadAssignment(e.target.checked)}
                      disabled={assignmentLoadFailed}
                    />
                    Lead Tech
                  </label>
                  <button type="submit" disabled={assignmentLoadFailed}>Assign Employee</button>
                </form>
              </article>

              <article className="workbench-panel" aria-label="status and priority panel">
                <div className="workbench-panel-heading">
                  <div>
                    <h3>Status / Priority</h3>
                    <p className="muted">{statusReview.summary}</p>
                  </div>
                  <button type="button" className="secondary-button no-print" onClick={() => toggleDrawer("status")}>Open Status Review</button>
                </div>
                <div className="fact-grid">
                  <div>
                    <span>Status</span>
                    <strong>{getJobTicketStatusLabel(job.status)}</strong>
                  </div>
                  <div>
                    <span>Priority</span>
                    <strong>{getJobTicketPriorityLabel(job.priority)}</strong>
                  </div>
                  <div>
                    <span>Dispatch Readiness</span>
                    <strong>{dispatchReadiness.statusLabel}</strong>
                  </div>
                  <div>
                    <span>Next Dispatch Fix</span>
                    <strong>{nextDispatchFix}</strong>
                  </div>
                </div>
                {dispatchWarnings.length ? (
                  <ul className="muted" aria-label="dispatch warnings">
                    {dispatchWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Assignment, lead tech, schedule, due date, customer, service location, and equipment or no-equipment signals are all present.</p>
                )}
              </article>

              <article className="workbench-panel" aria-label="time and labor panel">
                <div className="workbench-panel-heading">
                  <div>
                    <h3>Time / Labor</h3>
                    <p className="muted">Labor totals, time approvals, and work notes.</p>
                  </div>
                  <span className="status-chip">{timeEntries.length} time entries</span>
                </div>
                <div className="fact-grid">
                  <div>
                    <span>Labor Hours</span>
                    <strong>{formatHours(laborSummary.laborHours)}</strong>
                  </div>
                  <div>
                    <span>Billable Hours</span>
                    <strong>{formatHours(laborSummary.billableHours)}</strong>
                  </div>
                  <div>
                    <span>Approved Labor</span>
                    <strong>{formatHours(laborSummary.approvedLaborHours)}</strong>
                  </div>
                  <div>
                    <span>Pending Time</span>
                    <strong>{laborSummary.pendingTimeEntries.length}</strong>
                  </div>
                  <div>
                    <span>Open Time</span>
                    <strong>{laborSummary.openTimeEntries.length}</strong>
                  </div>
                  <div>
                    <span>Work Notes</span>
                    <strong>{entries.length}</strong>
                  </div>
                </div>
                <div className="two-column-section">
                  <section>
                    <h4>Labor / Work Entries</h4>
                    {entries.length ? (
                      <ul className="record-list">
                        {entries.map((item) => (
                          <li className="record-row" key={item.id}>
                            <div>
                              <strong>{formatDate(item.performedAtUtc)}</strong>
                              <span>{item.notes}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted">No work entries have been logged.</p>
                    )}
                  </section>
                  <section>
                    <h4>Time Entries</h4>
                    {timeEntries.length ? (
                      <ul className="record-list">
                        {timeEntries.map((item) => (
                          <li className="record-row" key={item.id}>
                            <div>
                              <strong>{getEmployeeNameById(item.employeeId)}</strong>
                              <span>
                                {formatHours(item.laborHours)} labor / {formatHours(item.billableHours)} billable - {getApprovalLabel(item.approvalStatus)}
                                {item.workSummary ? ` - ${item.workSummary}` : ""}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted">No time entries have been logged.</p>
                    )}
                  </section>
                </div>
              </article>

              <article className="workbench-panel" aria-label="ticket parts panel">
                <div className="workbench-panel-heading">
                  <div>
                    <h3>Parts</h3>
                    <p className="muted">Ticket parts and back-office request status.</p>
                  </div>
                  <button type="button" className="secondary-button no-print" onClick={() => toggleDrawer("part")}>Open Add / Request Part Panel</button>
                </div>
                <section className="parts-summary" aria-label="waiting on parts summary">
                  <div>
                    <span>Parts Status</span>
                    <strong>{partsReview.statusLabel}</strong>
                  </div>
                  <div>
                    <span>Open Blockers</span>
                    <strong>{partsReview.blockerCount}</strong>
                  </div>
                  <div>
                    <span>Needs Ordered</span>
                    <strong>{partsReview.needsOrdered.length}</strong>
                  </div>
                  <div>
                    <span>Pending Review</span>
                    <strong>{partsReview.pendingNeedsOrdered.length}</strong>
                  </div>
                  <div>
                    <span>Ticket Part Only</span>
                    <strong>{partsReview.ticketOnlyParts.length}</strong>
                  </div>
                </section>
                <p className="muted">{partsReview.nextAction}</p>
                {activeDrawer === "part" ? (
                  <section className="workbench-drawer no-print" aria-label="add or request part drawer">
                    <div className="workbench-panel-heading">
                      <div>
                        <h4>Add / Request Part</h4>
                        <p className="muted">Existing catalog match or typed unlisted part, quantity, notes, and Needs ordered routing.</p>
                      </div>
                      <button type="button" className="secondary-button" onClick={() => setActiveDrawer(null)}>Close</button>
                    </div>
                    <form onSubmit={onSubmitPart} className="stack" aria-label="add or request ticket part">
                      <label className="stack">
                        Find existing part or enter new part
                        <input
                          value={partDescription}
                          onChange={(event) => onPartDescriptionChange(event.target.value)}
                          placeholder="Search part number, name, or type a new part"
                        />
                      </label>
                      <label className="stack">
                        Existing parts match
                        <select value={selectedCatalogPartId} onChange={(event) => setSelectedCatalogPartId(event.target.value)}>
                          <option value="">Use typed new/unlisted part</option>
                          {catalogPartMatches.map((part) => (
                            <option key={part.id} value={part.id}>
                              {part.partNumber} - {part.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      {selectedCatalogPart ? (
                        <p className="muted">Selected existing part: {selectedCatalogPart.partNumber} - {selectedCatalogPart.name}</p>
                      ) : (
                        <p className="muted">No catalog match selected; the typed value will be submitted as an unlisted ticket part.</p>
                      )}
                      <div className="form-grid">
                        <label className="stack">
                          Quantity
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={partQuantity}
                            onChange={(event) => setPartQuantity(event.target.value)}
                            required
                          />
                        </label>
                        <label className="stack">
                          Notes
                          <input value={partNotes} onChange={(event) => setPartNotes(event.target.value)} />
                        </label>
                        <label className="inline-check">
                          <input
                            type="checkbox"
                            checked={partNeedsOrdered}
                            onChange={(event) => setPartNeedsOrdered(event.target.checked)}
                          />
                          Needs ordered
                        </label>
                        {partNeedsOrdered ? (
                          <>
                            <label className="stack">
                              Urgency
                              <select value={partUrgency} onChange={(event) => setPartUrgency(event.target.value)}>
                                <option value="">Routine</option>
                                <option value="Soon">Soon</option>
                                <option value="Urgent">Urgent</option>
                              </select>
                            </label>
                            <label className="stack">
                              Needed by
                              <input type="date" value={partNeededBy} onChange={(event) => setPartNeededBy(event.target.value)} />
                            </label>
                          </>
                        ) : null}
                      </div>
                      <button type="submit" disabled={isSubmittingPart}>
                        {isSubmittingPart ? "Adding part..." : "Submit Part Request"}
                      </button>
                    </form>
                  </section>
                ) : null}
                {parts.length ? (
                  <ul className="record-list">
                    {parts.map((item) => (
                      <li className="record-row" key={item.id}>
                        <div>
                          <strong>{getPartDisplayName(item)}{item.isUnlistedPart ? " (unlisted)" : ""}</strong>
                          <span>
                            Qty {numberFormatter.format(item.quantity)} - {getPartRequestLabel(item)} - {getPartReviewLabel(item.approvalStatus)}
                            {item.officeOrderNotes ? ` - ${item.officeOrderNotes}` : ""}
                            {item.notes ? ` - ${item.notes}` : ""}
                            {item.rejectionReason ? ` - Rejection: ${item.rejectionReason}` : ""}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No parts usage has been logged.</p>
                )}
              </article>

              <article className="workbench-panel" aria-label="files and photos panel">
                <div className="workbench-panel-heading">
                  <div>
                    <h3>Files / Photos</h3>
                    <p className="muted">{files.length} attached files, {files.filter((file) => file.isInvoiceAttachment).length} marked for invoice review.</p>
                  </div>
                </div>
                {files.length ? (
                  <ul className="record-list">
                    {files.map((item) => (
                      <li className="record-row" key={item.id}>
                        <div>
                          <strong>
                            <a href={filesApi.getDownloadUrl(item.jobTicketId, item.id)}>
                              {item.originalFileName}
                            </a>
                          </strong>
                          <span>{formatFileSize(item.fileSizeBytes)} - {formatDate(item.uploadedAtUtc)}{item.isInvoiceAttachment ? " - Invoice attachment" : ""}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No files or photos have been uploaded.</p>
                )}
              </article>

              <article className="workbench-panel" aria-label="activity panel">
                <div className="workbench-panel-heading">
                  <div>
                    <h3>Activity</h3>
                    <p className="muted">Recent work notes, time entries, parts, and file/photo activity.</p>
                  </div>
                </div>
                {activityItems.length ? (
                  <ol className="activity-timeline">
                    {activityItems.map((item) => (
                      <li key={item.id}>
                        <span>{item.type}</span>
                        <strong>{item.title}</strong>
                        <p>{item.detail}</p>
                        <small>{formatDate(item.occurredAtUtc)}</small>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="muted">No ticket activity has been recorded yet.</p>
                )}
              </article>

              <article className="workbench-panel" aria-label="closeout invoice readiness review">
                <div className="workbench-panel-heading">
                  <div>
                    <h3>Invoice-ready Summary</h3>
                    <p className="muted">Closeout readiness and existing invoice-ready report totals.</p>
                  </div>
                  <span className={closeoutReview.warnings.length ? "status-chip status-chip-review" : "status-chip status-chip-ready"}>
                    {closeoutReview.warnings.length ? "Needs closeout review" : "Ready for invoice handoff"}
                  </span>
                </div>
                <div className="fact-grid">
                  <div>
                    <span>Readiness Checks</span>
                    <strong>{closeoutReview.readyCount} / {closeoutReview.checks.length}</strong>
                  </div>
                  <div>
                    <span>Open Items</span>
                    <strong>{closeoutReview.warnings.length}</strong>
                  </div>
                  <div>
                    <span>Approved Labor</span>
                    <strong>{invoiceSummary ? formatHours(invoiceSummary.laborHours) : formatHours(laborSummary.approvedLaborHours)}</strong>
                  </div>
                  <div>
                    <span>Approved Parts</span>
                    <strong>{invoiceSummary ? invoiceSummary.approvedParts.length : partsReview.approvedParts.length}</strong>
                  </div>
                  <div>
                    <span>Labor Billable</span>
                    <strong>{invoiceSummary ? formatCurrency(invoiceSummary.laborBillableTotal) : emptyDisplay}</strong>
                  </div>
                  <div>
                    <span>Parts Billable</span>
                    <strong>{invoiceSummary ? formatCurrency(invoiceSummary.partsBillableTotal) : emptyDisplay}</strong>
                  </div>
                  <div>
                    <span>Tax</span>
                    <strong>{invoiceSummary ? formatCurrency(invoiceSummary.tax) : emptyDisplay}</strong>
                  </div>
                  <div>
                    <span>Grand Total</span>
                    <strong>{invoiceSummary ? formatCurrency(invoiceSummary.grandTotal) : emptyDisplay}</strong>
                  </div>
                </div>
                {invoiceSummaryError ? <p className="warning">{invoiceSummaryError}</p> : null}
                {invoiceSummary ? (
                  <div className="two-column-section">
                    <section>
                      <h4>Approved Labor Lines</h4>
                      {invoiceSummary.approvedLaborEntries.length ? (
                        <ul className="record-list">
                          {invoiceSummary.approvedLaborEntries.map((entry) => (
                            <li className="record-row" key={entry.timeEntryId}>
                              <div>
                                <strong>{entry.employeeName}</strong>
                                <span>{formatHours(entry.laborHours)} labor / {formatHours(entry.billableHours)} billable</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="muted">No approved labor lines are in the report summary.</p>
                      )}
                    </section>
                    <section>
                      <h4>Approved Parts Lines</h4>
                      {invoiceSummary.approvedParts.length ? (
                        <ul className="record-list">
                          {invoiceSummary.approvedParts.map((part) => (
                            <li className="record-row" key={part.jobTicketPartId}>
                              <div>
                                <strong>{part.partNumber} - {part.partName}</strong>
                                <span>Qty {numberFormatter.format(part.quantity)} - {formatCurrency(part.unitPriceSnapshot)}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="muted">No approved parts lines are in the report summary.</p>
                      )}
                    </section>
                  </div>
                ) : (
                  <p className="muted">No invoice-ready report is available yet.</p>
                )}
                {closeoutReview.warnings.length ? (
                  <ul className="muted" aria-label="invoice readiness warnings">
                    {closeoutReview.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Labor, time approval, parts, files/photos, notes, and billing handoff context are ready for invoice review.</p>
                )}
              </article>
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}
