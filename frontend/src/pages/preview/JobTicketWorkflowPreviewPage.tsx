import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type TicketPreviewStage =
  | 'draft'
  | 'submitted'
  | 'assigned'
  | 'inProgress'
  | 'waitingParts'
  | 'completed'
  | 'readyToInvoice'
  | 'invoiced'

type TicketPreviewModel = {
  activeTab: string
  label: string
  statusLabel: string
  statusTone: 'setup' | 'active' | 'waiting' | 'review' | 'ready' | 'closed'
  subtitle: string
  recommendedTitle: string
  recommendedDetail: string
  targetWorkflow: string
  actionStatus: string
  primaryAction: string
  stageHeading: string
  stageDescription: string
  blockers: string[]
  completedSignals: string[]
  allowedStatuses: string[]
  invoiceMode: 'later' | 'review' | 'ready' | 'closed'
}

const tabLabels = [
  'Service Details',
  'Labor',
  'Parts',
  'Files',
  'Invoice Review',
  'History'
]

type PreviewTab = typeof tabLabels[number]

const previewStages: Array<{ value: TicketPreviewStage; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'inProgress', label: 'In Progress' },
  { value: 'waitingParts', label: 'Waiting on Parts' },
  { value: 'completed', label: 'Completed' },
  { value: 'readyToInvoice', label: 'Ready to Invoice' },
  { value: 'invoiced', label: 'Invoiced' }
]

