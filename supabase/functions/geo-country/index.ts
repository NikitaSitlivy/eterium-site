const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
}

function getRequestIp(req: Request) {
  const headers = [
    'cf-connecting-ip',
    'true-client-ip',
    'fastly-client-ip',
    'x-client-ip',
    'x-real-ip',
    'x-forwarded-for',
  ]

  for (const header of headers) {
    const value = req.headers.get(header)
    if (!value) continue
    return value.split(',')[0]?.trim() || null
  }

  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const cloudflareCountry = req.headers.get('cf-ipcountry')
  if (cloudflareCountry && cloudflareCountry !== 'XX') {
    return json({ country: cloudflareCountry.toUpperCase() })
  }

  const ip = getRequestIp(req)
  if (!ip) {
    return json({ country: null })
  }

  try {
    const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`)
    if (!geoResponse.ok) {
      return json({ country: null })
    }

    const geo = await geoResponse.json() as { country_code?: string }
    return json({ country: geo.country_code?.toUpperCase() ?? null })
  } catch {
    return json({ country: null })
  }
})
