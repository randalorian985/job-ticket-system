import type { KeyboardEvent } from "react";
import type {
  CustomerDto,
  EquipmentDto,
  InvoiceReadySummaryDto,
  JobTicketAssignmentDto,
  JobTicketDto,
  JobTicketFileDto,
  ServiceLocationDto,
} from "../../../types";
import {
  getJobTicketPriorityLabel,
  getJobTicketStatusLabel,
} from "../../employee/jobDisplay";
import { formatDate } from "../managerDisplay";
import {
  emptyDisplay,
  formatCurrency,
  formatHours,
  primaryWorkflowPanelNames,
  workflowTabs,
  type CloseoutReviewSummary,
  type DispatchReadinessSummary,
  type LaborSummary,
  type PartsReviewSummary,
  type ReadinessCheck,
  type WorkbenchDrawer,
  type WorkflowPathStep,
  type WorkflowTab,
} from "./jobTicketDetailHelpers";

type DrawerName = Exclude<WorkbenchDrawer, null>;
type OpenWorkflowDrawer = (tab: WorkflowTab, drawer: DrawerName) => void;
type SelectWorkflowTab = (tab: WorkflowTab, focusWorkflow?: boolean) => void;

type TicketWorkbenchHeroProps = {
  activeDrawer: WorkbenchDrawer;
  job: JobTicketDto;
  selectedCustomer?: CustomerDto;
  selectedEquipment?: EquipmentDto;
  selectedLocation?: ServiceLocationDto;
  workflowFocusMode: boolean;
  onOpenDrawer: OpenWorkflowDrawer;
};

export function TicketWorkbenchHero({
  activeDrawer,
  job,
  onOpenDrawer,
  selectedCustomer,
  selectedEquipment,
  selectedLocation,
  workflowFocusMode,
}: TicketWorkbenchHeroProps) {
  return (
    <header className="ticket-workbench-hero print-review" hidden={workflowFocusMode}>
      <div className="ticket-workbench-title">
        <span className="muted">Service ticket</span>
        <h2>{job.ticketNumber}</h2>
        <p>{job.title}</p>
      </div>
      <div className="ticket-workbench-command-bar no-print">
        <button
          type="button"
          className="secondary-button"
          title="Open the browser print dialog for this job review."
          onClick={() => window.print()}
        >
          Print Job Review
        </button>
        <button
          type="button"
          title="Edit ticket details without leaving this workspace."
          onClick={() => onOpenDrawer("overview", "ticket")}
        >
          {activeDrawer === "ticket" ? "Close Ticket Editor" : "Edit Ticket"}
        </button>
        <button
          type="button"
          title="Review readiness warnings before changing ticket status."
          onClick={() => onOpenDrawer("overview", "status")}
        >
          {activeDrawer === "status" ? "Close Status Panel" : "Change Status"}
        </button>
        <button
          type="button"
          className="secondary-button"
          title="Review archive impact and enter a reason before confirmation."
          onClick={() => onOpenDrawer("overview", "archive")}
        >
          {activeDrawer === "archive" ? "Close Archive Panel" : "Archive Review"}
        </button>
      </div>
      <div className="ticket-workbench-hero-meta" aria-label="ticket key details">
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
          <strong>{selectedCustomer?.name ?? job.customerName ?? "Customer unavailable"}</strong>
        </div>
        <div>
          <span>Service location</span>
          <strong>{selectedLocation?.locationName ?? job.serviceLocationName ?? "Location unavailable"}</strong>
        </div>
        <div>
          <span>Equipment</span>
          <strong>{job.equipmentId ? (selectedEquipment?.name ?? job.equipmentName ?? "Equipment unavailable") : emptyDisplay}</strong>
        </div>
        <div>
          <span>Due</span>
          <strong>{formatDate(job.dueAtUtc)}</strong>
        </div>
      </div>
    </header>
  );
}

type RecommendedActionPanelProps = {
  actionDetail: string;
  actionStatus: string;
  actionTitle: string;
  recommendedWorkflow: WorkflowTab;
  workflowFocusMode: boolean;
  workflowLabel: string;
  onOpenWorkflow: (tab: WorkflowTab) => void;
};

export function RecommendedActionPanel({
  actionDetail,
  actionStatus,
  actionTitle,
  onOpenWorkflow,
  recommendedWorkflow,
  workflowFocusMode,
  workflowLabel,
}: RecommendedActionPanelProps) {
  return (
    <section className="ticket-recommended-action no-print" aria-label="recommended action" hidden={workflowFocusMode}>
      <div>
        <span>Recommended next action</span>
        <strong>{actionTitle}</strong>
        <p>{actionDetail}</p>
      </div>
      <div className="ticket-recommended-target">
        <span>Target workflow</span>
        <strong>{workflowLabel}</strong>
        <small>{actionStatus}</small>
      </div>
      <span className="tooltip-anchor">
        <button
          type="button"
          aria-describedby="open-workflow-tooltip"
          title={`Open the ${workflowLabel} workflow screen`}
          onClick={() => onOpenWorkflow(recommendedWorkflow)}
        >
          Open {workflowLabel}
        </button>
        <span id="open-workflow-tooltip" className="control-tooltip" role="tooltip">
          Open the recommended {workflowLabel} screen for this ticket.
        </span>
      </span>
    </section>
  );
}

