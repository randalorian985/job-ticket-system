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
            <h3>Brand swatches</h3>
          </div>
        </div>
        <div className="company-swatch-grid">
          <Swatch label="Primary" value={configuration.primaryColor} usage="Buttons, headers, nav" />
          <Swatch label="Secondary" value={configuration.secondaryColor} usage="Active nav text, secondary hover" />
          <Swatch label="Accent" value={configuration.accentColor} usage="Success, ready, approve" />
        </div>
        <DerivedSwatches configuration={configuration} />
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
      <span style={{ backgroundColor: value }} aria-hidden="true" />
      <div>
        <strong>{label}</strong>
        <code>{value}</code>
        {usage ? <span className="company-swatch-usage">{usage}</span> : null}
      </div>
    </div>
  )
}

function DerivedSwatches({ configuration }: { configuration: CompanyConfigurationDto }) {
  const c = computeBrandColors(configuration)
  return (
    <details className="company-derived-swatches">
      <summary>Derived colors</summary>
      <div className="company-swatch-grid company-swatch-grid-derived">
        <Swatch label="Brand hover" value={c.brandStrong} usage="Button / link hover states" />
        <Swatch label="Brand soft" value={c.brandSoft} usage="Nav item hover background" />
        <Swatch label="Text on primary" value={c.brandContrast} usage="Text on branded buttons" />
        <Swatch label="Nav active" value={c.accentNavy} usage="Active navigation link" />
        <Swatch label="Nav active bg" value={c.accentSoft} usage="Active navigation background" />
        <Swatch label="Accent hover" value={c.accentDark} usage="Approve / success button hover" />
      </div>
    </details>
  )
}
