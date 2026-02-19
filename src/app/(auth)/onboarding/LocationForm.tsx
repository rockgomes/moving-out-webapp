'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveLocation, type LocationFormState } from './actions'

const initialState: LocationFormState = {}

export function LocationForm() {
  const [state, action, isPending] = useActionState(saveLocation, initialState)

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.errors?._form && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.errors._form[0]}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          name="city"
          placeholder="San Francisco"
          autoComplete="address-level2"
          aria-describedby={state.errors?.city ? 'city-error' : undefined}
          aria-invalid={!!state.errors?.city}
        />
        {state.errors?.city && (
          <p id="city-error" className="text-xs text-destructive">
            {state.errors.city[0]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            placeholder="CA"
            maxLength={2}
            className="uppercase"
            autoComplete="address-level1"
            aria-describedby={state.errors?.state ? 'state-error' : undefined}
            aria-invalid={!!state.errors?.state}
          />
          {state.errors?.state && (
            <p id="state-error" className="text-xs text-destructive">
              {state.errors.state[0]}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="zip_code">ZIP Code</Label>
          <Input
            id="zip_code"
            name="zip_code"
            placeholder="94105"
            maxLength={5}
            inputMode="numeric"
            autoComplete="postal-code"
            aria-describedby={state.errors?.zip_code ? 'zip-error' : undefined}
            aria-invalid={!!state.errors?.zip_code}
          />
          {state.errors?.zip_code && (
            <p id="zip-error" className="text-xs text-destructive">
              {state.errors.zip_code[0]}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" size="lg" className="mt-2 w-full" disabled={isPending}>
        {isPending ? 'Saving…' : 'Find items near me'}
      </Button>
    </form>
  )
}
