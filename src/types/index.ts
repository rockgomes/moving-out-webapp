// Re-export database types
export type {
  Profile,
  Listing,
  ListingPhoto,
  MovingSale,
  Conversation,
  Message,
  SavedListing,
  ListingCondition,
  ListingStatus,
} from './database'

// Enriched types (joins)
export type ListingWithPhotos = import('./database').Listing & {
  listing_photos: import('./database').ListingPhoto[]
}

export type ListingWithSeller = import('./database').Listing & {
  profiles: import('./database').Profile
  listing_photos: import('./database').ListingPhoto[]
}

export type ConversationWithDetails = import('./database').Conversation & {
  listings: import('./database').Listing & {
    listing_photos: import('./database').ListingPhoto[]
  }
  buyer: import('./database').Profile
  seller: import('./database').Profile
  last_message?: import('./database').Message
  unread_count?: number
}
