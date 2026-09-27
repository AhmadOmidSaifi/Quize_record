export const BACKEND_API = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '')

export const getWsUrl = (code: string) => {
  // Allow Vite env override: VITE_WS_URL like ws://localhost:8000
  const base = import.meta.env.VITE_WS_URL || ''
  if (base) return `${base.replace(/\/$/, '')}/ws/competitions/${code}/`
  const host = window.location.hostname
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const port = import.meta.env.VITE_BACKEND_PORT || '8000'
  return `${protocol}://${host}:${port}/ws/competitions/${code}/`
}

const ACCESS_KEY = 'arena_access_token'
const REFRESH_KEY = 'arena_refresh_token'

export const tokenStore = {
  get access() { return localStorage.getItem(ACCESS_KEY) },
  get refresh() { return localStorage.getItem(REFRESH_KEY) },
  set(access: string, refresh?: string) {
    localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

export class ApiError extends Error {
  status: number
  detail: any
  constructor(status: number, detail: any) {
    super(typeof detail === 'string' ? detail : detail?.detail || 'Request failed')
    this.status = status
    this.detail = detail
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: any
  auth?: boolean
}

let refreshInFlight: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (!tokenStore.refresh) return false
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${BACKEND_API}/api/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: tokenStore.refresh }),
    })
      .then(async (res) => {
        if (!res.ok) return false
        const data = await res.json()
        if (!data.access) return false
        tokenStore.set(data.access)
        return true
      })
      .catch(() => false)
      .finally(() => { refreshInFlight = null })
  }
  return refreshInFlight
}

async function doFetch(path: string, method: string, headers: Record<string, string>, body: any) {
  const res = await fetch(`${BACKEND_API}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let data: any = null
  const text = await res.text()
  if (text) {
    try { data = JSON.parse(text) } catch { data = text }
  }
  return { res, data }
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false } = opts
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && tokenStore.access) headers['Authorization'] = `Bearer ${tokenStore.access}`

  let { res, data } = await doFetch(path, method, headers, body)

  if (res.status === 401 && auth && path !== '/api/auth/refresh/') {
    const refreshed = await tryRefresh()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${tokenStore.access}`
      ;({ res, data } = await doFetch(path, method, headers, body))
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, data)
  }
  return data as T
}

export const api = {
  get: <T,>(path: string, auth = false) => request<T>(path, { method: 'GET', auth }),
  post: <T,>(path: string, body?: any, auth = false) => request<T>(path, { method: 'POST', body, auth }),
  patch: <T,>(path: string, body?: any, auth = false) => request<T>(path, { method: 'PATCH', body, auth }),
  del: <T,>(path: string, auth = false) => request<T>(path, { method: 'DELETE', auth }),
}
