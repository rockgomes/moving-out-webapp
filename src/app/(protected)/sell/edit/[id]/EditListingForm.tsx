'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/currency'
import { CATEGORIES, LISTING_CONDITIONS, LISTING_TAGS } from '@/lib/constants'
import type { Listing, ListingPhoto, Profile } from '@/types'
import { revalidateAfterEdit } from './actions'

interface EditListingFormProps {
  listing: Listing
  photos: ListingPhoto[]
  profile: Profile
}

interface FormState {
  title: string
  description: string
  price: string
  retail_price: string
  isFree: boolean
  condition: string
  category: string
  tags: string[]
}

interface ExistingPhoto {
  id: string
  storage_path: string
  display_order: number
  url: string
}

const MAX_PHOTOS = 4

export function EditListingForm({ listing, photos: initialPhotos, profile }: EditListingFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>(
    initialPhotos
      .slice()
      .sort((a, b) => a.display_order - b.display_order)
      .map((p) => ({
        ...p,
        url: `${supabaseUrl}/storage/v1/object/public/listing-photos/${p.storage_path}`,
      })),
  )
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])

  const [form, setForm] = useState<FormState>({
    title: listing.title,
    description: listing.description ?? '',
    price: listing.price === 0 ? '' : String(listing.price),
    retail_price: listing.retail_price != null ? String(listing.retail_price) : '',
    isFree: listing.price === 0,
    condition: listing.condition,
    category: listing.category,
    tags: listing.tags ?? [],
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | '_form', string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  async function removeExistingPhoto(photo: ExistingPhoto) {
    const supabase = createClient()
    await Promise.all([
      supabase.storage.from('listing-photos').remove([photo.storage_path]),
      supabase.from('listing_photos').delete().eq('id', photo.id),
    ])
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photo.id))
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const totalPhotos = existingPhotos.length + newPhotos.length
    const remaining = MAX_PHOTOS - totalPhotos
    const toAdd = files.slice(0, remaining)

    setNewPhotos((prev) => [...prev, ...toAdd])
    const previews = toAdd.map((f) => URL.createObjectURL(f))
    setNewPreviews((prev) => [...prev, ...previews])
    e.target.value = ''
  }

  function removeNewPhoto(index: number) {
    URL.revokeObjectURL(newPreviews[index])
    setNewPhotos((prev) => prev.filter((_, i) => i !== index))
    setNewPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  function validate(): boolean {
    const newErrors: typeof errors = {}
    if (!form.title.trim()) newErrors.title = 'Title is required'
    if (!form.condition) newErrors.condition = 'Select a condition'
    if (!form.category) newErrors.category = 'Select a category'
    if (!form.isFree && (!form.price || Number(form.price) < 0)) {
      newErrors.price = 'Enter a valid price'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // 1. Update listing row
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          title: form.title.trim(),
          description: form.description.trim() || null,
          price: form.isFree ? 0 : Number(form.price),
          retail_price: form.retail_price ? Number(form.retail_price) : null,
          condition: form.condition as 'new' | 'like_new' | 'good' | 'fair',
          category: form.category,
          tags: form.tags,
        })
        .eq('id', listing.id)

      if (updateError) {
        setErrors({ _form: 'Failed to update listing. Please try again.' })
        setIsSubmitting(false)
        return
      }

      // 2. Upload new photos
      const nextOrder = existingPhotos.length > 0
        ? Math.max(...existingPhotos.map((p) => p.display_order)) + 1
        : 0

      for (let i = 0; i < newPhotos.length; i++) {
        const file = newPhotos[i]
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${user.id}/${listing.id}/${Date.now()}-${i}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('listing-photos')
          .upload(path, file, { upsert: true })

        if (uploadError) continue

        await supabase.from('listing_photos').insert({
          listing_id: listing.id,
          storage_path: path,
          display_order: nextOrder + i,
        })
      }

      await revalidateAfterEdit(listing.id)
      router.push(`/listings/${listing.id}`)
    } catch {
      setErrors({ _form: 'Something went wrong. Please try again.' })
      setIsSubmitting(false)
    }
  }

  const totalPhotos = existingPhotos.length + newPhotos.length
  const previewPrice = form.isFree ? '0' : form.price || '0'

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

        {/* ── Left column ───────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-6">

          {/* Photos */}
          <div className="flex flex-col gap-2">
            <Label>Photos <span className="text-muted-foreground">(up to {MAX_PHOTOS})</span></Label>
            <div className="flex gap-3 flex-wrap">
              {/* Existing photos */}
              {existingPhotos.map((photo, i) => (
                <div
                  key={photo.id}
                  className={`relative overflow-hidden rounded-xl border bg-muted ${i === 0 && newPhotos.length === 0 ? 'h-[140px] w-[180px]' : 'h-[88px] w-[88px]'}`}
                >
                  <Image src={photo.url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="180px" />
                  <button
                    type="button"
                    onClick={() => removeExistingPhoto(photo)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* New photo previews */}
              {newPreviews.map((src, i) => (
                <div
                  key={src}
                  className="relative h-[88px] w-[88px] overflow-hidden rounded-xl border bg-muted"
                >
                  <Image src={src} alt={`New photo ${i + 1}`} fill className="object-cover" sizes="88px" />
                  <button
                    type="button"
                    onClick={() => removeNewPhoto(i)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Add photo slot */}
              {totalPhotos < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/40 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 ${totalPhotos === 0 ? 'h-[140px] w-[180px]' : 'h-[88px] w-[88px]'}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <ImagePlus className="h-6 w-6" />
                    {totalPhotos === 0 && <span className="text-xs">Add Photo</span>}
                  </div>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Item Title</Label>
            <Input
              id="title"
              placeholder="e.g. Modern Grey Sofa"
              value={form.title}
              onChange={(e) => handleField('title', e.target.value)}
              aria-invalid={!!errors.title}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe condition, dimensions, reason for selling…"
              rows={4}
              value={form.description}
              onChange={(e) => handleField('description', e.target.value)}
            />
          </div>

          {/* Category + Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => handleField('category', v)}>
                <SelectTrigger aria-invalid={!!errors.category}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c.slug !== 'all').map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => handleField('condition', v)}>
                <SelectTrigger aria-invalid={!!errors.condition}>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {LISTING_CONDITIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.condition && <p className="text-xs text-destructive">{errors.condition}</p>}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <Label>
              Tags
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                optional · up to 5
              </span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {LISTING_TAGS.map((tag) => {
                const isSelected = form.tags.includes(tag.slug)
                const atLimit = form.tags.length >= 5 && !isSelected
                return (
                  <button
                    key={tag.slug}
                    type="button"
                    disabled={atLimit}
                    onClick={() =>
                      handleField(
                        'tags',
                        isSelected
                          ? form.tags.filter((t) => t !== tag.slug)
                          : [...form.tags, tag.slug],
                      )
                    }
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : atLimit
                          ? 'cursor-not-allowed border-border bg-muted text-muted-foreground opacity-40'
                          : 'border-border bg-background text-foreground hover:bg-muted'
                    }`}
                  >
                    {tag.label}
                  </button>
                )
              })}
            </div>
          </div>

          {errors._form && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {errors._form}
            </p>
          )}

          {/* Footer actions (mobile) */}
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <Button type="button" variant="ghost" disabled={isSubmitting} onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* ── Right column ──────────────────────────────── */}
        <div className="flex w-full flex-col gap-5 lg:w-[300px] lg:shrink-0">

          {/* Pricing */}
          <div className="rounded-xl border bg-white p-5">
            <p className="mb-3 text-sm font-semibold">Pricing</p>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="price">Your asking price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="$0.00"
                  value={form.price}
                  onChange={(e) => handleField('price', e.target.value)}
                  disabled={form.isFree}
                  aria-invalid={!!errors.price}
                />
                {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="retail_price">
                  Original retail price ($)
                  <span className="ml-1 text-xs font-normal text-muted-foreground">optional</span>
                </Label>
                <Input
                  id="retail_price"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="$0.00"
                  value={form.retail_price}
                  onChange={(e) => handleField('retail_price', e.target.value)}
                  disabled={form.isFree}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={form.isFree}
                  onCheckedChange={(v) => {
                    handleField('isFree', !!v)
                    if (v) handleField('price', '0')
                  }}
                />
                List as free
              </label>
            </div>
          </div>

          {/* Price preview */}
          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price preview</p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-bold text-primary">
                {formatPrice(Number(previewPrice), profile.country)}
              </span>
              {form.retail_price && !form.isFree && (
                <span className="text-sm text-muted-foreground">
                  {formatPrice(Number(form.retail_price), profile.country)} retail
                </span>
              )}
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden flex-col gap-2 lg:flex">
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={isSubmitting}
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
