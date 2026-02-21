'use client'

import { useActionState } from 'react'
import { Loader2, CheckCircle2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile, type ProfileFormState } from './actions'
import type { Profile } from '@/types'

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

const initialState: ProfileFormState = {}

interface ProfileFormProps {
  profile: Profile
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, action, isPending] = useActionState(updateProfile, initialState)

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.success && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-subtle px-4 py-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Changes saved!
        </div>
      )}

      {state.errors?._form && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.errors._form[0]}
        </div>
      )}

      {/* Display name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={profile.display_name ?? ''}
          placeholder="Your name"
          aria-invalid={!!state.errors?.display_name}
        />
        {state.errors?.display_name && (
          <p className="text-xs text-destructive">{state.errors.display_name[0]}</p>
        )}
      </div>

      {/* Location row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            defaultValue={profile.city ?? ''}
            placeholder="e.g. Tallinn"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="state">State / Region</Label>
          <Input
            id="state"
            name="state"
            defaultValue={profile.state ?? ''}
            placeholder="e.g. Harju"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="zip_code">Zip / Postal code</Label>
          <Input
            id="zip_code"
            name="zip_code"
            defaultValue={profile.zip_code ?? ''}
            placeholder="e.g. 10111"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="country">Country</Label>
          <div className="relative">
            <select
              id="country"
              name="country"
              defaultValue={profile.country ?? ''}
              className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Not set</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Save changes'}
      </Button>
    </form>
  )
}
