import type { ChangeEvent, FormEvent } from 'react'
import type { UpdateCompanyConfigurationDto } from '../../../types'

type FieldDef = {
  name: keyof UpdateCompanyConfigurationDto
  label: string
  type?: string
  required?: boolean
  maxLength?: number
}

const textFields: FieldDef[] = [
  { name: 'companyName',   label: 'Company name',    required: true, maxLength: 200 },
  { name: 'legalName',     label: 'Legal name',                      maxLength: 200 },
  { name: 'contactName',   label: 'Primary contact',                 maxLength: 200 },
  { name: 'email',         label: 'Contact email',   type: 'email',  maxLength: 320 },
  { name: 'phone',         label: 'Phone',                           maxLength: 50  },
  { name: 'website',       label: 'Website',         type: 'url',    maxLength: 300 },
  { name: 'addressLine1',  label: 'Address line 1',                  maxLength: 200 },
  { name: 'addressLine2',  label: 'Address line 2',                  maxLength: 200 },
  { name: 'city',          label: 'City',                            maxLength: 100 },
  { name: 'state',         label: 'State',                           maxLength: 100 },
  { name: 'postalCode',    label: 'Postal code',                     maxLength: 20  },
  { name: 'country',       label: 'Country',                         maxLength: 100 },
]

const colorFields: Array<{ name: keyof UpdateCompanyConfigurationDto; label: string }> = [
  { name: 'primaryColor',   label: 'Primary color'   },
  { name: 'secondaryColor', label: 'Secondary color' },
  { name: 'accentColor',    label: 'Accent color'    },
]

type CompanyConfigurationFormProps = {
  value: UpdateCompanyConfigurationDto
  isSaving: boolean
  onChange: (value: UpdateCompanyConfigurationDto) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function CompanyConfigurationForm({
  value,
  isSaving,
  onChange,
  onSubmit,
}: CompanyConfigurationFormProps) {
  const updateField =
    (name: keyof UpdateCompanyConfigurationDto) =>
    (event: ChangeEvent<HTMLInputElement>) => {
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
          {textFields.map((field) => {
            const fieldId = `cc-${field.name}`
            const strVal = String(value[field.name] ?? '')
            return (
              <div key={field.name} className="company-config-field">
                <label htmlFor={fieldId}>{field.label}</label>
                <input
                  id={fieldId}
                  type={field.type ?? 'text'}
                  value={strVal}
                  onChange={updateField(field.name)}
                  required={field.required}
                  maxLength={field.maxLength}
                />
                {field.maxLength != null ? (
                  <CharCount value={strVal} max={field.maxLength} />
                ) : null}
              </div>
            )
          })}
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

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length
  const className =
    len >= max ? 'char-count char-count-limit' :
    len > max * 0.85 ? 'char-count char-count-warn' :
    'char-count'
  return <span className={className}>{len} / {max}</span>
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
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
