const COUNTRY_CURRENCY: Record<string, { code: string; symbol: string }> = {
  US: { code: 'USD', symbol: '$' },
  CA: { code: 'CAD', symbol: 'CA$' },
  GB: { code: 'GBP', symbol: '£' },
  AU: { code: 'AUD', symbol: 'A$' },
  NZ: { code: 'NZD', symbol: 'NZ$' },
  DE: { code: 'EUR', symbol: '€' },
  FR: { code: 'EUR', symbol: '€' },
  ES: { code: 'EUR', symbol: '€' },
  IT: { code: 'EUR', symbol: '€' },
  NL: { code: 'EUR', symbol: '€' },
  PT: { code: 'EUR', symbol: '€' },
  BE: { code: 'EUR', symbol: '€' },
  AT: { code: 'EUR', symbol: '€' },
  CH: { code: 'CHF', symbol: 'CHF' },
  BR: { code: 'BRL', symbol: 'R$' },
  MX: { code: 'MXN', symbol: 'MX$' },
  IN: { code: 'INR', symbol: '₹' },
  JP: { code: 'JPY', symbol: '¥' },
  CN: { code: 'CNY', symbol: '¥' },
  SG: { code: 'SGD', symbol: 'S$' },
  AE: { code: 'AED', symbol: 'AED' },
}

export function currencyForCountry(country: string | null | undefined) {
  return COUNTRY_CURRENCY[country ?? ''] ?? { code: 'USD', symbol: '$' }
}

export function formatPrice(price: number, country: string | null | undefined): string {
  if (price === 0) return 'Free'
  const { symbol } = currencyForCountry(country)
  return `${symbol}${price.toFixed(0)}`
}
