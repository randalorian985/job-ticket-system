import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { filesApi } from "../../api/filesApi";
import { ApiError } from "../../api/httpClient";
import { jobTicketsApi } from "../../api/jobTicketsApi";
import { masterDataApi } from "../../api/masterDataApi";
import { timeEntriesApi } from "../../api/timeEntriesApi";
import { usersApi } from "../../api/usersApi";
import { useAuth } from "../../features/auth/AuthContext";
import type {
  CreateJobTicketDto,
  CustomerDto,
  EquipmentDto,
  JobTicketAssignmentDto,
  JobTicketDto,
  JobTicketFileDto,
  JobTicketPartDto,
  JobWorkEntryDto,
  ServiceLocationDto,
  TimeEntryDto,
  UserDto,
} from "../../types";
import {
  getJobTicketPriorityLabel,
  getJobTicketStatusLabel,
} from "../employee/jobDisplay";
import {
  formatDate,
  getApprovalLabel,
  jobStatusOptions,
} from "./managerDisplay";
import { JobTicketEditorForm } from "./JobTicketEditorForm";

const displayValue = (value?: string | null) => value?.trim() ? value : "—";

export function JobTicketDetailPage() {
  const { jobTicketId } = useParams<{ jobTicketId: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<JobTicketDto | null>(null);
  const [assignments, setAssignments] = useState<JobTicketAssignmentDto[]>([]);
  const [entries, setEntries] = useState<JobWorkEntryDto[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntryDto[]>([]);
  const [parts, setParts] = useState<JobTicketPartDto[]>([]);
  const [files, setFiles] = useState<JobTicketFileDto[]>([]);
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [locations, setLocations] = useState<ServiceLocationDto[]>([]);
  const [equipment, setEquipment] = useState<EquipmentDto[]>([]);
  const [employees, setEmployees] = useState<UserDto[]>([]);
  const [statusValue, setStatusValue] = useState("1");
  const [archiveReason, setArchiveReason] = useState("");
  const [archiveConfirmationOpen, setArchiveConfirmationOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [assignmentEmployeeId, setAssignmentEmployeeId] = useState("");
  const [isLeadAssignment, setIsLeadAssignment] = useState(false);
  const [editMode, setEditMode] = useState(false);
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
  const leadAssignment = useMemo(
    () => assignments.find((item) => item.isLead) ?? null,
    [assignments],
  );
  const dispatchWarnings = useMemo(() => {
    const warnings: string[] = [];

    if (!assignments.length) {
      warnings.push("No employees are assigned.");
    }

    if (!leadAssignment) {
      warnings.push("No lead tech is marked.");
    }

    if (!job?.scheduledStartAtUtc) {
      warnings.push("No scheduled start is set.");
    }

    return warnings;
  }, [assignments, job?.scheduledStartAtUtc, leadAssignment]);
  const statusReview = useMemo(() => {
    const nextStatus = Number(statusValue);
    const currentLabel = job ? getJobTicketStatusLabel(job.status) : "—";
    const nextLabel = getJobTicketStatusLabel(nextStatus);
    const warnings: string[] = [];
    const hasChange = Boolean(job) && nextStatus !== job.status;

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
          if (!assignments.length) {
            warnings.push("In Progress works best after at least one employee is assigned.");
          }
          if (!leadAssignment) {
            warnings.push("Mark a lead tech before field work begins so dispatch ownership is clear.");
          }
          if (!job.scheduledStartAtUtc) {
            warnings.push("Set a scheduled start before field work begins.");
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
          warnings.push("Invoice status should follow completed work and billing review.");
          break;
        case 10:
          warnings.push("Reviewed is the final closeout state after invoice review.");
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
  }, [assignments.length, entries.length, job, leadAssignment, parts.length, statusValue, timeEntries.length]);
  const archiveReviewWarnings = useMemo(() => {
    const warnings = dispatchWarnings.map((warning) => `Before archiving: ${warning}`);

    if (job && ![7, 8, 9, 10].includes(job.status)) {
      warnings.unshift(`This ticket is currently ${getJobTicketStatusLabel(job.status)}.`);
    }

    return warnings;
  }, [dispatchWarnings, job]);

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
      customerResponse,
      locationResponse,
      equipmentResponse,
    ] = await Promise.all([
      jobTicketsApi.get(jobTicketId),
      jobTicketsApi.listAssignments(jobTicketId).catch(() => []),
      jobTicketsApi.listWorkEntries(jobTicketId),
      timeEntriesApi.listByJob(jobTicketId).catch(() => []),
      jobTicketsApi.listParts(jobTicketId),
      filesApi.list(jobTicketId),
      masterDataApi.listCustomers(),
      masterDataApi.listServiceLocations(),
      masterDataApi.listEquipment(),
    ]);

    setJob(jobResponse);
    setStatusValue(String(jobResponse.status));
    setAssignments(assignmentResponse);
    setEntries(entryResponse);
    setTimeEntries(timeResponse);
    setParts(partsResponse);
    setFiles(filesResponse);
    setCustomers(customerResponse);
    setLocations(locationResponse);
    setEquipment(equipmentResponse);

    if (user?.role === "Admin") {
      const userList = await usersApi.list().catch(() => []);
      setEmployees(
        userList.filter((x) => !x.isArchived && x.role === "Employee"),
      );
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

  const onArchiveRequest = (event: FormEvent) => {
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
    if (!jobTicketId || !window.confirm("Remove this assignment?")) return;
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
    <section className="stack">
      <p>
        <Link to="/manage/job-tickets">← Back to Job Tickets</Link>
      </p>
      {isLoading ? (
        <p className="muted" role="status">
          Loading job review details…
        </p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}
      {job ? (
        <article className="card stack print-review">
          <div className="review-heading">
            <div>
              <h2>{job.ticketNumber}</h2>
              <p className="muted">Job review packet</p>
            </div>
            <button
              type="button"
              className="secondary-button no-print"
              onClick={() => window.print()}
            >
              Print Job Review
            </button>
          </div>
          <p>{job.title}</p>
          <div className="review-grid" aria-label="job status and approvals">
            <div>
              <span className="muted">Status</span>
              <strong>{getJobTicketStatusLabel(job.status)}</strong>
            </div>
            <div>
              <span className="muted">Priority</span>
              <strong>{getJobTicketPriorityLabel(job.priority)}</strong>
            </div>
            <div>
              <span className="muted">Requested</span>
              <strong>{formatDate(job.requestedAtUtc)}</strong>
            </div>
            <div>
              <span className="muted">Scheduled</span>
              <strong>{formatDate(job.scheduledStartAtUtc)}</strong>
            </div>
            <div>
              <span className="muted">Due</span>
              <strong>{formatDate(job.dueAtUtc)}</strong>
            </div>
            <div>
              <span className="muted">Completed</span>
              <strong>{formatDate(job.completedAtUtc)}</strong>
            </div>
          </div>
          <div className="review-grid" aria-label="assignment ownership summary">
            <div>
              <span className="muted">Lead Tech</span>
              <strong>{leadAssignment ? leadAssignment.employeeId : "Needs assignment"}</strong>
            </div>
            <div>
              <span className="muted">Assigned Employees</span>
              <strong>{assignments.length}</strong>
            </div>
            <div>
              <span className="muted">Dispatch Status</span>
              <strong>{dispatchWarnings.length ? "Needs attention" : "Ready for dispatch review"}</strong>
            </div>
          </div>
          {dispatchWarnings.length ? (
            <ul className="muted" aria-label="dispatch warnings">
              {dispatchWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">Lead tech, schedule, and assigned-employee signals are all present.</p>
          )}
          <div className="review-grid" aria-label="job dispatch details">
            <div>
              <span className="muted">Customer</span>
              <strong>{customersById[job.customerId]?.name ?? job.customerId}</strong>
            </div>
            <div>
              <span className="muted">Service Location</span>
              <strong>{locationsById[job.serviceLocationId]?.locationName ?? job.serviceLocationId}</strong>
            </div>
            <div>
              <span className="muted">Billing Party</span>
              <strong>{customersById[job.billingPartyCustomerId]?.name ?? job.billingPartyCustomerId}</strong>
            </div>
            <div>
              <span className="muted">Equipment</span>
              <strong>{job.equipmentId ? (equipmentById[job.equipmentId]?.name ?? job.equipmentId) : "—"}</strong>
            </div>
            <div>
              <span className="muted">Job Type</span>
              <strong>{displayValue(job.jobType)}</strong>
            </div>
            <div>
              <span className="muted">Purchase Order</span>
              <strong>{displayValue(job.purchaseOrderNumber)}</strong>
            </div>
          </div>
          <div className="review-grid" aria-label="billing contact details">
            <div>
              <span className="muted">Billing Contact</span>
              <strong>{displayValue(job.billingContactName)}</strong>
            </div>
            <div>
              <span className="muted">Billing Phone</span>
              <strong>{displayValue(job.billingContactPhone)}</strong>
            </div>
            <div>
              <span className="muted">Billing Email</span>
              <strong>{displayValue(job.billingContactEmail)}</strong>
            </div>
            <div>
              <span className="muted">Archive Reason</span>
              <strong>{displayValue(job.archiveReason)}</strong>
            </div>
          </div>
          <div>
            <h3>Description</h3>
            <p>{job.description ?? "No work description."}</p>
          </div>
          <div className="review-grid" aria-label="job notes">
            <div>
              <span className="muted">Internal Notes</span>
              <p>{displayValue(job.internalNotes)}</p>
            </div>
            <div>
              <span className="muted">Customer Notes</span>
              <p>{displayValue(job.customerFacingNotes)}</p>
            </div>
          </div>
          <button
            className="no-print"
            onClick={() => {
              setEditMode((prev) => !prev);
              setError(null);
              setMessage(null);
            }}
          >
            {editMode ? "Cancel Edit" : "Edit Ticket"}
          </button>
          {editMode && editPayload ? (
            <JobTicketEditorForm
              initial={editPayload}
              customers={customers}
              serviceLocations={locations}
              equipment={equipment}
              submitLabel="Save Ticket"
              onSubmit={async (payload) => {
                if (!jobTicketId) return;

                try {
                  await jobTicketsApi.update(jobTicketId, payload);
                  setEditMode(false);
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
          ) : null}
          <section className="stack no-print" aria-label="status workflow review">
            <h3>Status Review</h3>
            <div className="review-grid">
              <div>
                <span className="muted">Current Status</span>
                <strong>{statusReview.currentLabel}</strong>
              </div>
              <div>
                <span className="muted">Selected Status</span>
                <strong>{statusReview.nextLabel}</strong>
              </div>
              <div>
                <span className="muted">Dispatch Readiness</span>
                <strong>{dispatchWarnings.length ? "Needs attention" : "Ready"}</strong>
              </div>
            </div>
            <p className="muted">{statusReview.summary}</p>
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
          <section className="stack no-print" aria-label="archive workflow review">
            <h3>Archive Review</h3>
            <p className="muted">Archive keeps this ticket available for reporting and history. It does not hard delete the record.</p>
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
          </section>
          {archiveConfirmationOpen ? (
            <section className="stack" aria-label="archive confirmation">
              <p>Confirm archive for this job ticket?</p>
              <div className="review-grid">
                <div>
                  <span className="muted">Current Status</span>
                  <strong>{getJobTicketStatusLabel(job.status)}</strong>
                </div>
                <div>
                  <span className="muted">Assigned Employees</span>
                  <strong>{assignments.length}</strong>
                </div>
                <div>
                  <span className="muted">Archive Reason</span>
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
                  onClick={() => setArchiveConfirmationOpen(false)}
                  disabled={isArchiving}
                >
                  Cancel
                </button>
              </div>
            </section>
          ) : null}
        </article>
      ) : null}

      <article className="card stack">
        <div className="row">
          <h3>Assigned Employees</h3>
          <span className="muted">Current lead: {leadAssignment ? leadAssignment.employeeId : "Needs assignment"}</span>
        </div>
        {assignments.length ? (
          <ul>
            {assignments.map((item) => (
              <li key={item.employeeId}>
                <strong>{item.employeeId}</strong> {item.isLead ? "(Lead Tech)" : ""}
                <div className="muted">Assigned {formatDate(item.assignedAtUtc)}</div>
                <button
                  className="no-print"
                  onClick={() => onRemoveAssignment(item.employeeId)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No employees are assigned yet.</p>
        )}
        <form onSubmit={onAddAssignment} className="row no-print">
          {employees.length ? (
            <select
              value={assignmentEmployeeId}
              onChange={(e) => setAssignmentEmployeeId(e.target.value)}
              aria-label="assignment employee"
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
          ) : (
            <input
              value={assignmentEmployeeId}
              onChange={(e) => setAssignmentEmployeeId(e.target.value)}
              placeholder="Employee id"
              aria-label="assignment employee"
            />
          )}
          <label>
            <input
              type="checkbox"
              checked={isLeadAssignment}
              onChange={(e) => setIsLeadAssignment(e.target.checked)}
            />
            Lead Tech
          </label>
          <button type="submit">Assign Employee</button>
        </form>
      </article>
      <article className="card stack review-section">
        <h3>Labor / Work Entries</h3>
        {entries.length ? (
          <ul>
            {entries.map((item) => (
              <li key={item.id}>
                <strong>{formatDate(item.performedAtUtc)}</strong>
                <div>{item.notes}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No work entries have been logged.</p>
        )}
      </article>
      <article className="card stack review-section">
        <h3>Time Entries</h3>
        {timeEntries.length ? (
          <ul>
            {timeEntries.map((item) => (
              <li key={item.id}>
                {item.employeeId} · {item.laborHours}h labor /{" "}
                {item.billableHours}h billable ·{" "}
                {getApprovalLabel(item.approvalStatus)}
                {item.workSummary ? ` · ${item.workSummary}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No time entries have been logged.</p>
        )}
      </article>
      <article className="card stack review-section">
        <h3>Parts Usage</h3>
        {parts.length ? (
          <ul>
            {parts.map((item) => (
              <li key={item.id}>
                Part {item.partId} · Qty {item.quantity} ·{" "}
                {getApprovalLabel(item.approvalStatus)}
                {item.notes ? ` · ${item.notes}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No parts usage has been logged.</p>
        )}
      </article>
      <article className="card stack review-section">
        <h3>Files / Photos</h3>
        {files.length ? (
          <ul>
            {files.map((item) => (
              <li key={item.id}>
                <a href={filesApi.getDownloadUrl(item.jobTicketId, item.id)}>
                  {item.originalFileName}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No files or photos have been uploaded.</p>
        )}
      </article>
    </section>
  );
}
