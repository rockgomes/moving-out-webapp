'use client'

import { useActionState, useState, useTransition } from 'react'
import { LocateFixed, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveLocation, type LocationFormState } from './actions'

// Countries that have states/provinces worth collecting
const STATES_COUNTRIES = new Set(['US', 'CA', 'AU', 'MX', 'BR', 'IN'])

// Curated country list (ISO 3166-1 alpha-2 + display name)
const COUNTRIES = [
  { code: 'EE', name: 'Estonia' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'FI', name: 'Finland' },
  { code: 'DK', name: 'Denmark' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'PL', name: 'Poland' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'BE', name: 'Belgium' },
  { code: 'IE', name: 'Ireland' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'SG', name: 'Singapore' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'IN', name: 'India' },
  { code: 'ZA', name: 'South Africa' },
]

interface GeoResult {
  city: string
  country: string  // ISO code
  countryName: string
  state?: string
  zip?: string
}

async function reverseGeocode(lat: number, lon: number): Promise<GeoResult | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } },
    )
    const data = await res.json()
    const a = data.address ?? {}
    const city = a.city ?? a.town ?? a.village ?? a.hamlet ?? ''
    const country = (a.country_code as string ?? '').toUpperCase()
    const countryName = a.country ?? country
    const state = a.state ?? a.county ?? undefined
    const zip = a.postcode ?? undefined
    return { city, country, countryName, state, zip }
  } catch {
    return null
  }
}

const initialState: LocationFormState = {}

export function LocationForm() {
  const [state, action, isPending] = useActionState(saveLocation, initialState)
  const [geoLoading, startGeo] = useTransition()
  const [showManual, setShowManual] = useState(false)
  const [prefilled, setPrefilled] = useState<GeoResult | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState('')

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setShowManual(true)
      return
    }
    startGeo(async () => {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
            if (result) {
              setPrefilled(result)
              setSelectedCountry(result.country)
            } else {
              setGeoError('Could not detect location. Please enter it manually.')
              setShowManual(true)
            }
            resolve()
          },
          () => {
            setGeoError('Location access denied. Please enter it manually.')
            setShowManual(true)
            resolve()
          },
          { timeout: 10000 },
        )
      })
    })
  }

  // After geolocation fills in, submit automatically via the form
  // (user sees a confirmation state before submitting)
  const showStateField = STATES_COUNTRIES.has(selectedCountry)

  // ── Geolocation confirmation view ────────────────────────────────────
  if (prefilled && !showManual) {
    return (
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="city" value={prefilled.city} />
        <input type="hidden" name="country" value={prefilled.countryName} />
        {prefilled.state && <input type="hidden" name="state" value={prefilled.state} />}
        {prefilled.zip && <input type="hidden" name="zip_code" value={prefilled.zip} />}

        <div className="rounded-xl border bg-muted/40 p-4 text-sm">
          <p className="font-medium text-foreground">Detected location</p>
          <p className="mt-0.5 text-muted-foreground">
            {[prefilled.city, prefilled.state, prefilled.countryName].filter(Boolean).join(', ')}
          </p>
        </div>

        {state.errors?._form && (
          <p className="text-sm text-destructive">{state.errors._form[0]}</p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Yes, that\'s right →'}
        </Button>
        <button
          type="button"
          className="text-sm text-muted-foreground underline hover:text-foreground"
          onClick={() => { setPrefilled(null); setShowManual(true) }}
        >
          No, let me enter it manually
        </button>
      </form>
    )
  }

  // ── Manual entry view ─────────────────────────────────────────────────
  if (showManual) {
    return (
      <form action={action} className="flex flex-col gap-4">
        {(state.errors?._form || geoError) && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {state.errors?._form?.[0] ?? geoError}
          </div>
        )}

        {/* Country */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="country">Country</Label>
          <div className="relative">
            <select
              id="country"
              name="country"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
              aria-invalid={!!state.errors?.country}
            >
              <option value="">Select country…</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          {state.errors?.country && (
            <p className="text-xs text-destructive">{state.errors.country[0]}</p>
          )}
        </div>

        {/* City */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            placeholder="Tallinn"
            autoComplete="address-level2"
            aria-invalid={!!state.errors?.city}
          />
          {state.errors?.city && (
            <p className="text-xs text-destructive">{state.errors.city[0]}</p>
          )}
        </div>

        {/* Postal code (optional) */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="zip_code">
            {showStateField ? 'ZIP / Postal Code' : 'Postal Code'}{' '}
            <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="zip_code"
            name="zip_code"
            placeholder={showStateField ? '10001' : '10115'}
            inputMode="text"
            autoComplete="postal-code"
          />
        </div>

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={isPending}>
          {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Find items near me'}
        </Button>
      </form>
    )
  }

  // ── Default view: geolocation CTA ────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {geoError && (
        <p className="text-sm text-destructive">{geoError}</p>
      )}
      <Button
        size="lg"
        className="w-full"
        disabled={geoLoading}
        onClick={handleUseLocation}
      >
        {geoLoading
          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Detecting location…</>
          : <><LocateFixed className="mr-2 h-4 w-4" /> Use my location</>}
      </Button>
      <button
        type="button"
        className="text-sm text-muted-foreground underline hover:text-foreground"
        onClick={() => setShowManual(true)}
      >
        Enter location manually
      </button>
    </div>
  )
}