type WorkflowPathProps = {
  steps: WorkflowPathStep[];
  workflowFocusMode: boolean;
  onSelectWorkflowTab: SelectWorkflowTab;
};

export function WorkflowPath({
  onSelectWorkflowTab,
  steps,
  workflowFocusMode,
}: WorkflowPathProps) {
  return (
    <section className="ticket-workflow-path no-print" aria-label="ticket workflow path" hidden={workflowFocusMode}>
      {steps.map((step) => (
        <button
          type="button"
          className={`ticket-workflow-path-step ticket-workflow-path-${step.state}`}
          key={step.label}
          onClick={() => onSelectWorkflowTab(step.value, true)}
          title={`Open ${step.label} workflow`}
        >
          <span>{step.label}</span>
          <strong>{step.summary}</strong>
        </button>
      ))}
    </section>
  );
}

type WorkflowFocusHeadingProps = {
  activeWorkflowLabel: string;
  job: JobTicketDto;
  workflowFocusMode: boolean;
  onClose: () => void;
};

export function WorkflowFocusHeading({
  activeWorkflowLabel,
  job,
  onClose,
  workflowFocusMode,
}: WorkflowFocusHeadingProps) {
  if (!workflowFocusMode) {
    return null;
  }

  return (
    <header className="workflow-focus-heading no-print">
      <div>
        <span className="muted">Focused ticket workflow</span>
        <h2>{activeWorkflowLabel}</h2>
        <p className="muted">{job.ticketNumber} - {job.title}</p>
      </div>
      <button type="button" className="secondary-button" onClick={onClose}>Back to ticket overview</button>
    </header>
  );
}

type WorkflowTabsProps = {
  activeTab: WorkflowTab;
  onSelectWorkflowTab: SelectWorkflowTab;
  onWorkflowTabKeyDown: (event: KeyboardEvent<HTMLButtonElement>, currentTab: WorkflowTab) => void;
};

