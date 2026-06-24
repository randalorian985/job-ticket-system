import type { CompanyConfigurationDto } from '../../../types'
import { computeBrandColors } from '../../../features/companyBranding/CompanyBrandingContext'

type CompanyConfigurationPreviewProps = {
  configuration: CompanyConfigurationDto
  logoUrl: string | null
  initials: string
  addressLines: string[]
}

export function CompanyConfigurationPreview({
  configuration,
  logoUrl,
  initials,
  addressLines
}: CompanyConfigurationPreviewProps) {
  const contactLines = [
    configuration.contactName,
    configuration.phone,
    configuration.email,
    configuration.website
  ].filter((line): line is string => Boolean(line))

  const c = computeBrandColors(configuration)

  return (
    <aside className="company-config-preview stack" aria-label="company branding preview">
      <section className="company-config-panel stack">
        <div className="company-brand-lockup company-brand-lockup-large">
          {logoUrl ? (
            <img src={logoUrl} alt={`${configuration.companyName} logo`} />
          ) : (
            <span className="product-mark" aria-hidden="true">{initials}</span>
          )}
          <div>
            <p className="eyebrow">Company brand</p>
            <h3>{configuration.companyName}</h3>
            {configuration.legalName ? <p className="muted">{configuration.legalName}</p> : null}
          </div>
        </div>
        <div className="company-preview-lines">
          {addressLines.map((line) => <span key={line}>{line}</span>)}
          {contactLines.map((line) => <span key={line}>{line}</span>)}
          {!addressLines.length && !contactLines.length ? <span className="muted">No contact details saved yet.</span> : null}
        </div>
      </section>

      <section className="company-config-panel stack">
        <div className="company-config-section-heading">
          <div>
            <p className="eyebrow">Color scheme</p>
            <h3>Live palette</h3>
          </div>
        </div>

        <div>
          <p className="company-palette-group-label">Configurable</p>
          <div className="company-swatch-grid company-swatch-grid-3col">
            <Swatch label="Primary" value={c.primary} usage="Buttons, headers" />
            <Swatch label="Secondary" value={c.secondary} usage="Active nav text" />
            <Swatch label="Accent" value={c.accent} usage="Success, approve" />
          </div>
        </div>

        <div>
          <p className="company-palette-group-label">Derived automatically</p>
          <div className="company-swatch-grid company-swatch-grid-3col">
            <Swatch label="Brand hover" value={c.brandStrong} usage="Button hover" />
            <Swatch label="Brand soft" value={c.brandSoft} usage="Nav hover bg" />
            <Swatch label="Text on primary" value={c.brandContrast} usage="On brand buttons" />
            <Swatch label="Nav active" value={c.accentNavy} usage="Active nav link" />
            <Swatch label="Nav active bg" value={c.accentSoft} usage="Active nav bg" />
            <Swatch label="Accent hover" value={c.accentDark} usage="Approve hover" />
          </div>
        </div>
      </section>

      <section className="company-config-panel company-export-preview">
        <div className="company-export-preview-header">
          {logoUrl ? (
            <img src={logoUrl} alt="" aria-hidden="true" />
          ) : (
            <span className="product-mark" aria-hidden="true">{initials}</span>
          )}
          <div>
            <strong>{configuration.companyName}</strong>
            <span>{[configuration.phone, configuration.email].filter(Boolean).join(' | ') || 'Company contact details'}</span>
          </div>
        </div>
        <div className="company-export-preview-band" />
        <div className="company-export-preview-body">
          <span>Report or customer-facing document</span>
          <strong>Service summary</strong>
        </div>
      </section>
    </aside>
  )
}

function Swatch({ label, value, usage }: { label: string, value: string, usage?: string }) {
  return (
    <div className="company-swatch">
      <span style={{ backgroundColor: value }} className="company-swatch-chip" aria-hidden="true" />
      <div>
        <strong>{label}</strong>
        <code>{value}</code>
        {usage ? <span className="company-swatch-usage">{usage}</span> : null}
      </div>
    </div>
  )
}
