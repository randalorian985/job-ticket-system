const previewSections = [
  {
    title: 'Employee mobile workflow',
    status: 'Preview-ready',
    items: [
      'Sign-in is available at /login.',
      'Assigned jobs list is available at /jobs.',
      'Job detail opens from an assigned job.'
    ]
  },
  {
    title: 'Manager/Admin console',
    status: 'Preview-ready',
    items: [
      'Operations dashboard is available at /manage.',
      'Job tickets, supporting records, approvals, reports, and Admin users screens are present.',
      'Role boundaries remain enforced on protected screens.'
    ]
  },
  {
    title: 'Local service checks',
    status: 'Runbook-defined',
    items: [
      'Health check must respond at /health.',
      'System information must respond at /api/system/info.',
      'Application files should come from the latest approved build.'
    ]
  }
]

export function UxPreviewReadinessPage() {
  return (
    <main className="desktop-shell ux-preview-shell">
      <section className="card hero-card">
        <p className="eyebrow">UX Preview Readiness</p>
        <h1>Job Ticket System readiness</h1>
        <p className="muted">
          This public readiness screen lets reviewers confirm the deployed app opens before signing in.
        </p>
        <div className="preview-actions" aria-label="Preview links">
          <a className="button-link" href="/login">
            Employee login
          </a>
          <a className="button-link secondary-link" href="/manage">
            Manager/Admin console
          </a>
        </div>
      </section>

      <section className="dashboard-grid" aria-label="Preview readiness checklist">
        {previewSections.map((section) => (
          <article className="card preview-card" key={section.title}>
            <span className="status-pill active">{section.status}</span>
            <h2>{section.title}</h2>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="card">
        <h2>Demo operator notes</h2>
        <p className="muted">
          Use this screen as a first smoke check after deployment. Confirm <code>/health</code>, sign-in, and the
          role-specific workflows from the production readiness runbook before a customer walkthrough.
        </p>
      </section>
    </main>
  )
}
