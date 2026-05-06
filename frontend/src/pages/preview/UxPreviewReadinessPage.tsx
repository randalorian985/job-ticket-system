const previewSections = [
  {
    title: 'Employee mobile workflow',
    status: 'Preview-ready',
    items: [
      'Login route is available at /login.',
      'Assigned jobs list is available at /jobs.',
      'Job detail is available at /jobs/:jobTicketId.'
    ]
  },
  {
    title: 'Manager/Admin console',
    status: 'Preview-ready',
    items: [
      'Operations dashboard is available at /manage.',
      'Job tickets, master data, approvals, reports, and Admin users routes are present.',
      'Role boundaries remain enforced by protected routes.'
    ]
  },
  {
    title: 'Local service checks',
    status: 'Runbook-defined',
    items: [
      'Backend health must respond at /health.',
      'System metadata must respond at /api/system/info.',
      'Frontend preview should be served from a freshly built Vite bundle.'
    ]
  }
]

export function UxPreviewReadinessPage() {
  return (
    <main className="desktop-shell ux-preview-shell">
      <section className="card hero-card">
        <p className="eyebrow">UX Preview Readiness</p>
        <h1>Job Ticket System local demo</h1>
        <p className="muted">
          This static readiness screen is intentionally public so reviewers can confirm the built frontend renders before
          signing in or connecting seeded demo data.
        </p>
        <div className="preview-actions" aria-label="Preview routes">
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
          Use this screen as the first smoke-check after{' '}
          <code>VITE_API_BASE_URL=http://localhost:5000 npm run build</code> and{' '}
          <code>npm run preview -- --host 0.0.0.0</code>. Set <code>VITE_API_BASE_URL</code> before building
          because Vite embeds it in the preview bundle. Then
          follow <code>docs/local-demo-runbook.md</code> for backend, database, health, and route walkthrough
          checks.
        </p>
      </section>
    </main>
  )
}
