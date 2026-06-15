type GeoCountryResponse = {
  country: string | null
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
type BrowserGeoProvider = {
  url: string
  parseCountry: (data: unknown) => string | null
}

const browserGeoProviders: BrowserGeoProvider[] = [
  {
    url: 'https://api.country.is/',
    parseCountry: (data) => normalizeCountry((data as { country?: string }).country),
  },
  {
    url: 'https://ipwho.is/',
    parseCountry: (data) => normalizeCountry((data as { country_code?: string }).country_code),
  },
  {
    url: 'https://ipapi.co/json/',
    parseCountry: (data) => normalizeCountry((data as { country_code?: string }).country_code),
  },
]

export async function getIpCountry() {
  const functionCountry = await getIpCountryFromFunction()
  if (functionCountry) return functionCountry

  return getIpCountryFromBrowser()
}

async function getIpCountryFromFunction() {
  if (!supabaseUrl) return null

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/geo-country`)

    if (!response.ok) return null

    const data = await response.json() as GeoCountryResponse
    return normalizeCountry(data.country)
  } catch {
    return null
  }
}

async function getIpCountryFromBrowser() {
  for (const provider of browserGeoProviders) {
    try {
      const response = await fetch(provider.url)
      if (!response.ok) continue

      const country = provider.parseCountry(await response.json())
      if (country) return country
    } catch {
      continue
    }
  }

  return null
}

function normalizeCountry(country: string | undefined | null) {
  const normalized = country?.trim().toUpperCase()
  return normalized && /^[A-Z]{2}$/.test(normalized) ? normalized : null
}
