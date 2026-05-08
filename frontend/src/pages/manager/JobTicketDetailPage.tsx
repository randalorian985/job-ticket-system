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
    if (!jobTicketId || !window.confirm("Confirm status update?")) return;
    try {
      await jobTicketsApi.changeStatus(jobTicketId, {
        status: Number(statusValue),
      });
      setError(null);
      setMessage("Status updated.");
      await load();
    } catch {
      setError("Unable to update status.");
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
    } catch {
      setError("Unable to archive ticket.");
      setMessage(null);
    } finally {
      setIsArchiving(false);
    }
  };

  const onAddAssignment = async (event: FormEvent) => {
    event.preventDefault();
    if (!jobTicketId || !assignmentEmployeeId) return;
    if (assignments.some((x) => x.employeeId === assignmentEmployeeId)) {
      setError("Employee is already assigned.");
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
    } catch {
      setError("Unable to remove assignment.");
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
              <span className="muted">Scheduled</span>
              <strong>{formatDate(job.scheduledStartAtUtc)}</strong>
            </div>
            <div>
              <span className="muted">Completed</span>
              <strong>{formatDate(job.completedAtUtc)}</strong>
            </div>
          </div>
          <p className="muted">
            Customer: {customersById[job.customerId]?.name ?? job.customerId}
          </p>
          <p className="muted">
            Service Location:{" "}
            {locationsById[job.serviceLocationId]?.locationName ??
              job.serviceLocationId}
          </p>
          <p className="muted">
            Billing Party:{" "}
            {customersById[job.billingPartyCustomerId]?.name ??
              job.billingPartyCustomerId}
          </p>
          <p className="muted">
            Equipment:{" "}
            {job.equipmentId
              ? (equipmentById[job.equipmentId]?.name ?? job.equipmentId)
              : "—"}
          </p>
          <p>{job.description ?? "No work description."}</p>
          <button
            className="no-print"
            onClick={() => setEditMode((prev) => !prev)}
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
                await jobTicketsApi.update(jobTicketId, payload);
                setEditMode(false);
                setMessage("Ticket updated.");
                await load();
              }}
            />
          ) : null}
          <form onSubmit={onStatusChange} className="row no-print">
            <select
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
              aria-label="status value"
            >
              {jobStatusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <button type="submit">Update Status</button>
          </form>
          <form onSubmit={onArchiveRequest} className="stack no-print">
            <input
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              placeholder="Archive reason"
            />
            <button type="submit">Archive Ticket</button>
          </form>
          {archiveConfirmationOpen ? (
            <section className="card stack" aria-label="archive confirmation">
              <p>Confirm archive for this job ticket?</p>
              <p className="muted">Reason: {archiveReason.trim()}</p>
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
        <h3>Assigned Employees</h3>
        {assignments.length ? (
          <ul>
            {assignments.map((item) => (
              <li key={item.employeeId}>
                {item.employeeId} {item.isLead ? "(Lead)" : ""}{" "}
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
            Lead
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