const previewModels: Record<TicketPreviewStage, TicketPreviewModel> = {
  draft: {
    activeTab: 'Service Details',
    label: 'Draft setup',
    statusLabel: 'Draft',
    statusTone: 'setup',
    subtitle: 'The front office is still creating the ticket.',
    recommendedTitle: 'Finish ticket setup',
    recommendedDetail: 'Complete the required customer, location, service scope, due date, and requested service window before submitting the ticket.',
    targetWorkflow: 'Service Details',
    actionStatus: '6 setup items open',
    primaryAction: 'Edit Ticket',
    stageHeading: 'Setup requirements',
    stageDescription: 'Draft tickets show the setup details needed before the work can be scheduled.',
    blockers: [
      'Select a customer and service location.',
      'Confirm the equipment or describe component-only work.',
      'Add clear service scope or technician instructions.',
      'Set the due date or requested service window.',
      'Choose whether the ticket should stay Draft or move to Submitted.'
    ],
    completedSignals: ['Ticket number created', 'Billing party can be selected now or before office review'],
    allowedStatuses: ['Draft', 'Submitted', 'Cancelled'],
    invoiceMode: 'later'
  },
  submitted: {
    activeTab: 'Service Details',
    label: 'Submitted work',
    statusLabel: 'Submitted',
    statusTone: 'active',
    subtitle: 'The ticket is complete enough for Scheduling.',
    recommendedTitle: 'Send to Scheduling',
    recommendedDetail: 'Intake is complete. Open Scheduling to assign the technician and service window.',
    targetWorkflow: 'Scheduling',
    actionStatus: 'Ready for Scheduling',
    primaryAction: 'Open Scheduling',
    stageHeading: 'Service details',
    stageDescription: 'The ticket is ready for schedule placement. Technician and calendar changes happen from Scheduling.',
    blockers: [],
    completedSignals: ['Customer, location, billing party, service scope, priority, and requested timing are present'],
    allowedStatuses: ['Draft', 'Submitted', 'Assigned', 'Waiting on Parts', 'Waiting on Customer', 'Cancelled'],
    invoiceMode: 'later'
  },
  assigned: {
    activeTab: 'Service Details',
    label: 'Assigned work',
    statusLabel: 'Assigned',
    statusTone: 'active',
    subtitle: 'The ticket has a technician and committed service window.',
    recommendedTitle: 'Review service packet',
    recommendedDetail: 'Check access notes, scope, and equipment details before work begins.',
    targetWorkflow: 'Service Details',
    actionStatus: 'Scheduled by Scheduling',
    primaryAction: 'Review packet',
    stageHeading: 'Field readiness',
    stageDescription: 'The ticket shows the schedule context technicians need, without editing the schedule here.',
    blockers: [
      'Confirm site access or safety notes.',
      'Confirm the technician can identify the equipment or component being serviced.'
    ],
    completedSignals: ['Technician assigned by Scheduling', 'Committed service window visible', 'Due date set'],
    allowedStatuses: ['Submitted', 'Assigned', 'In Progress', 'Waiting on Parts', 'Waiting on Customer', 'Cancelled'],
    invoiceMode: 'later'
  },
  inProgress: {
    activeTab: 'Labor',
    label: 'Field work',
    statusLabel: 'In Progress',
    statusTone: 'active',
    subtitle: 'Technicians are actively recording time, work notes, parts, and files.',
    recommendedTitle: 'Monitor field work',
    recommendedDetail: 'Review current work notes, active time entries, parts, and photos without pulling the ticket into billing too early.',
    targetWorkflow: 'Field Work',
    actionStatus: 'Field activity in progress',
    primaryAction: 'Review field activity',
    stageHeading: 'Current field activity',
    stageDescription: 'In-progress tickets should highlight technician updates and current blockers.',
    blockers: [
      'One active time entry is still open.',
      'Technician has not uploaded completion photos yet.'
    ],
    completedSignals: ['Technician assigned', 'Work has started', 'Latest field note is visible'],
    allowedStatuses: ['Assigned', 'In Progress', 'Waiting on Parts', 'Waiting on Customer', 'Completed', 'Cancelled'],
    invoiceMode: 'later'
  },
  waitingParts: {
    activeTab: 'Parts',
    label: 'Parts blocker',
    statusLabel: 'Waiting on Parts',
    statusTone: 'waiting',
    subtitle: 'Work is paused because a part or ordering decision is blocking progress.',
    recommendedTitle: 'Resolve parts blocker',
    recommendedDetail: 'Review requested parts, approve or reject office ordering, and record the next supply action.',
    targetWorkflow: 'Parts & Files',
    actionStatus: '1 parts item open',
    primaryAction: 'Review parts',
    stageHeading: 'Parts and files',
    stageDescription: 'Waiting tickets should point directly to the reason work cannot move forward.',
    blockers: [
      'Hydraulic hose needs office order.',
      'Vendor ETA has not been recorded.'
    ],
    completedSignals: ['Field work is tied to the right ticket', 'Existing notes and photos remain available'],
    allowedStatuses: ['Assigned', 'In Progress', 'Waiting on Parts', 'Waiting on Customer', 'Cancelled'],
    invoiceMode: 'later'
  },
  completed: {
    activeTab: 'Invoice Review',
    label: 'Office review',
    statusLabel: 'Completed',
    statusTone: 'review',
    subtitle: 'Field work is done. The office now reviews labor, parts, files, billing details, and closeout notes.',
    recommendedTitle: 'Complete office review',
    recommendedDetail: 'Clear time approval, parts review, documentation, billing contact, PO, and closeout notes before marking the ticket ready to invoice.',
    targetWorkflow: 'Invoice Review',
    actionStatus: '4 office-review items open',
    primaryAction: 'Start office review',
    stageHeading: 'Office review checklist',
    stageDescription: 'Field work is done, so office review focuses on billing readiness.',
    blockers: [
      'Approve 2 completed time entries.',
      'Review 1 requested part before billing handoff.',
      'Confirm photos or documentation are complete.',
      'Confirm billing contact and PO details.'
    ],
    completedSignals: ['Field work is complete', 'Clock-out summary is present', 'Ticket can no longer appear in employee open jobs'],
    allowedStatuses: ['In Progress', 'Completed', 'Ready to Invoice', 'Cancelled'],
    invoiceMode: 'review'
  },
  readyToInvoice: {
    activeTab: 'Invoice Review',
    label: 'Ready for billing',
    statusLabel: 'Ready to Invoice',
    statusTone: 'ready',
    subtitle: 'Office review is complete. Billing can use the invoice-ready packet.',
    recommendedTitle: 'Send to billing',
    recommendedDetail: 'All office-review checks are clear. Open the invoice-ready packet or move the ticket to Invoiced after billing is complete.',
    targetWorkflow: 'Invoice Review',
    actionStatus: 'Ready for billing handoff',
    primaryAction: 'Open invoice packet',
    stageHeading: 'Billing handoff',
    stageDescription: 'Billing can open a complete packet without changing the service record.',
    blockers: [],
    completedSignals: [
      'Labor approved',
      'Parts approved or rejected',
      'Files reviewed',
      'Billing details confirmed',
      'Closeout notes present'
    ],
    allowedStatuses: ['Completed', 'Ready to Invoice', 'Invoiced'],
    invoiceMode: 'ready'
  },
  invoiced: {
    activeTab: 'History',
    label: 'Invoiced',
    statusLabel: 'Invoiced',
    statusTone: 'closed',
    subtitle: 'Billing is complete. The ticket is retained for history, reporting, and audit review.',
    recommendedTitle: 'Invoice complete',
    recommendedDetail: 'Keep the ticket read-only unless a manager reopens it.',
    targetWorkflow: 'History',
    actionStatus: 'Closed',
    primaryAction: 'Review history',
    stageHeading: 'Closed ticket history',
    stageDescription: 'Invoiced tickets should feel complete, with editing and status changes treated as exceptions.',
    blockers: [],
    completedSignals: ['Invoice sent', 'Closeout packet retained', 'Ticket available in reports and history'],
    allowedStatuses: ['Invoiced'],
    invoiceMode: 'closed'
  }
}

