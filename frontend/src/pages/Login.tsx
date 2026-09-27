import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error, clearError } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(username, password)
      navigate('/host')
    } catch {
      // error already surfaced via context
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium text-ice-dim">Host access</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ice">Sign in</h1>
      <p className="mt-2 text-sm text-ice-dim">Run competitions, build question sets, and control the live game.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-ink-line bg-ink-panel p-6 shadow-panel">
        {error && (
          <div className="rounded-lg border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">
            {error}
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ice-dim">Username</label>
          <input
            value={username}
            onChange={(e) => { setUsername(e.target.value); clearError() }}
            required
            autoFocus
            className="w-full rounded-lg border border-ink-line bg-ink px-3.5 py-2.5 text-sm text-ice outline-none transition-colors focus:border-signal/60"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ice-dim">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError() }}
            required
            className="w-full rounded-lg border border-ink-line bg-ink px-3.5 py-2.5 text-sm text-ice outline-none transition-colors focus:border-signal/60"
          />
        </div>
        <Button type="submit" loading={loading} className="w-full">Sign in</Button>
      </form>

      <p className="mt-5 text-center text-sm text-ice-dim">
        New host? <Link to="/register" className="font-medium text-signal hover:underline">Create an account</Link>
      </p>
    </div>
  )
}
