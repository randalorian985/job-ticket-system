import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { companyConfigurationApi } from '../../api/companyConfigurationApi'
import type { CompanyConfigurationDto } from '../../types'

type CompanyBrandingContextValue = {
  configuration: CompanyConfigurationDto
  isLoading: boolean
  logoUrl: string | null
  initials: string
  addressLines: string[]
  refresh: () => Promise<CompanyConfigurationDto>
}

export const defaultCompanyConfiguration: CompanyConfigurationDto = {
  id: 'b8b0a81b-5c16-45b3-9b4e-60d6a55f6125',
  companyName: 'Job Ticket System',
  legalName: null,
  contactName: null,
  email: null,
  phone: null,
  website: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  postalCode: null,
  country: null,
  primaryColor: '#3157C8',
  secondaryColor: '#172033',
  accentColor: '#087F5B',
  hasLogo: false,
  logoOriginalFileName: null,
  logoContentType: null,
  logoFileSizeBytes: null,
  logoUploadedAtUtc: null,
  createdAtUtc: null,
  updatedAtUtc: null
}

const CompanyBrandingContext = createContext<CompanyBrandingContextValue | undefined>(undefined)

export function CompanyBrandingProvider({ children }: { children: React.ReactNode }) {
  const [configuration, setConfiguration] = useState<CompanyConfigurationDto>(defaultCompanyConfiguration)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    const nextConfiguration = await companyConfigurationApi.get()
    setConfiguration(nextConfiguration)
    return nextConfiguration
  }, [])

  useEffect(() => {
    let isMounted = true

    companyConfigurationApi
      .get()
      .then((nextConfiguration) => {
        if (isMounted) setConfiguration(nextConfiguration)
      })
      .catch(() => {
        if (isMounted) setConfiguration(defaultCompanyConfiguration)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    applyBrandVariables(configuration)
  }, [configuration])

  const value = useMemo(
    () => buildCompanyBrandingValue(configuration, isLoading, refresh),
    [configuration, isLoading, refresh]
  )

  return <CompanyBrandingContext.Provider value={value}>{children}</CompanyBrandingContext.Provider>
}

export function useCompanyBranding() {
  return useContext(CompanyBrandingContext) ?? buildCompanyBrandingValue(defaultCompanyConfiguration, false, async () => defaultCompanyConfiguration)
}

export function companyAddressLines(configuration: CompanyConfigurationDto) {
  const cityLine = [configuration.city, configuration.state, configuration.postalCode].filter(Boolean).join(', ')
  return [
    configuration.addressLine1,
    configuration.addressLine2,
    cityLine,
    configuration.country
  ].filter((line): line is string => Boolean(line))
}

export function companyInitials(companyName: string) {
  const words = companyName
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(' ')
    .filter(Boolean)

  if (!words.length) return 'CO'
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase()
}

function buildCompanyBrandingValue(
  configuration: CompanyConfigurationDto,
  isLoading: boolean,
  refresh: () => Promise<CompanyConfigurationDto>
): CompanyBrandingContextValue {
  const logoVersion = configuration.logoUploadedAtUtc ?? configuration.updatedAtUtc

  return {
    configuration,
    isLoading,
    logoUrl: configuration.hasLogo ? companyConfigurationApi.getLogoUrl(logoVersion) : null,
    initials: companyInitials(configuration.companyName),
    addressLines: companyAddressLines(configuration),
    refresh
  }
}

function applyBrandVariables(configuration: CompanyConfigurationDto) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const primary = normalizeHex(configuration.primaryColor, defaultCompanyConfiguration.primaryColor)
  const secondary = normalizeHex(configuration.secondaryColor, defaultCompanyConfiguration.secondaryColor)
  const accent = normalizeHex(configuration.accentColor, defaultCompanyConfiguration.accentColor)

  root.style.setProperty('--company-primary', primary)
  root.style.setProperty('--company-secondary', secondary)
  root.style.setProperty('--company-accent', accent)
  root.style.setProperty('--brand', primary)
  root.style.setProperty('--brand-strong', shadeColor(primary, -22))
  root.style.setProperty('--brand-soft', mixColor(primary, '#ffffff', 0.88))
  root.style.setProperty('--brand-contrast', contrastColor(primary))
  root.style.setProperty('--accent', accent)
  root.style.setProperty('--accent-dark', shadeColor(accent, -18))
  root.style.setProperty('--ready', accent)
}

function normalizeHex(value: string | null | undefined, fallback: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value ?? '') ? (value as string).toUpperCase() : fallback
}

function contrastColor(hex: string) {
  const rgb = hexToRgb(hex)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.63 ? '#111827' : '#ffffff'
}

function shadeColor(hex: string, percent: number) {
  const rgb = hexToRgb(hex)
  const adjust = (value: number) => clamp(Math.round(value + (percent / 100) * 255))
  return rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b))
}

function mixColor(fromHex: string, toHex: string, toWeight: number) {
  const from = hexToRgb(fromHex)
  const to = hexToRgb(toHex)
  const fromWeight = 1 - toWeight
  return rgbToHex(
    Math.round(from.r * fromWeight + to.r * toWeight),
    Math.round(from.g * fromWeight + to.g * toWeight),
    Math.round(from.b * fromWeight + to.b * toWeight)
  )
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex, defaultCompanyConfiguration.primaryColor).replace('#', '')
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  }
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => clamp(value).toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

function clamp(value: number) {
  return Math.max(0, Math.min(255, value))
}