function getInvoicePreview(model: TicketPreviewModel) {
  if (model.invoiceMode === 'later') {
    return {
      title: 'Invoice review is later',
      tone: 'later',
      body: 'Billing checks stay available here, but they do not become the main action until field work is complete.',
      metrics: ['Not started', 'No billing handoff', 'Waiting on field completion']
    }
  }

  if (model.invoiceMode === 'review') {
    return {
      title: 'Office review drives billing readiness',
      tone: 'review',
      body: 'Field work is complete. The office can now clear billing details, documentation, parts, and labor.',
      metrics: ['5 / 9 checks ready', `${model.blockers.length} open requirements`, '$0.00 approved total']
    }
  }

  if (model.invoiceMode === 'ready') {
    return {
      title: 'Ready to invoice',
      tone: 'ready',
      body: 'Office review is clear. Billing can use the invoice-ready packet without hunting through the ticket.',
      metrics: ['9 / 9 checks ready', '0 open requirements', '$1,248.50 approved total']
    }
  }

  return {
    title: 'Invoice complete',
    tone: 'closed',
      body: 'The ticket is closed and retained for history.',
    metrics: ['Invoice sent', 'Read-only closeout packet', 'Available in reports']
  }
}

type InvoicePreview = ReturnType<typeof getInvoicePreview>

type PreviewTabPanelProps = {
  activeTab: PreviewTab
  invoicePreview: InvoicePreview
  model: TicketPreviewModel
  selectedStage: TicketPreviewStage
}

function getSchedulingContext(selectedStage: TicketPreviewStage) {
  if (selectedStage === 'draft') {
    return {
      status: 'Not ready for Scheduling',
      technician: 'Not assigned',
      window: 'Requested window not set'
    }
  }

  if (selectedStage === 'submitted') {
    return {
      status: 'Ready for Scheduling',
      technician: 'Scheduling will assign',
      window: 'Requested: 6/9/2026 afternoon'
    }
  }

  return {
    status: 'Scheduled by Scheduling',
    technician: 'Taylor Technician',
    window: '6/9/2026, 2:21 PM'
  }
}

function getHistoryItems(selectedStage: TicketPreviewStage) {
  const items = [
    { when: '6/8/2026 9:14 AM', title: 'Ticket created', detail: 'Front office started JT-2026-000001.' },
    { when: '6/8/2026 9:21 AM', title: 'Customer and location confirmed', detail: 'Acme Manufacturing at North Plant.' },
    { when: '6/8/2026 9:32 AM', title: 'Service scope added', detail: 'Tiltmobile hydraulic service added to the ticket packet.' }
  ]

  if (selectedStage !== 'draft') {
    items.push({ when: '6/8/2026 9:40 AM', title: 'Ticket submitted', detail: 'Intake packet is ready for Scheduling review.' })
  }

  if (!['draft', 'submitted'].includes(selectedStage)) {
    items.push({ when: '6/8/2026 10:05 AM', title: 'Scheduling updated', detail: 'Scheduling assigned Taylor Technician and committed the service window.' })
  }

  if (['inProgress', 'waitingParts', 'completed', 'readyToInvoice', 'invoiced'].includes(selectedStage)) {
    items.push({ when: '6/9/2026 2:25 PM', title: 'Field work started', detail: 'Technician opened the ticket and began recording labor notes.' })
  }

  if (['completed', 'readyToInvoice', 'invoiced'].includes(selectedStage)) {
    items.push({ when: '6/9/2026 3:18 PM', title: 'Field work completed', detail: 'Work notes, parts, and closeout photos are ready for office review.' })
  }

  if (selectedStage === 'readyToInvoice' || selectedStage === 'invoiced') {
    items.push({ when: '6/9/2026 4:02 PM', title: 'Office review cleared', detail: 'Labor, parts, files, billing details, and closeout notes were approved.' })
  }

  if (selectedStage === 'invoiced') {
    items.push({ when: '6/10/2026 8:15 AM', title: 'Invoice sent', detail: 'Billing completed the invoice and retained the closeout packet.' })
  }

  return items
}

