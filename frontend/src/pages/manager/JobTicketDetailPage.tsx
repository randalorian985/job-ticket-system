import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
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
  ReportServiceHistoryItemDto,
  ServiceLocationDto,
  TicketTimelineItemDto,
  TimeEntryDto,
  AssignableEmployeeDto,
} from "../../types";
import {
  getJobTicketPriorityLabel,
  getJobTicketStatusLabel,
  getWorkLocationTypeLabel,
} from "../employee/jobDisplay";
import {
  formatDate,
  getApprovalLabel,
  jobStatusOptions,
  JOB_PART_APPROVAL_STATUS,
  TIME_ENTRY_APPROVAL_STATUS,
} from "./managerDisplay";
import { JobTicketEditorForm } from "./JobTicketEditorForm";
import {
  MobileQuickActions,
  RecommendedActionPanel,
  TicketWorkbenchHero,
  TicketWorkbenchRail,
  WorkflowFocusHeading,
  WorkflowTabs,
} from "./jobTicketDetail/JobTicketWorkbenchShell";
import {
  allowedManagerUploadTypes,
  displayValue,
  emptyDisplay,
  formatCurrency,
  formatFileSize,
  formatHours,
  getAddressLine,
  getPartDisplayName,
  getPartRequestLabel,
  getPartReviewLabel,
  isWorkflowTab,
  numberFormatter,
  primaryWorkflowPanelNames,
  sortActivityDescending,
  workflowTabs,
  type ActivityItem,
  type WorkbenchDrawer,
  type WorkflowTab,
} from "./jobTicketDetail/jobTicketDetailHelpers";
import { activeDispatchStatusValues, getSafeManagerReturnContext } from "./managerTaskNavigation";

