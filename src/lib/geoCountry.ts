type GeoCountryResponse = {
  country: string | null
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined

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
    return data.country?.toUpperCase() ?? null
  } catch {
    return null
  }
}

async function getIpCountryFromBrowser() {
  try {
    const response = await fetch('https://ipapi.co/json/')
    if (!response.ok) return null

    const data = await response.json() as { country_code?: string }
    return data.country_code?.toUpperCase() ?? null
  } catch {
    return null
  }
}
