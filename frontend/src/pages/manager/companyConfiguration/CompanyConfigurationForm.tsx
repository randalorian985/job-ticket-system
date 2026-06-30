import type { ChangeEvent, FormEvent } from 'react'
import type { UpdateCompanyConfigurationDto } from '../../../types'

type CompanyConfigurationFormProps = {
  value: UpdateCompanyConfigurationDto
  isSaving: boolean
  onChange: (value: UpdateCompanyConfigurationDto) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

const textFields: Array<{ name: keyof UpdateCompanyConfigurationDto, label: string, type?: string, required?: boolean, note?: string }> = [
  { name: 'companyName', label: 'Company name', required: true },
  { name: 'legalName', label: 'Legal name' },
  { name: 'contactName', label: 'Primary contact' },
  { name: 'email', label: 'Part order requests email', type: 'email', note: 'Used when office-order parts are requested from a ticket or the back-office queue.' },
  { name: 'phone', label: 'Phone' },
  { name: 'website', label: 'Website', type: 'url' },
  { name: 'addressLine1', label: 'Address line 1' },
  { name: 'addressLine2', label: 'Address line 2' },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
  { name: 'postalCode', label: 'Postal code' },
  { name: 'country', label: 'Country' }
]

const colorFields: Array<{ name: keyof UpdateCompanyConfigurationDto, label: string }> = [
  { name: 'primaryColor', label: 'Primary color' },
  { name: 'secondaryColor', label: 'Secondary color' },
  { name: 'accentColor', label: 'Accent color' }
]

export function CompanyConfigurationForm({ value, isSaving, onChange, onSubmit }: CompanyConfigurationFormProps) {
  const updateField = (name: keyof UpdateCompanyConfigurationDto) => (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, [name]: event.target.value })
  }

  return (
    <form className="company-config-form stack" onSubmit={onSubmit}>
      <section className="company-config-panel stack" aria-label="company profile">
        <div className="company-config-section-heading">
          <div>
            <p className="eyebrow">Company profile</p>
            <h3>Business information</h3>
          </div>
        </div>
        <div className="company-config-grid">
          {textFields.map((field) => (
            <label key={field.name}>
              {field.label}
              <input
                type={field.type ?? 'text'}
                value={String(value[field.name] ?? '')}
                onChange={updateField(field.name)}
                required={field.required}
              />
              {field.note ? <span className="company-config-field-note">{field.note}</span> : null}
            </label>
          ))}
        </div>
      </section>

      <section className="company-config-panel stack" aria-label="brand colors">
        <div className="company-config-section-heading">
          <div>
            <p className="eyebrow">Brand colors</p>
            <h3>UI and export color scheme</h3>
          </div>
        </div>
        <div className="company-color-grid">
          {colorFields.map((field) => (
            <ColorField
              key={field.name}
              label={field.label}
              value={String(value[field.name] ?? '')}
              onChange={updateField(field.name)}
            />
          ))}
        </div>
      </section>

      <div className="company-config-actions">
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save company profile'}
        </button>
      </div>
    </form>
  )
}

function ColorField({ label, value, onChange }: { label: string, value: string, onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  const colorValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#3157C8'

  return (
    <label className="company-color-field">
      {label}
      <span>
        <input aria-label={`${label} picker`} type="color" value={colorValue} onChange={onChange} />
        <input
          aria-label={`${label} hex`}
          value={value}
          onChange={onChange}
          maxLength={7}
          pattern="#[0-9A-Fa-f]{6}"
          placeholder="#3157C8"
        />
      </span>
    </label>
  )
}
