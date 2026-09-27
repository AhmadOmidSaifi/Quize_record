import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'teacher' | 'admin'>('teacher')
  const { register, loading, error, clearError } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register({ username, email, password, role })
      navigate('/host')
    } catch {
      // error already surfaced via context
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium text-ice-dim">Host access</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ice">Create an account</h1>
      <p className="mt-2 text-sm text-ice-dim">Set up competitions and question banks in minutes.</p>

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
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ice-dim">Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            minLength={6}
            className="w-full rounded-lg border border-ink-line bg-ink px-3.5 py-2.5 text-sm text-ice outline-none transition-colors focus:border-signal/60"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ice-dim">Role</label>
          <div className="grid grid-cols-2 gap-2">
            {(['teacher', 'admin'] as const).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition-colors ${
                  role === r ? 'border-signal/60 bg-signal/10 text-signal' : 'border-ink-line text-ice-dim hover:text-ice'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" loading={loading} className="w-full">Create account</Button>
      </form>

      <p className="mt-5 text-center text-sm text-ice-dim">
        Already have an account? <Link to="/login" className="font-medium text-signal hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
