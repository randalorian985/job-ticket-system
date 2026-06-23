import type {
  JobTicketPartDto,
  ServiceLocationDto,
  TimeEntryDto,
} from "../../../types";
import {
  getApprovalLabel,
  JOB_PART_APPROVAL_STATUS,
} from "../managerDisplay";

export type WorkbenchDrawer = "ticket" | "status" | "archive" | "part" | "note" | "photo" | null;
export type WorkflowTab = "overview" | "dispatch" | "time" | "parts" | "files" | "closeout" | "activity";

export type WorkflowTabDefinition = {
  value: WorkflowTab;
  label: string;
  description: string;
};

export type ActivityItem = {
  id: string;
  type: string;
  occurredAtUtc?: string | null;
  title: string;
  detail?: string | null;
};

export type ReadinessCheck = {
  label: string;
  isReady: boolean;
  detail: string;
};

export type DispatchReadinessSummary = {
  checks: ReadinessCheck[];
  readyCount: number;
  statusLabel: string;
  warnings: string[];
};

export type CloseoutReviewSummary = {
  checks: ReadinessCheck[];
  readyCount: number;
  warnings: string[];
};

export type LaborSummary = {
  approvedClosedTimeEntries: TimeEntryDto[];
  pendingTimeEntries: TimeEntryDto[];
  openTimeEntries: TimeEntryDto[];
  laborHours: number;
  billableHours: number;
  approvedLaborHours: number;
};

export type PartsReviewSummary = {
  needsOrdered: JobTicketPartDto[];
  pendingNeedsOrdered: JobTicketPartDto[];
  approvedNeedsOrdered: JobTicketPartDto[];
  rejectedNeedsOrdered: JobTicketPartDto[];
  ticketOnlyParts: JobTicketPartDto[];
  approvedParts: JobTicketPartDto[];
  blockerCount: number;
  statusLabel: string;
  nextAction: string;
};

export type WorkflowPathStep = {
  label: string;
  value: WorkflowTab;
  summary: string;
  state: "alert" | "open" | "ready";
};

export const workflowTabs: WorkflowTabDefinition[] = [
  { value: "overview", label: "Service Details", description: "Review the customer, location, equipment, scope, and billing details." },
  { value: "dispatch", label: "Assignment & Schedule", description: "Manage assigned technicians, lead tech, schedule, and due date." },
  { value: "time", label: "Labor", description: "Review work entries, time entries, and approval status." },
  { value: "parts", label: "Parts", description: "Review parts used, requested, ordered, and awaiting approval." },
  { value: "files", label: "Files", description: "Review job files, photos, and invoice attachments." },
  { value: "closeout", label: "Invoice Review", description: "Review closeout requirements and invoice-ready totals." },
  { value: "activity", label: "History", description: "Review ticket activity in chronological order." },
];

export const isWorkflowTab = (value: string | null): value is WorkflowTab =>
  workflowTabs.some((tab) => tab.value === value);

export const primaryWorkflowPanelNames: Record<WorkflowTab, string> = {
  overview: "ticket-overview",
  dispatch: "assignments",
  time: "time-labor",
  parts: "parts",
  files: "files",
  closeout: "closeout",
  activity: "activity",
};

export const emptyDisplay = "-";
export const allowedManagerUploadTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export const displayValue = (value?: string | null) => value?.trim() ? value : emptyDisplay;

export const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
});

export const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

export const formatCurrency = (value?: number | null) => currencyFormatter.format(value ?? 0);
export const formatHours = (value: number) => `${numberFormatter.format(value)}h`;

export const formatFileSize = (bytes?: number | null) => {
  if (typeof bytes !== "number" || !Number.isFinite(bytes)) {
    return "Size unknown";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${numberFormatter.format(bytes / (1024 * 1024))} MB`;
};

export const getPartDisplayName = (part: JobTicketPartDto) => {
  if (part.partNumber && part.partName) {
    return `${part.partNumber} - ${part.partName}`;
  }

  return part.partName || part.partNumber || "Unnamed part";
};

export const getPartReviewLabel = (status: number) => {
  if (status === JOB_PART_APPROVAL_STATUS.Pending) {
    return "Pending review";
  }

  return getApprovalLabel(status);
};

export const getPartRequestLabel = (part: JobTicketPartDto) => {
  if (part.officeOrderRequested) {
    return "Needs ordered";
  }

  return "Ticket part only";
};

export const getAddressLine = (location?: ServiceLocationDto) => {
  if (!location) {
    return emptyDisplay;
  }

  return [
    location.addressLine1,
    location.addressLine2,
    [location.city, location.state, location.postalCode].filter(Boolean).join(", "),
    location.country,
  ]
    .filter((item) => item?.trim())
    .join(" ");
};

export const sortActivityDescending = (left: ActivityItem, right: ActivityItem) => {
  const leftTime = left.occurredAtUtc ? new Date(left.occurredAtUtc).getTime() : 0;
  const rightTime = right.occurredAtUtc ? new Date(right.occurredAtUtc).getTime() : 0;
  return rightTime - leftTime;
};
