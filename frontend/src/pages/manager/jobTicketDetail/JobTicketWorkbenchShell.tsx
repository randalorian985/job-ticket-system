import type { KeyboardEvent } from "react";
import type {
  CustomerDto,
  EquipmentDto,
  JobTicketDto,
  ServiceLocationDto,
} from "../../../types";
import {
  getJobTicketPriorityLabel,
  getJobTicketStatusLabel,
} from "../../employee/jobDisplay";
import { formatDate } from "../managerDisplay";
import {
  emptyDisplay,
  primaryWorkflowPanelNames,
  workflowTabs,
  type DispatchReadinessSummary,
  type WorkbenchDrawer,
  type WorkflowTab,
} from "./jobTicketDetailHelpers";

type DrawerName = Exclude<WorkbenchDrawer, null>;
type OpenWorkflowDrawer = (tab: WorkflowTab, drawer: DrawerName) => void;
type SelectWorkflowTab = (tab: WorkflowTab, focusWorkflow?: boolean) => void;

type TicketWorkbenchHeroProps = {
  activeDrawer: WorkbenchDrawer;
  job: JobTicketDto;
  selectedBillingParty?: CustomerDto;
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
  selectedBillingParty,
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
          <span>Billing party</span>
          <strong>{selectedBillingParty?.name ?? job.billingPartyCustomerName ?? "Billing party unavailable"}</strong>
        </div>
        <div>
          <span>Equipment</span>
          <strong>{job.equipmentId ? (selectedEquipment?.name ?? job.equipmentName ?? "Equipment unavailable") : emptyDisplay}</strong>
        </div>
        <div>
          <span>Scheduled</span>
          <strong>{formatDate(job.scheduledStartAtUtc)}</strong>
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
  actionHref?: string;
  actionStatus: string;
  actionTitle: string;
  recommendedWorkflow: WorkflowTab;
  workflowFocusMode: boolean;
  workflowLabel: string;
  onOpenHref: (href: string, label: string) => void;
  onOpenWorkflow: (tab: WorkflowTab) => void;
};

export function RecommendedActionPanel({
  actionDetail,
  actionHref,
  actionStatus,
  actionTitle,
  onOpenHref,
  onOpenWorkflow,
  recommendedWorkflow,
  workflowFocusMode,
  workflowLabel,
}: RecommendedActionPanelProps) {
  return (
    <section className="ticket-recommended-action no-print" aria-label="next action" hidden={workflowFocusMode}>
      <div>
        <span>Next action</span>
        <strong>{actionTitle}</strong>
        <p>{actionDetail}</p>
      </div>
      <div className="ticket-recommended-target">
        <span>Goes to</span>
        <strong>{workflowLabel}</strong>
        <small>{actionStatus}</small>
      </div>
      <span className="tooltip-anchor">
        {actionHref ? (
          <button
            type="button"
            aria-describedby="open-next-action-tooltip"
            onClick={() => onOpenHref(actionHref, `open ${workflowLabel}`)}
            title={`Open ${workflowLabel}`}
          >
            Open {workflowLabel}
          </button>
        ) : (
          <button
            type="button"
            aria-describedby="open-next-action-tooltip"
            title={`Open ${workflowLabel}`}
            onClick={() => onOpenWorkflow(recommendedWorkflow)}
          >
            Open {workflowLabel}
          </button>
        )}
        <span id="open-next-action-tooltip" className="control-tooltip" role="tooltip">
          Open {workflowLabel} for this ticket.
        </span>
      </span>
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
        <span className="muted">Ticket section</span>
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
    <nav className="ticket-workflow-tabs no-print" aria-label="ticket sections">
      <div role="tablist" aria-label="ticket detail tabs">
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
      <button type="button" aria-label="Quick Add File" onClick={() => onOpenDrawer("files", "photo")}>Add File</button>
      <button type="button" aria-label="Quick Add Labor or Travel" onClick={onOpenLabor}>Labor</button>
      <button type="button" aria-label="Quick Status" onClick={() => onOpenDrawer("overview", "status")}>Status</button>
    </section>
  );
}

type TicketWorkbenchRailProps = {
  dispatchReadiness: DispatchReadinessSummary;
  job: JobTicketDto;
  workflowFocusMode: boolean;
  onOpenDrawer: OpenWorkflowDrawer;
  onOpenLabor: () => void;
  onOpenScheduling: () => void;
};

export function TicketWorkbenchRail({
  dispatchReadiness,
  job,
  onOpenDrawer,
  onOpenLabor,
  onOpenScheduling,
  workflowFocusMode,
}: TicketWorkbenchRailProps) {
  return (
    <aside className="ticket-workbench-rail no-print" aria-label="ticket actions and status" hidden={workflowFocusMode}>
      <section className="workbench-panel workbench-panel-compact">
        <h3>Quick Actions</h3>
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
            Add File
          </button>
          <button
            type="button"
            title="Add missing labor or travel from this ticket."
            onClick={onOpenLabor}
          >
            Add Labor / Travel
          </button>
          <button
            type="button"
            title="Record a used part or create a request for office ordering."
            onClick={() => onOpenDrawer("parts", "part")}
          >
            Add Part
          </button>
          <button type="button" className="secondary-button action-wide" onClick={onOpenScheduling}>Open Scheduling</button>
        </div>
      </section>

      <section className="workbench-panel workbench-panel-compact">
        <h3>Status</h3>
        <p className="muted">Current status and guarded status changes.</p>
        <div className="rail-facts">
          <div>
            <span>Status</span>
            <strong>{getJobTicketStatusLabel(job.status)}</strong>
          </div>
          <div>
            <span>Priority</span>
            <strong>{getJobTicketPriorityLabel(job.priority)}</strong>
          </div>
          <div>
            <span>Readiness</span>
            <strong>{dispatchReadiness.statusLabel}</strong>
          </div>
          <div>
            <span>Due</span>
            <strong>{formatDate(job.dueAtUtc)}</strong>
          </div>
        </div>
        <button type="button" onClick={() => onOpenDrawer("overview", "status")}>Change Status</button>
      </section>
    </aside>
  );
}