function PreviewTabPanel({ activeTab, invoicePreview, model, selectedStage }: PreviewTabPanelProps) {
  const schedulingContext = getSchedulingContext(selectedStage)

  if (activeTab === 'Labor') {
    return (
      <section className="preview-panel preview-stage-panel">
        <div className="preview-panel-heading">
          <div>
            <h3>Labor</h3>
            <p className="muted">Time entries, active work, and approval state stay grouped here.</p>
          </div>
        </div>
        <div className="preview-stage-grid">
          <div><span>Approved labor</span><strong>{selectedStage === 'completed' || selectedStage === 'readyToInvoice' || selectedStage === 'invoiced' ? '3.5h' : '0h'}</strong></div>
          <div><span>Pending entries</span><strong>{selectedStage === 'completed' ? '2' : selectedStage === 'inProgress' ? '1 active' : '0'}</strong></div>
          <div><span>Travel time</span><strong>{selectedStage === 'inProgress' ? '0.5h' : '0h'}</strong></div>
          <div><span>Review state</span><strong>{selectedStage === 'completed' ? 'Needs approval' : 'No blocker'}</strong></div>
        </div>
        <div className={selectedStage === 'completed' ? 'preview-open-items' : 'preview-complete-list'}>
          <strong>{selectedStage === 'completed' ? 'Labor review is blocking invoice readiness' : 'Labor context'}</strong>
          <ul>
            <li>{selectedStage === 'inProgress' ? 'Taylor Technician has one active time entry.' : 'No active time entry is open.'}</li>
            <li>{selectedStage === 'completed' ? 'Approve completed entries before billing handoff.' : 'Approved labor totals remain visible for review.'}</li>
          </ul>
        </div>
      </section>
    )
  }

  if (activeTab === 'Parts') {
    return (
      <section className="preview-panel preview-stage-panel">
        <div className="preview-panel-heading">
          <div>
            <h3>Parts</h3>
            <p className="muted">Used parts and office-order requests are reviewed without pulling users into purchasing.</p>
          </div>
        </div>
        <div className="preview-stage-grid">
          <div><span>Parts recorded</span><strong>{selectedStage === 'waitingParts' || selectedStage === 'completed' || selectedStage === 'readyToInvoice' ? '1' : '0'}</strong></div>
          <div><span>Office orders</span><strong>{selectedStage === 'waitingParts' ? '1 open' : '0 open'}</strong></div>
          <div><span>Approved parts</span><strong>{selectedStage === 'readyToInvoice' || selectedStage === 'invoiced' ? '1' : '0'}</strong></div>
          <div><span>Billing state</span><strong>{selectedStage === 'waitingParts' ? 'Blocked' : 'No blocker'}</strong></div>
        </div>
        <div className={selectedStage === 'waitingParts' ? 'preview-open-items' : 'preview-complete-list'}>
          <strong>{selectedStage === 'waitingParts' ? 'Parts blocker' : 'Parts context'}</strong>
          <ul>
            <li>{selectedStage === 'waitingParts' ? 'Hydraulic hose needs office ordering.' : 'No open office-order request.'}</li>
            <li>Technician wording uses "Request office ordering for this part."</li>
          </ul>
        </div>
      </section>
    )
  }

  if (activeTab === 'Files') {
    const fileItems = selectedStage === 'readyToInvoice' || selectedStage === 'invoiced'
      ? [
          { name: 'Completion photo - compressor skid.jpg', detail: 'Marked for invoice review' },
          { name: 'Signed work authorization.pdf', detail: 'Ticket attachment' },
          { name: 'Hydraulic fitting closeup.webp', detail: 'Field photo' }
        ]
      : selectedStage === 'completed'
        ? [
            { name: 'Completion photo - compressor skid.jpg', detail: 'Needs office review' }
          ]
        : []

    return (
      <section className="preview-panel preview-stage-panel">
        <div className="preview-panel-heading">
          <div>
            <h3>Files</h3>
            <p className="muted">Photos, PDFs, and invoice attachments attached to this ticket.</p>
          </div>
        </div>
        <div className="preview-stage-grid">
          <div><span>Photos/files</span><strong>{selectedStage === 'completed' ? 'Needs review' : selectedStage === 'readyToInvoice' || selectedStage === 'invoiced' ? '3' : '0'}</strong></div>
          <div><span>Invoice attachments</span><strong>{selectedStage === 'readyToInvoice' || selectedStage === 'invoiced' ? '1' : '0'}</strong></div>
          <div><span>Last upload</span><strong>{selectedStage === 'readyToInvoice' || selectedStage === 'invoiced' ? 'Completion photo' : 'None'}</strong></div>
          <div><span>Review state</span><strong>{selectedStage === 'completed' ? 'Confirm docs' : 'No blocker'}</strong></div>
        </div>
        {fileItems.length ? (
          <ul className="preview-file-list" aria-label="attached files">
            {fileItems.map((file) => (
              <li key={file.name}>
                <strong>{file.name}</strong>
                <span>{file.detail}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No files have been uploaded yet.</p>
        )}
        <form className="preview-upload-form" aria-label="file upload">
          <label>
            Photo or file
            <input type="file" />
          </label>
          <label>
            Caption
            <input placeholder="Optional caption or closeout note" />
          </label>
          <label className="checkbox-row">
            <input type="checkbox" />
            <span>Mark for invoice review</span>
          </label>
          <button type="button">Upload File</button>
        </form>
      </section>
    )
  }

  if (activeTab === 'Invoice Review') {
    return (
      <section className={`preview-panel preview-invoice-panel preview-invoice-${invoicePreview.tone}`}>
        <div className="preview-panel-heading">
          <div>
            <h3>{invoicePreview.title}</h3>
            <p className="muted">{invoicePreview.body}</p>
          </div>
        </div>
        <div className="preview-invoice-metrics">
          {invoicePreview.metrics.map((metric) => (
            <div key={metric}>
              <span>Invoice signal</span>
              <strong>{metric}</strong>
            </div>
          ))}
        </div>
        {model.invoiceMode === 'review' && model.blockers.length ? (
          <div className="preview-open-items">
            <strong>{model.blockers.length} office-review item{model.blockers.length === 1 ? '' : 's'} open</strong>
            <ul>
              {model.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
            </ul>
          </div>
        ) : null}
      </section>
    )
  }

  if (activeTab === 'History') {
    const historyItems = getHistoryItems(selectedStage)
    return (
      <section className="preview-panel preview-stage-panel">
        <div className="preview-panel-heading">
          <div>
            <h3>History</h3>
            <p className="muted">Activity that has already happened on this ticket.</p>
          </div>
        </div>
        <ol className="preview-timeline" aria-label="ticket history">
          {historyItems.map((item) => (
            <li key={`${item.when}-${item.title}`}>
              <span>{item.when}</span>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </li>
          ))}
        </ol>
      </section>
    )
  }

  return (
    <section className="preview-panel preview-stage-panel">
      <div className="preview-panel-heading">
        <div>
          <h3>{model.stageHeading}</h3>
          <p className="muted">{model.stageDescription}</p>
        </div>
        <span className={`preview-status preview-status-${model.statusTone}`}>{model.label}</span>
      </div>
      <div className="preview-stage-grid">
        <div><span>Customer</span><strong>Acme Manufacturing</strong></div>
        <div><span>Billing party</span><strong>Acme Manufacturing</strong></div>
        <div><span>Scheduling status</span><strong>{schedulingContext.status}</strong></div>
        <div><span>Technician</span><strong>{schedulingContext.technician}</strong></div>
        <div><span>Service window</span><strong>{schedulingContext.window}</strong></div>
        <div><span>Due</span><strong>{selectedStage === 'draft' ? 'Not set' : '6/9/2026, 3:21 PM'}</strong></div>
      </div>
      {model.blockers.length ? (
        <div className="preview-open-items" aria-label="items needing attention">
          <strong>{model.blockers.length} item{model.blockers.length === 1 ? '' : 's'} need attention</strong>
          <ul>
            {model.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
          </ul>
        </div>
      ) : (
        <div className="preview-ready-items" aria-label="ready to continue">
          <strong>Ready to continue</strong>
          <p>The next handoff can proceed.</p>
        </div>
      )}
      <div className="preview-complete-list" aria-label="completed items">
        <strong>Completed</strong>
        <ul>
          {model.completedSignals.map((signal) => <li key={signal}>{signal}</li>)}
        </ul>
      </div>
    </section>
  )
}

export function JobTicketWorkflowPreviewPage() {
  const [selectedStage, setSelectedStage] = useState<TicketPreviewStage>('submitted')
  const model = previewModels[selectedStage]
  const [activePreviewTab, setActivePreviewTab] = useState<PreviewTab>(model.activeTab)
  const invoicePreview = useMemo(() => getInvoicePreview(model), [model])
  const schedulingContext = getSchedulingContext(selectedStage)

  useEffect(() => {
    setActivePreviewTab(model.activeTab)
  }, [model.activeTab])

  return (
    <main className="desktop-shell job-ticket-workflow-preview">
      <section className="preview-ticket-shell" aria-label="job ticket workspace">
        <header className="preview-ticket-hero">
          <div>
            <span className="muted">Service ticket</span>
            <h2>JT-2026-000001</h2>
            <p>Tiltmobile hydraulic service</p>
          </div>
          <div className="preview-hero-actions" aria-label="ticket actions">
            <button type="button" className="secondary-button">Print Job Review</button>
            <button type="button">Edit Ticket</button>
            <button type="button" className="secondary-button">Archive Review</button>
          </div>
          <div className="preview-ticket-facts" aria-label="ticket key details">
            <div><span>Status</span><strong className={`preview-status preview-status-${model.statusTone}`}>{model.statusLabel}</strong></div>
            <div><span>Priority</span><strong>High</strong></div>
            <div><span>Customer</span><strong>Acme Manufacturing</strong></div>
            <div><span>Service location</span><strong>North Plant</strong></div>
            <div><span>Equipment</span><strong>North Compressor Skid</strong></div>
            <div><span>Due</span><strong>6/9/2026, 3:21 PM</strong></div>
            <div><span>Scheduled</span><strong>{schedulingContext.window}</strong></div>
          </div>
        </header>

        <section className={`preview-recommended-action preview-recommended-${model.statusTone}`} aria-label="next action">
          <div>
            <span>Next action</span>
            <strong>{model.recommendedTitle}</strong>
            <p>{model.recommendedDetail}</p>
          </div>
          <div className="preview-target-workflow">
            <span>Goes to</span>
            <strong>{model.targetWorkflow}</strong>
            <small>{model.actionStatus}</small>
          </div>
          {model.targetWorkflow === 'Scheduling' ? (
            <Link className="button-link" to="/manage/schedule">{model.primaryAction}</Link>
          ) : (
            <button type="button">{model.primaryAction}</button>
          )}
        </section>

        <nav className="ticket-workflow-tabs preview-tab-strip" aria-label="ticket sections">
          <div role="tablist" aria-label="ticket sections">
            {tabLabels.map((tab) => (
              <button
                aria-selected={activePreviewTab === tab}
                className={activePreviewTab === tab ? 'ticket-workflow-tab-active' : ''}
                key={tab}
                onClick={() => setActivePreviewTab(tab)}
                role="tab"
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>
        </nav>

        <section className="preview-ticket-layout">
          <div className="preview-ticket-main">
            <PreviewTabPanel
              activeTab={activePreviewTab}
              invoicePreview={invoicePreview}
              model={model}
              selectedStage={selectedStage}
            />
          </div>

          <aside className="preview-ticket-rail" aria-label="ticket controls">
            <section className="preview-panel">
              <h3>Quick Actions</h3>
              <div className="preview-action-list">
                <button type="button">Edit Ticket</button>
                <button type="button" className="secondary-button">Add Note</button>
                <button type="button" className="secondary-button" onClick={() => setActivePreviewTab('Files')}>Add File</button>
                <Link className="button-link secondary-link" to="/manage/schedule">Open Scheduling</Link>
              </div>
            </section>

            <section className="preview-panel">
              <h3>Status</h3>
              <p className="muted">{model.subtitle}</p>
              <label className="sr-label">
                Ticket status
                <select value={selectedStage} onChange={(event) => setSelectedStage(event.target.value as TicketPreviewStage)}>
                  {previewStages.map((stage) => (
                    <option key={stage.value} value={stage.value}>{stage.label}</option>
                  ))}
                </select>
              </label>
              <details className="preview-override-details">
                <summary>Status change note</summary>
                <label className="sr-label">
                  Reason
                  <textarea placeholder="Add a reason for this status change." />
                </label>
              </details>
            </section>
          </aside>
        </section>
      </section>
    </main>
  )
}
