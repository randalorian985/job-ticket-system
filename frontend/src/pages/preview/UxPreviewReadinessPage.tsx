const previewSections = [
  {
    title: 'Employee mobile workflow',
    status: 'Preview-ready',
    items: [
      'Employee sign-in is available.',
      'Assigned jobs list is available.',
      'Job detail opens from each assigned job.'
    ]
  },
  {
    title: 'Manager/Admin console',
    status: 'Preview-ready',
    items: [
      'Operations dashboard is available.',
      'Job tickets, master data, approvals, reports, and Admin user screens are present.',
      'Role permissions remain enforced.'
    ]
  },
  {
    title: 'Service checks',
    status: 'Runbook-defined',
    items: [
      'Application health check responds.',
      'System information check responds.',
      'The latest application screens are being served.'
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
          This public readiness screen lets reviewers confirm the application opens before signing in.
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
          Use this screen as a first review after deployment. Confirm application health, sign-in, and the
          role-specific workflows from the readiness checklist before a customer walkthrough.
        </p>
      </section>
    </main>
  )
}
