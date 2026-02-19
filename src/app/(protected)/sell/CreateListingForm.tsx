'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, X, Loader2, Package } from 'lucide-react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, LISTING_CONDITIONS } from '@/lib/constants'
import type { Profile } from '@/types'

interface CreateListingFormProps {
  profile: Profile
}

interface FormState {
  title: string
  description: string
  price: string
  isFree: boolean
  isNegotiable: boolean
  condition: string
  category: string
}

const MAX_PHOTOS = 4

export function CreateListingForm({ profile }: CreateListingFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    price: '',
    isFree: false,
    isNegotiable: false,
    condition: '',
    category: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'photos' | '_form', string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const remaining = MAX_PHOTOS - photos.length
    const toAdd = files.slice(0, remaining)

    setPhotos((prev) => [...prev, ...toAdd])
    const previews = toAdd.map((f) => URL.createObjectURL(f))
    setPhotoPreviews((prev) => [...prev, ...previews])
    // reset input so the same file can be re-selected
    e.target.value = ''
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photoPreviews[index])
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
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

      // 1. Insert listing
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          seller_id: user.id,
          title: form.title.trim(),
          description: form.description.trim() || null,
          price: form.isFree ? 0 : Number(form.price),
          condition: form.condition as 'new' | 'like_new' | 'good' | 'fair',
          category: form.category,
          status: 'active',
          city: profile.city,
          state: profile.state,
          zip_code: profile.zip_code,
        })
        .select('id')
        .single()

      if (listingError || !listing) {
        setErrors({ _form: 'Failed to create listing. Please try again.' })
        setIsSubmitting(false)
        return
      }

      // 2. Upload photos
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i]
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${user.id}/${listing.id}/${i}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('listing-photos')
          .upload(path, file, { upsert: true })

        if (uploadError) continue // skip failed uploads, don't block

        await supabase.from('listing_photos').insert({
          listing_id: listing.id,
          storage_path: path,
          display_order: i,
        })
      }

      router.push(`/listings/${listing.id}`)
    } catch {
      setErrors({ _form: 'Something went wrong. Please try again.' })
      setIsSubmitting(false)
    }
  }

  const previewPrice = form.isFree ? '0' : form.price || '0'
  const sellerInitials = profile.display_name
    ?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

        {/* ── Left column ───────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-6">

          {/* Photos */}
          <div className="flex flex-col gap-2">
            <Label>Photos <span className="text-muted-foreground">(up to {MAX_PHOTOS})</span></Label>
            <div className="flex gap-3 flex-wrap">
              {/* Existing previews */}
              {photoPreviews.map((src, i) => (
                <div
                  key={src}
                  className={`relative overflow-hidden rounded-xl border bg-muted ${i === 0 ? 'h-[140px] w-[180px]' : 'h-[88px] w-[88px]'}`}
                >
                  <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="180px" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Add photo slot */}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/40 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 ${photos.length === 0 ? 'h-[140px] w-[180px]' : 'h-[88px] w-[88px]'}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <ImagePlus className="h-6 w-6" />
                    {photos.length === 0 && <span className="text-xs">Add Item Photo</span>}
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
              <Select
                value={form.category}
                onValueChange={(v) => handleField('category', v)}
              >
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
              <Select
                value={form.condition}
                onValueChange={(v) => handleField('condition', v)}
              >
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

          {errors._form && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {errors._form}
            </p>
          )}

          {/* Footer actions (mobile) */}
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <Button type="button" variant="ghost" disabled={isSubmitting}>
              Save as Draft
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing…</> : 'Publish Listing'}
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
                <Label htmlFor="price">Price ($)</Label>
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
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={form.isNegotiable}
                  onCheckedChange={(v) => handleField('isNegotiable', !!v)}
                />
                Price is negotiable
              </label>
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-xl border bg-white p-5">
            <p className="mb-3 text-sm font-semibold">Preview</p>
            <div className="overflow-hidden rounded-xl border shadow-sm">
              {/* Photo */}
              <div className="relative h-[130px] w-full bg-muted">
                {photoPreviews[0] ? (
                  <Image src={photoPreviews[0]} alt="Preview" fill className="object-cover" sizes="280px" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                )}
              </div>
              {/* Body */}
              <div className="flex flex-col gap-2 p-3">
                <div className="flex items-center justify-between">
                  <p className="line-clamp-1 text-sm font-semibold text-foreground">
                    {form.title || 'Your Item Title'}
                  </p>
                  <span className="text-sm font-bold text-primary">
                    ${Number(previewPrice).toFixed(0)}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {form.description || 'Your description will appear here…'}
                </p>
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={profile.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[9px]">{sellerInitials ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="text-[11px] text-muted-foreground">{profile.display_name ?? 'You'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop submit */}
          <div className="hidden flex-col gap-2 lg:flex">
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing…</>
                : 'Publish Listing'}
            </Button>
            <Button type="button" variant="ghost" className="w-full" disabled={isSubmitting}>
              Save as Draft
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
