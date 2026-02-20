export const CATEGORIES = [
  { slug: 'all', label: 'All Items', icon: 'LayoutGrid' },
  { slug: 'living-room', label: 'Living Room', icon: 'Sofa' },
  { slug: 'bedroom', label: 'Bedroom', icon: 'BedDouble' },
  { slug: 'kitchen', label: 'Kitchen', icon: 'UtensilsCrossed' },
  { slug: 'bathroom', label: 'Bathroom', icon: 'Bath' },
  { slug: 'office', label: 'Office', icon: 'Monitor' },
  { slug: 'misc', label: 'Misc / Boxes', icon: 'Package' },
] as const

export type CategorySlug = (typeof CATEGORIES)[number]['slug']

// Predefined tags sellers can apply to listings.
// Pills on listing grids are derived from the tags actually present in the data.
export const LISTING_TAGS = [
  { slug: 'furniture',   label: 'Furniture' },
  { slug: 'appliances',  label: 'Appliances' },
  { slug: 'electronics', label: 'Electronics' },
  { slug: 'clothing',    label: 'Clothing' },
  { slug: 'books',       label: 'Books & Media' },
  { slug: 'plants',      label: 'Plants & Garden' },
  { slug: 'baby-kids',   label: 'Baby & Kids' },
  { slug: 'sports',      label: 'Sports & Fitness' },
  { slug: 'tools',       label: 'Tools & DIY' },
  { slug: 'decor',       label: 'Decor & Art' },
  { slug: 'vintage',     label: 'Vintage' },
  { slug: 'toys',        label: 'Toys & Games' },
] as const

export type ListingTagSlug = (typeof LISTING_TAGS)[number]['slug']

export const LISTING_CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
] as const

export const ITEMS_PER_PAGE = 12
