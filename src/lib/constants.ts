export const CATEGORIES = [
  { slug: 'all', label: 'All Items', icon: 'LayoutGrid' },
  { slug: 'furniture', label: 'Furniture', icon: 'Sofa' },
  { slug: 'appliances', label: 'Appliances', icon: 'Plug' },
  { slug: 'decor-plants', label: 'Decor & Plants', icon: 'Flower2' },
  { slug: 'electronics', label: 'Electronics', icon: 'Monitor' },
  { slug: 'clothing', label: 'Clothing', icon: 'Shirt' },
  { slug: 'misc', label: 'Misc / Boxes', icon: 'Package' },
] as const

export type CategorySlug = (typeof CATEGORIES)[number]['slug']

// Featured categories shown as quick-filter pills on the homepage
export const FEATURED_PILL_SLUGS: CategorySlug[] = ['furniture', 'appliances', 'decor-plants']

export const LISTING_CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
] as const

export const ITEMS_PER_PAGE = 12
