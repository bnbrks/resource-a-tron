const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token')
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  patch: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
}


