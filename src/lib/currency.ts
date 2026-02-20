const COUNTRY_CURRENCY: Record<string, { code: string; symbol: string }> = {
  US: { code: 'USD', symbol: '$' },
  CA: { code: 'CAD', symbol: 'CA$' },
  GB: { code: 'GBP', symbol: '£' },
  AU: { code: 'AUD', symbol: 'A$' },
  NZ: { code: 'NZD', symbol: 'NZ$' },
  // Eurozone
  EE: { code: 'EUR', symbol: '€' },
  DE: { code: 'EUR', symbol: '€' },
  FR: { code: 'EUR', symbol: '€' },
  ES: { code: 'EUR', symbol: '€' },
  IT: { code: 'EUR', symbol: '€' },
  NL: { code: 'EUR', symbol: '€' },
  PT: { code: 'EUR', symbol: '€' },
  BE: { code: 'EUR', symbol: '€' },
  AT: { code: 'EUR', symbol: '€' },
  FI: { code: 'EUR', symbol: '€' },
  IE: { code: 'EUR', symbol: '€' },
  LV: { code: 'EUR', symbol: '€' },
  LT: { code: 'EUR', symbol: '€' },
  // Non-euro Europe
  CH: { code: 'CHF', symbol: 'CHF' },
  SE: { code: 'SEK', symbol: 'kr' },
  NO: { code: 'NOK', symbol: 'kr' },
  DK: { code: 'DKK', symbol: 'kr' },
  PL: { code: 'PLN', symbol: 'zł' },
  // Rest of world
  BR: { code: 'BRL', symbol: 'R$' },
  MX: { code: 'MXN', symbol: 'MX$' },
  IN: { code: 'INR', symbol: '₹' },
  JP: { code: 'JPY', symbol: '¥' },
  CN: { code: 'CNY', symbol: '¥' },
  KR: { code: 'KRW', symbol: '₩' },
  SG: { code: 'SGD', symbol: 'S$' },
  AE: { code: 'AED', symbol: 'AED' },
  ZA: { code: 'ZAR', symbol: 'R' },
}

export function currencyForCountry(country: string | null | undefined) {
  return COUNTRY_CURRENCY[country ?? ''] ?? { code: 'USD', symbol: '$' }
}

export function formatPrice(price: number, country: string | null | undefined): string {
  if (price === 0) return 'Free'
  const { symbol } = currencyForCountry(country)
  return `${symbol}${price.toFixed(0)}`
}