export function WorkflowTabs({
  activeTab,
  onSelectWorkflowTab,
  onWorkflowTabKeyDown,
}: WorkflowTabsProps) {
  return (
    <nav className="ticket-workflow-tabs no-print" aria-label="ticket workflow sections">
      <div role="tablist" aria-label="ticket workflow tabs">
        {workflowTabs.map((tab) => (
          <button
            id={`ticket-workflow-tab-${tab.value}`}
            type="button"
            role="tab"
            aria-controls={`ticket-workflow-panel-${primaryWorkflowPanelNames[tab.value]}`}
            aria-selected={activeTab === tab.value}
            tabIndex={activeTab === tab.value ? 0 : -1}
            title={tab.description}
            className={activeTab === tab.value ? "ticket-workflow-tab-active" : ""}
            key={tab.value}
            onClick={() => onSelectWorkflowTab(tab.value, true)}
            onKeyDown={(event) => onWorkflowTabKeyDown(event, tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

type MobileQuickActionsProps = {
  workflowFocusMode: boolean;
  onOpenDrawer: OpenWorkflowDrawer;
  onOpenLabor: () => void;
};

export function MobileQuickActions({
  onOpenDrawer,
  onOpenLabor,
  workflowFocusMode,
}: MobileQuickActionsProps) {
  return (
    <section className="ticket-mobile-quick-actions no-print" aria-label="mobile ticket quick actions" hidden={workflowFocusMode}>
      <button type="button" aria-label="Quick Add Note" onClick={() => onOpenDrawer("activity", "note")}>Add Note</button>
      <button type="button" aria-label="Quick Add Photo" onClick={() => onOpenDrawer("files", "photo")}>Add Photo</button>
      <button type="button" aria-label="Quick Labor" onClick={onOpenLabor}>Labor</button>
      <button type="button" aria-label="Quick Status" onClick={() => onOpenDrawer("overview", "status")}>Status</button>
    </section>
  );
}

type TicketWorkbenchKpisProps = {
  closeoutReview: CloseoutReviewSummary;
  dispatchReadiness: DispatchReadinessSummary;
  dispatchWarnings: string[];
  files: JobTicketFileDto[];
  invoiceSummary: InvoiceReadySummaryDto | null;
  laborSummary: LaborSummary;
  partsReview: PartsReviewSummary;
  workflowFocusMode: boolean;
};

export function TicketWorkbenchKpis({
  closeoutReview,
  dispatchReadiness,
  dispatchWarnings,
  files,
  invoiceSummary,
  laborSummary,
  partsReview,
  workflowFocusMode,
}: TicketWorkbenchKpisProps) {
  return (
    <section className="ticket-workbench-kpis" aria-label="ticket workspace summary" hidden={workflowFocusMode}>
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
        <span>Invoice Review</span>
        <strong>{invoiceSummary ? formatCurrency(invoiceSummary.grandTotal) : "Not ready"}</strong>
        <small>{invoiceSummary ? "Invoice report loaded" : "Complete invoice checks"}</small>
      </div>
    </section>
  );
}

type TicketWorkbenchRailProps = {
  assignments: JobTicketAssignmentDto[];
  completedDispatchChecks: ReadinessCheck[];
  dispatchReadiness: DispatchReadinessSummary;
  job: JobTicketDto;
  leadAssignment: JobTicketAssignmentDto | null;
  openDispatchChecks: ReadinessCheck[];
  workflowFocusMode: boolean;
  getEmployeeDisplayName: (assignment: JobTicketAssignmentDto) => string;
  onOpenDrawer: OpenWorkflowDrawer;
  onOpenLabor: () => void;
};

export function TicketWorkbenchRail({
  assignments,
  completedDispatchChecks,
  dispatchReadiness,
  getEmployeeDisplayName,
  job,
  leadAssignment,
  onOpenDrawer,
  onOpenLabor,
  openDispatchChecks,
  workflowFocusMode,
}: TicketWorkbenchRailProps) {
  return (
    <aside className="ticket-workbench-rail no-print" aria-label="ticket actions and dispatch requirements" hidden={workflowFocusMode}>
      <section className="workbench-panel workbench-panel-compact">
        <h3>Ticket Actions</h3>
        <div className="ticket-action-grid">
          <button
            type="button"
            title="Edit customer, scheduling, service, and billing details."
            onClick={() => onOpenDrawer("overview", "ticket")}
          >
            Edit Ticket
          </button>
          <button
            type="button"
            title="Review warnings and choose the ticket's next status."
            onClick={() => onOpenDrawer("overview", "status")}
          >
            Change Status
          </button>
          <button
            type="button"
            title="Add a Manager/Admin note to this ticket's history."
            onClick={() => onOpenDrawer("activity", "note")}
          >
            Add Note
          </button>
          <button
            type="button"
            title="Upload a job photo, document, or invoice attachment."
            onClick={() => onOpenDrawer("files", "photo")}
          >
            Add Photo
          </button>
          <button
            type="button"
            title="Open labor and time entries for review or approval follow-up."
            onClick={onOpenLabor}
          >
            Add Labor
          </button>
          <button
            type="button"
            className="action-wide"
            title="Record a used part or create a request for office ordering."
            onClick={() => onOpenDrawer("parts", "part")}
          >
            Open Add / Request Part Panel
          </button>
          <button
            type="button"
            className="secondary-button action-wide"
            title="Review archive impact and enter a reason before confirmation."
            onClick={() => onOpenDrawer("overview", "archive")}
          >
            Archive Review
          </button>
        </div>
      </section>

      <section className="workbench-panel workbench-panel-compact">
        <h3>Assigned Technicians</h3>
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

      <section className="workbench-panel workbench-panel-compact dispatch-requirements-panel">
        <div className="dispatch-requirements-heading">
          <h3>Dispatch Requirements</h3>
          <span className="tooltip-anchor">
            <button
              type="button"
              className="help-tooltip-trigger"
              aria-label="About dispatch requirements"
              aria-describedby="dispatch-requirements-tooltip"
            >
              i
            </button>
            <span id="dispatch-requirements-tooltip" className="control-tooltip" role="tooltip">
              These checks identify missing information before dispatch review. Completed checks stay available below.
            </span>
          </span>
        </div>
        <div className={openDispatchChecks.length ? "dispatch-readiness-summary dispatch-readiness-summary-open" : "dispatch-readiness-summary dispatch-readiness-summary-ready"}>
          <strong>{openDispatchChecks.length ? `${openDispatchChecks.length} open` : "Ready"}</strong>
          <span>{dispatchReadiness.readyCount} of {dispatchReadiness.checks.length} complete</span>
        </div>
        {openDispatchChecks.length ? (
          <ul className="check-list dispatch-open-checks" aria-label="open dispatch readiness checks">
            {openDispatchChecks.map((check) => (
              <li className="check-item-open" key={check.label}>
                <strong>{check.label}</strong>
                <span>{check.detail}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dispatch-ready-message">No dispatch blockers are currently visible.</p>
        )}
        <details className="dispatch-completed-details">
          <summary>
            Review {completedDispatchChecks.length} completed requirement{completedDispatchChecks.length === 1 ? "" : "s"}
          </summary>
          <ul className="check-list" aria-label="completed dispatch readiness checks">
            {completedDispatchChecks.map((check) => (
              <li className="check-item-ready" key={check.label}>
                <strong>{check.label}</strong>
                <span>{check.detail}</span>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </aside>
  );
}
