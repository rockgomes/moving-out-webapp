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

// Type-based groups used as quick-filter pills on the homepage.
// Each group maps to one or more room-based category slugs.
export const ITEM_GROUPS = [
  { slug: 'furniture', label: 'Furniture', categories: ['living-room', 'bedroom'] as CategorySlug[] },
  { slug: 'appliances', label: 'Appliances', categories: ['kitchen', 'bathroom'] as CategorySlug[] },
  { slug: 'decor-plants', label: 'Decor & Plants', categories: ['misc'] as CategorySlug[] },
] as const

export type ItemGroupSlug = (typeof ITEM_GROUPS)[number]['slug']

export const LISTING_CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
] as const

export const ITEMS_PER_PAGE = 12