export function JobTicketDetailPage() {
  const { jobTicketId } = useParams<{ jobTicketId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab: WorkflowTab = isWorkflowTab(requestedTab) ? requestedTab : "overview";
  const workflowFocusMode = searchParams.get("view") === "workflow";
  const { returnTo, returnLabel } = getSafeManagerReturnContext(searchParams);
  const { user } = useAuth();
  const [job, setJob] = useState<JobTicketDto | null>(null);
  const [assignments, setAssignments] = useState<JobTicketAssignmentDto[]>([]);
  const [assignmentLoadFailed, setAssignmentLoadFailed] = useState(false);
  const [entries, setEntries] = useState<JobWorkEntryDto[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntryDto[]>([]);
  const [parts, setParts] = useState<JobTicketPartDto[]>([]);
  const [catalogParts, setCatalogParts] = useState<PartDto[]>([]);
  const [files, setFiles] = useState<JobTicketFileDto[]>([]);
  const [timeline, setTimeline] = useState<TicketTimelineItemDto[]>([]);
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
  const [quickNote, setQuickNote] = useState("");
  const [isSavingQuickNote, setIsSavingQuickNote] = useState(false);
  const [quickUploadFile, setQuickUploadFile] = useState<File | null>(null);
  const [quickUploadCaption, setQuickUploadCaption] = useState("");
  const [quickUploadForInvoice, setQuickUploadForInvoice] = useState(false);
  const [isUploadingQuickFile, setIsUploadingQuickFile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [equipmentServiceHistory, setEquipmentServiceHistory] = useState<ReportServiceHistoryItemDto[]>([]);
  const [isLoadingEquipmentHistory, setIsLoadingEquipmentHistory] = useState(false);

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

    return assignment.employeeName?.trim() || name || "Employee unavailable";
  };

  const getEmployeeNameById = (employeeId?: string | null) => {
    if (!employeeId) {
      return "Unassigned";
    }

    const employee = employeesById[employeeId];
    return employee
      ? `${employee.firstName} ${employee.lastName}`.trim()
      : job?.assignedManagerEmployeeId === employeeId
        ? job.assignedManagerEmployeeName?.trim() || "Manager unavailable"
        : "Employee unavailable";
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
            detail: "Assignment data could not be loaded. Refresh or retry before assignment review.",
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
        label: "Work status",
        isReady: isActiveDispatchStatus,
        detail: isActiveDispatchStatus
          ? "Ticket is in the active work queue."
          : "Ticket is outside the active work queue.",
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
        label: "Service equipment",
        isReady: Boolean(job),
        detail: job?.equipmentId
          ? "Crane/equipment being serviced is selected."
          : "No service equipment is selected; check the job scope for component-only work.",
      },
    ];
    const warnings = checks
      .filter((check) => !check.isReady)
      .map((check) => check.detail);

    return {
      checks,
      readyCount: checks.filter((check) => check.isReady).length,
      statusLabel: !isActiveDispatchStatus
        ? "Not active work"
        : assignmentLoadFailed
          ? "Assignment data unavailable"
          : warnings.length
            ? "Needs attention"
            : "Ready to work",
      warnings,
    };
  }, [assignmentLoadFailed, assignments, employeesById, job, leadAssignment]);

  const dispatchWarnings = dispatchReadiness.warnings;
  const nextDispatchFix = dispatchWarnings[0] ?? "All assignment and schedule requirements are complete.";

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
        label: "Service equipment review",
        isReady: Boolean(job?.equipmentId),
        detail: job?.equipmentId
          ? "Crane/equipment being serviced is listed for review."
          : "If no service equipment is listed, confirm the component or part is clear in the job scope before invoice review.",
      },
      {
        label: "Billing information",
        isReady: Boolean(
          job?.billingPartyCustomerId ||
          job?.purchaseOrderNumber?.trim() ||
          job?.billingContactName?.trim() ||
          job?.billingContactEmail?.trim() ||
          job?.billingContactPhone?.trim(),
        ),
        detail: job?.billingPartyCustomerId || job?.purchaseOrderNumber?.trim() || job?.billingContactName?.trim()
          ? "Billing party, purchase order, or billing contact is present."
          : "Add a purchase order, billing party, or billing contact before invoice handoff.",
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
              ...dispatchWarnings.map((warning) => `Assignment readiness: ${warning}`),
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
      summary = `${summary} Current assignment, schedule, and history cues do not show any obvious blockers.`;
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
    try {
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
        setTimeline(await jobTicketsApi.getTimeline(jobTicketId).catch(() => []))
      }

      setError(null);
    } catch (requestError) {
      if (
        requestError instanceof ApiError &&
        (requestError.status === 401 || requestError.status === 403)
      ) {
        setError("You do not have permission to load this manager view.");
      } else {
        setError("Unable to load job ticket details.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [jobTicketId]);

  useEffect(() => {
    const equipmentId = job?.equipmentId;
    if (!equipmentId) {
      setEquipmentServiceHistory([]);
      return;
    }
    setIsLoadingEquipmentHistory(true);
    reportsApi.getEquipmentHistory(equipmentId, { offset: 0, limit: 3 })
      .then((items) => setEquipmentServiceHistory(items))
      .catch(() => setEquipmentServiceHistory([]))
      .finally(() => setIsLoadingEquipmentHistory(false));
  }, [job?.equipmentId]);

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

  const onAddQuickNote = async (event: FormEvent) => {
    event.preventDefault();
    if (!jobTicketId || !quickNote.trim()) {
      setError("Enter a note before saving.");
      setMessage(null);
      return;
    }

    setIsSavingQuickNote(true);
    setError(null);
    setMessage(null);
    try {
      await jobTicketsApi.addWorkEntry(jobTicketId, {
        employeeId: user?.employeeId ?? null,
        entryType: 1,
        notes: quickNote.trim(),
        performedAtUtc: new Date().toISOString(),
      });
      setQuickNote("");
      setActiveDrawer(null);
      setMessage("Note added to the ticket history.");
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to add note.",
      );
      setMessage(null);
    } finally {
      setIsSavingQuickNote(false);
    }
  };

  const onUploadQuickFile = async (event: FormEvent) => {
    event.preventDefault();
    if (!jobTicketId || !quickUploadFile) {
      setError("Choose a photo or file before uploading.");
      setMessage(null);
      return;
    }

    if (!allowedManagerUploadTypes.includes(quickUploadFile.type)) {
      setError("Unsupported file type. Allowed: jpg, png, webp, or pdf.");
      setMessage(null);
      return;
    }

    const formData = new FormData();
    formData.append("File", quickUploadFile);
    formData.append("Caption", quickUploadCaption);
    formData.append("IsInvoiceAttachment", quickUploadForInvoice ? "true" : "false");

    setIsUploadingQuickFile(true);
    setError(null);
    setMessage(null);
    try {
      await filesApi.upload(jobTicketId, formData);
      setQuickUploadFile(null);
      setQuickUploadCaption("");
      setQuickUploadForInvoice(false);
      setActiveDrawer(null);
      setMessage("Photo/file uploaded.");
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to upload photo or file.",
      );
      setMessage(null);
    } finally {
      setIsUploadingQuickFile(false);
    }
  };

  const editPayload: CreateJobTicketDto | null = job
    ? {
        customerId: job.customerId,
        serviceLocationId: job.serviceLocationId,
        billingPartyCustomerId: job.billingPartyCustomerId,
        equipmentId: job.equipmentId,
        locationType: job.locationType ?? 1,
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

  const selectWorkflowTab = (tab: WorkflowTab, focusWorkflow = true) => {
    if (focusWorkflow) {
      setActiveDrawer(null);
    }
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      if (tab === "overview") {
        nextParams.delete("tab");
      } else {
        nextParams.set("tab", tab);
      }
      if (focusWorkflow) {
        nextParams.set("view", "workflow");
      }
      return nextParams;
    }, { replace: true });
  };

  const openRecommendedWorkflow = (tab: WorkflowTab) => {
    setActiveDrawer(null);
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      if (tab === "overview") nextParams.delete("tab");
      else nextParams.set("tab", tab);
      nextParams.set("view", "workflow");
      return nextParams;
    });
  };

  const closeWorkflowFocus = () => {
    setActiveDrawer(null);
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.delete("view");
      return nextParams;
    });
  };

  const openWorkflowDrawer = (tab: WorkflowTab, drawer: Exclude<WorkbenchDrawer, null>) => {
    if (activeDrawer !== drawer) {
      selectWorkflowTab(tab, true);
    }
    toggleDrawer(drawer);
  };

  const handleWorkflowTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentTab: WorkflowTab) => {
    const currentIndex = workflowTabs.findIndex((tab) => tab.value === currentTab);
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % workflowTabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + workflowTabs.length) % workflowTabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = workflowTabs.length - 1;
    else return;

    event.preventDefault();
    const nextTab = workflowTabs[nextIndex].value;
    selectWorkflowTab(nextTab, true);
    document.getElementById(`ticket-workflow-tab-${nextTab}`)?.focus();
  };

  const getWorkflowPanelProps = (tab: WorkflowTab, panelName: string) => ({
    id: `ticket-workflow-panel-${panelName}`,
    role: primaryWorkflowPanelNames[tab] === panelName ? "tabpanel" : "region",
    "aria-labelledby": `ticket-workflow-tab-${tab}`,
    hidden: activeTab !== tab,
    tabIndex: -1,
    className: "workbench-panel workflow-tab-panel",
  });

  const hasActiveDispatchBlocker = Boolean(job && activeDispatchStatusValues.has(job.status) && dispatchWarnings.length);
  const recommendedWorkflow: WorkflowTab = hasActiveDispatchBlocker
    ? "dispatch"
    : partsReview.blockerCount
      ? "parts"
      : closeoutReview.warnings.length
        ? "closeout"
        : "overview";
  const recommendedActionDetail = hasActiveDispatchBlocker
    ? job?.status === 2
      ? "Open Scheduling to assign the technician and service window for this submitted ticket."
      : dispatchWarnings[0]
    : partsReview.blockerCount
      ? partsReview.nextAction
      : closeoutReview.warnings[0] ?? "Review the service details and continue the current ticket work.";
  const recommendedWorkflowLabel = recommendedWorkflow === "dispatch"
    ? "Scheduling"
    : workflowTabs.find((tab) => tab.value === recommendedWorkflow)?.label ?? "Overview";
  const activeWorkflowLabel = workflowTabs.find((tab) => tab.value === activeTab)?.label ?? "Overview";
  const recommendedActionTitle = hasActiveDispatchBlocker
    ? job?.status === 2 ? "Send to Scheduling" : "Review scheduling details"
    : partsReview.blockerCount
      ? "Review parts blocker"
      : closeoutReview.warnings.length
        ? "Finish invoice review"
        : "Review service details";
  const recommendedActionStatus = hasActiveDispatchBlocker
    ? dispatchReadiness.statusLabel
    : partsReview.blockerCount
      ? `${partsReview.blockerCount} parts blocker${partsReview.blockerCount === 1 ? "" : "s"}`
      : closeoutReview.warnings.length
        ? `${closeoutReview.warnings.length} invoice review item${closeoutReview.warnings.length === 1 ? "" : "s"} open`
        : "No immediate blockers visible";

  const openLaborWorkflow = () => {
    selectWorkflowTab("time", true);
    setActiveDrawer(null);
  };

  useEffect(() => {
    if (!workflowFocusMode || activeDrawer) return;
    document.getElementById(`ticket-workflow-panel-${primaryWorkflowPanelNames[activeTab]}`)?.focus();
  }, [activeDrawer, activeTab, workflowFocusMode]);

  useEffect(() => {
    if (!activeDrawer) return;
    document.getElementById(`ticket-workbench-drawer-${activeDrawer}`)?.focus();
  }, [activeDrawer]);

  if (!canShow) return <section className="card">Missing job id.</section>;

  return (
    <section className="ticket-workbench-page stack">
      <nav className="breadcrumb-line" aria-label="Breadcrumb">
        <Link to="/manage">Dashboard</Link>
        <span aria-hidden="true">/</span>
        <Link to={returnTo}>Back to {returnLabel}</Link>
        {job ? <><span aria-hidden="true">/</span><span aria-current="page">Ticket detail</span></> : null}
      </nav>
      {isLoading ? (
        <p className="muted" role="status">
          Loading job review details...
        </p>
      ) : null}
      {error ? <p className="error" role="alert">{error}</p> : null}
      {message ? <p className="success" role="status">{message}</p> : null}
      {job ? (
        <>
          <TicketWorkbenchHero
            activeDrawer={activeDrawer}
            job={job}
            selectedBillingParty={billingParty}
            selectedCustomer={selectedCustomer}
            selectedEquipment={selectedEquipment}
            selectedLocation={selectedLocation}
            workflowFocusMode={workflowFocusMode}
            onOpenDrawer={openWorkflowDrawer}
          />

          <RecommendedActionPanel
            actionDetail={recommendedActionDetail}
            actionStatus={recommendedActionStatus}
            actionTitle={recommendedActionTitle}
            actionHref={recommendedWorkflow === "dispatch" ? "/manage/schedule" : undefined}
            recommendedWorkflow={recommendedWorkflow}
            workflowFocusMode={workflowFocusMode}
            workflowLabel={recommendedWorkflowLabel}
            onOpenWorkflow={openRecommendedWorkflow}
          />

          <WorkflowFocusHeading
            activeWorkflowLabel={activeWorkflowLabel}
            job={job}
            workflowFocusMode={workflowFocusMode}
            onClose={closeWorkflowFocus}
          />

          <WorkflowTabs
            activeTab={activeTab}
            onSelectWorkflowTab={selectWorkflowTab}
            onWorkflowTabKeyDown={handleWorkflowTabKeyDown}
          />

          <MobileQuickActions
            workflowFocusMode={workflowFocusMode}
            onOpenDrawer={openWorkflowDrawer}
            onOpenLabor={openLaborWorkflow}
          />

          <section className={workflowFocusMode ? "ticket-workbench-layout ticket-workbench-layout-focused" : "ticket-workbench-layout"}>
            <div className="ticket-workbench-main">
              {activeDrawer === "ticket" && editPayload ? (
                <section id="ticket-workbench-drawer-ticket" className="workbench-drawer no-print" aria-label="ticket editor panel" tabIndex={-1}>
                  <div className="workbench-panel-heading">
                    <div>
                      <h3>Edit Ticket</h3>
                      <p className="muted">Customer, service location, equipment, scope, billing information, dates, status, and priority.</p>
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

              {activeDrawer === "note" ? (
                <section id="ticket-workbench-drawer-note" className="workbench-drawer no-print" aria-label="quick note panel" tabIndex={-1}>
                  <div className="workbench-panel-heading">
                    <div>
                      <h3>Add Note</h3>
                      <p className="muted">Save a Manager/Admin work note to the ticket history without opening the full editor.</p>
                    </div>
                    <button type="button" className="secondary-button" onClick={() => setActiveDrawer(null)}>Close</button>
                  </div>
                  <form className="stack" onSubmit={onAddQuickNote}>
                    <label>Ticket Note
                      <textarea
                        aria-label="Ticket note"
                        value={quickNote}
                        onChange={(event) => setQuickNote(event.target.value)}
                        placeholder="Add a clear note for assignments, closeout, or customer follow-up."
                      />
                    </label>
                    <div className="row">
                      <button type="submit" disabled={isSavingQuickNote}>{isSavingQuickNote ? "Saving note..." : "Save Note"}</button>
                      <button type="button" className="secondary-button" onClick={() => setActiveDrawer(null)}>Cancel</button>
                    </div>
                  </form>
                </section>
              ) : null}

              {activeDrawer === "photo" ? (
                <section id="ticket-workbench-drawer-photo" className="workbench-drawer no-print" aria-label="quick file upload panel" tabIndex={-1}>
                  <div className="workbench-panel-heading">
                    <div>
                      <h3>Add File</h3>
                      <p className="muted">Upload a job photo, PDF, or closeout attachment from the ticket workspace.</p>
                    </div>
                    <button type="button" className="secondary-button" onClick={() => setActiveDrawer(null)}>Close</button>
                  </div>
                  <form className="stack" onSubmit={onUploadQuickFile}>
                    <label>Photo or File
                      <input
                        aria-label="Photo or file"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(event) => setQuickUploadFile(event.target.files?.[0] ?? null)}
                      />
                    </label>
                    <label>Caption
                      <input
                        value={quickUploadCaption}
                        onChange={(event) => setQuickUploadCaption(event.target.value)}
                        placeholder="Optional caption or closeout note"
                      />
                    </label>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={quickUploadForInvoice}
                        onChange={(event) => setQuickUploadForInvoice(event.target.checked)}
                      />
                      Mark for invoice review
                    </label>
                    <div className="row">
                      <button type="submit" disabled={isUploadingQuickFile}>{isUploadingQuickFile ? "Uploading..." : "Upload File"}</button>
                      <button type="button" className="secondary-button" onClick={() => setActiveDrawer(null)}>Cancel</button>
                    </div>
                    <p className="muted">Allowed file types: JPG, PNG, WebP, or PDF.</p>
                  </form>
                </section>
              ) : null}

              {activeDrawer === "status" ? (
                <section id="ticket-workbench-drawer-status" className="workbench-drawer no-print" aria-label="status review" tabIndex={-1}>
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
                      <span>Work Readiness</span>
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
                <section id="ticket-workbench-drawer-archive" className="workbench-drawer no-print" aria-label="archive review" tabIndex={-1}>
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

              <article {...getWorkflowPanelProps("overview", "ticket-overview")} aria-label="service details, customer, location, and equipment">
                <div className="workbench-panel-heading">
                  <div>
                    <h3>Service Details</h3>
                    <p className="muted">Customer, service location, equipment, service scope, and billing information.</p>
                  </div>
                  <button type="button" className="secondary-button no-print" onClick={() => toggleDrawer("ticket")}>Edit Ticket</button>
                </div>
                <div className="context-grid">
                  <section className="context-block" aria-label="customer">
                    <span>Customer</span>
                    <h4>{selectedCustomer?.name ?? job.customerName ?? "Customer unavailable"}</h4>
                    <p>{displayValue(selectedCustomer?.contactName)}</p>
                    <p className="muted">{displayValue(selectedCustomer?.phone)} | {displayValue(selectedCustomer?.email)}</p>
                    <p className="muted">Account {displayValue(selectedCustomer?.accountNumber)}</p>
                  </section>
                  <section className="context-block" aria-label="service location">
                    <span>Service Location</span>
                    <h4>{selectedLocation?.locationName ?? job.serviceLocationName ?? "Location unavailable"}</h4>
                    <p>{getAddressLine(selectedLocation)}</p>
                    <p className="muted">
                      {selectedLocation
                        ? selectedLocation.isActive === false ? "Inactive location" : "Active location"
                        : "Location status unavailable"}
                    </p>
                  </section>
                  <section className="context-block" aria-label="equipment being serviced">
                    <span>Crane / Equipment Being Serviced</span>
                    <h4>{job.equipmentId ? (selectedEquipment?.name ?? job.equipmentName ?? "Equipment unavailable") : "See job scope"}</h4>
                    <p>{displayValue(selectedEquipment?.equipmentType)} {displayValue(selectedEquipment?.manufacturer)} {displayValue(selectedEquipment?.modelNumber)}</p>
                    {!selectedEquipment && job.equipmentNumber ? <p className="muted">Equipment {job.equipmentNumber}</p> : null}
                    <p className="muted">Unit {displayValue(selectedEquipment?.unitNumber)} | Serial {displayValue(selectedEquipment?.serialNumber)}</p>
                    {job.equipmentId && (
                      <p className="muted">
                        <Link to={`/manage/equipment/${job.equipmentId}/history`}>View Full Equipment History</Link>
                      </p>
                    )}
                  </section>
                </div>

                {job.equipmentId && (
                  <section aria-label="recent equipment service history" className="stack">
                    <h4>Recent Equipment Service History</h4>
                    {isLoadingEquipmentHistory && <p className="muted">Loading…</p>}
                    {!isLoadingEquipmentHistory && equipmentServiceHistory.length === 0 && (
                      <p className="muted">No prior service tickets for this equipment.</p>
                    )}
                    {equipmentServiceHistory.length > 0 && (
                      <>
                        <ul className="record-list" aria-label="recent tickets for equipment">
                          {equipmentServiceHistory.map((item) => (
                            <li className="record-row" key={item.jobTicketId}>
                              <div>
                                <strong>
                                  <Link to={`/manage/job-tickets/${item.jobTicketId}`}>{item.jobTicketNumber} — {item.title}</Link>
                                </strong>
                                <span className="muted">{getJobTicketStatusLabel(item.jobStatus)} · {formatDate(item.createdAtUtc)}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <p className="muted">
                          <Link to={`/manage/equipment/${job.equipmentId}/history`}>View all service history →</Link>
                        </p>
                      </>
                    )}
                  </section>
                )}

                <div className="fact-grid" aria-label="job assignment and schedule details">
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
                    <p>{billingParty?.name ?? job.billingPartyCustomerName ?? "Billing party unavailable"}</p>
                    <p className="muted">{displayValue(job.billingContactName)} | {displayValue(job.billingContactPhone)} | {displayValue(job.billingContactEmail)}</p>
                  </section>
                </div>
              </article>

              <article {...getWorkflowPanelProps("dispatch", "assignments")} aria-label="technician assignments panel">
                <div className="workbench-panel-heading">
                  <div>
                    <h3>Technician Assignments</h3>
                    <p className="muted">Current lead: {leadAssignment ? getEmployeeDisplayName(leadAssignment) : "Needs assignment"}</p>
                  </div>
                  <span className={assignmentLoadFailed ? "status-chip status-chip-alert" : "status-chip"}>{assignments.length} assigned</span>
                </div>
                {assignmentLoadFailed ? (
                  <p className="error" role="alert">Assignment data could not be loaded. Refresh before editing assignments or assignment review.</p>
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
                  ) : <p className="muted">No active technicians are available to assign.</p>}
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

              <article {...getWorkflowPanelProps("overview", "status-priority")} aria-label="ticket status and priority panel">
                <div className="workbench-panel-heading">
                  <div>
                    <h3>Ticket Status &amp; Priority</h3>
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
                    <span>Work Location</span>
                    <strong>{getWorkLocationTypeLabel(job.locationType || 1)}</strong>
                  </div>
                  <div>
                    <span>Work Readiness</span>
                    <strong>{dispatchReadiness.statusLabel}</strong>
                  </div>
                  <div>
                    <span>Next Required Update</span>
                    <strong>{nextDispatchFix}</strong>
                  </div>
                </div>
                {dispatchWarnings.length ? (
                  <ul className="muted" aria-label="assignment warnings">
                    {dispatchWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Employee assignment, lead tech, schedule, due date, customer, service location, and service equipment choice are all present.</p>
                )}
              </article>

              <article {...getWorkflowPanelProps("time", "time-labor")} aria-label="labor and time entries panel">
                <div className="workbench-panel-heading">
                  <div>
                    <h3>Labor &amp; Time Entries</h3>
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

              <article {...getWorkflowPanelProps("parts", "parts")} aria-label="parts used and requested panel">
                <div className="workbench-panel-heading">
                  <div>
                    <h3>Parts Used &amp; Requested</h3>
                    <p className="muted">Ticket parts and back-office request status.</p>
                  </div>
                  <button type="button" className="secondary-button no-print" onClick={() => toggleDrawer("part")}>Add Part</button>
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
                  <section id="ticket-workbench-drawer-part" className="workbench-drawer no-print" aria-label="add or request part drawer" tabIndex={-1}>
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

              <article {...getWorkflowPanelProps("files", "files")} aria-label="job files and photos panel">
                <div className="workbench-panel-heading">
                  <div>
                    <h3>Job Files &amp; Photos</h3>
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

              <article {...getWorkflowPanelProps("activity", "activity")} aria-label="ticket history panel">
                <div className="workbench-panel-heading">
                  <div>
                    <h3>Ticket History</h3>
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
                {timeline.length > 0 ? (
                  <details className="ticket-audit-trail">
                    <summary>Full audit trail ({timeline.length} events)</summary>
                    <ol className="ticket-audit-list">
                      {timeline.map((item) => (
                        <li key={item.id} className="ticket-audit-item">
                          <span className="ticket-audit-description">{item.description}</span>
                          <span className="ticket-audit-meta">
                            {item.actorName ? `${item.actorName} — ` : ''}{new Date(item.occurredAtUtc).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </details>
                ) : null}
              </article>

              <article {...getWorkflowPanelProps("closeout", "closeout")} aria-label="invoice review">
                <div className="workbench-panel-heading">
                  <div>
                    <h3>Invoice Review</h3>
                    <p className="muted">Invoice requirements and the existing invoice-ready report totals.</p>
                  </div>
                  <span className={closeoutReview.warnings.length ? "status-chip status-chip-review" : "status-chip status-chip-ready"}>
                    {closeoutReview.warnings.length ? "Needs closeout review" : "Ready for invoice handoff"}
                  </span>
                </div>
                <section className={closeoutReview.warnings.length ? "closeout-next-steps closeout-next-steps-open" : "closeout-next-steps closeout-next-steps-ready"} aria-label="invoice review next steps">
                  <div>
                    <span>{closeoutReview.warnings.length ? "Open closeout requirements" : "Invoice review path"}</span>
                    <strong>{closeoutReview.warnings.length ? `${closeoutReview.warnings.length} item${closeoutReview.warnings.length === 1 ? "" : "s"} need attention` : "Ready for billing handoff"}</strong>
                  </div>
                  {closeoutReview.warnings.length ? (
                    <ol>
                      {closeoutReview.warnings.slice(0, 4).map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ol>
                  ) : (
                    <p>Labor, time approval, parts, documentation, notes, billing details, and closeout status are ready for invoice review.</p>
                  )}
                  <div className="closeout-action-row">
                    <button type="button" className="secondary-button" onClick={() => openWorkflowDrawer("overview", "status")}>Change Status</button>
                    <button type="button" className="secondary-button" onClick={() => selectWorkflowTab("time", true)}>Review Labor</button>
                    <button type="button" className="secondary-button" onClick={() => openWorkflowDrawer("files", "photo")}>Add File</button>
                  </div>
                </section>
                <div className="fact-grid">
                  <div>
                    <span>Invoice Checks</span>
                    <strong>{closeoutReview.readyCount} / {closeoutReview.checks.length}</strong>
                  </div>
                  <div>
                    <span>Open Requirements</span>
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
                  <p className="muted">Labor, time approval, parts, files/photos, notes, and billing information are ready for invoice review.</p>
                )}
              </article>
            </div>

            <TicketWorkbenchRail
              dispatchReadiness={dispatchReadiness}
              job={job}
              workflowFocusMode={workflowFocusMode}
              onOpenDrawer={openWorkflowDrawer}
              onOpenLabor={openLaborWorkflow}
            />
          </section>
        </>
      ) : null}
    </section>
  );
}
