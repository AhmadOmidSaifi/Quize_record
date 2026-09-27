import { api } from './client'

export interface LoginResponse {
  access: string
  refresh: string
}

export interface RegisterPayload {
  username: string
  email?: string
  password: string
  role?: 'admin' | 'teacher' | 'participant'
}

export const login = (username: string, password: string) =>
  api.post<LoginResponse>('/api/auth/login/', { username, password })

export const register = (payload: RegisterPayload) =>
  api.post('/api/auth/register/', payload)
