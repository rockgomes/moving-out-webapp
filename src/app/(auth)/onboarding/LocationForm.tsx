'use client'

import { useActionState, useState, useTransition } from 'react'
import { LocateFixed, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { saveLocation, type LocationFormState } from './actions'

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
  country: string
  city?: string
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
    const country = (a.country_code ?? '').toUpperCase()
    const city = a.city ?? a.town ?? a.village ?? undefined
    const state = a.state ?? a.county ?? undefined
    const zip = a.postcode ?? undefined
    return { country, city, state, zip }
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
            if (result?.country) {
              setPrefilled(result)
            } else {
              setGeoError('Could not detect location. Please select your country.')
              setShowManual(true)
            }
            resolve()
          },
          () => {
            setGeoError('Location access denied. Please select your country.')
            setShowManual(true)
            resolve()
          },
          { timeout: 10000 },
        )
      })
    })
  }

  // ── Geolocation confirmation ──────────────────────────────────────────
  if (prefilled && !showManual) {
    return (
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="country" value={prefilled.country} />
        {prefilled.city && <input type="hidden" name="city" value={prefilled.city} />}
        {prefilled.state && <input type="hidden" name="state" value={prefilled.state} />}
        {prefilled.zip && <input type="hidden" name="zip_code" value={prefilled.zip} />}

        <div className="rounded-xl border bg-muted/40 p-4 text-sm">
          <p className="font-medium text-foreground">Detected location</p>
          <p className="mt-0.5 text-muted-foreground">
            {[prefilled.city, prefilled.country].filter(Boolean).join(', ')}
          </p>
        </div>

        {state.errors?._form && (
          <p className="text-sm text-destructive">{state.errors._form[0]}</p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
            : 'Yes, that\'s right →'}
        </Button>
        <button
          type="button"
          className="text-sm text-muted-foreground underline hover:text-foreground"
          onClick={() => { setPrefilled(null); setShowManual(true) }}
        >
          No, let me pick my country
        </button>
      </form>
    )
  }

  // ── Manual: country only ──────────────────────────────────────────────
  if (showManual) {
    return (
      <form action={action} className="flex flex-col gap-4">
        {(state.errors?._form || geoError) && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {state.errors?._form?.[0] ?? geoError}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="country">Your country</Label>
          <div className="relative">
            <select
              id="country"
              name="country"
              defaultValue=""
              className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
              aria-invalid={!!state.errors?.country}
            >
              <option value="" disabled>Select country…</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          {state.errors?.country && (
            <p className="text-xs text-destructive">{state.errors.country[0]}</p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
            : 'Continue →'}
        </Button>
      </form>
    )
  }

  // ── Default: geolocation CTA ──────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <Button
        size="lg"
        className="w-full"
        disabled={geoLoading}
        onClick={handleUseLocation}
      >
        {geoLoading
          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Detecting…</>
          : <><LocateFixed className="mr-2 h-4 w-4" /> Use my location</>}
      </Button>
      <button
        type="button"
        className="text-sm text-muted-foreground underline hover:text-foreground"
        onClick={() => setShowManual(true)}
      >
        Select country manually
      </button>
    </div>
  )
}
