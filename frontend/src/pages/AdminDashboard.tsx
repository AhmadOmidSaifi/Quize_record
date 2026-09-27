import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createCompetition, listCompetitions } from '../api/competitions'
import { Competition } from '../api/types'
import StatusPill, { statusToTone } from '../components/StatusPill'
import Button from '../components/Button'

export default function AdminDashboard() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const data = await listCompetitions()
      setCompetitions(data)
    } catch {
      setError('Could not load your competitions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setCreating(true)
    setError(null)
    try {
      const comp = await createCompetition({ title: title.trim(), description: description.trim() })
      navigate(`/host/${comp.id}`)
    } catch {
      setError('Could not create the competition. Try again.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ice-dim">Host console</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ice">Your competitions</h1>
        </div>
        <Button onClick={() => setShowCreate((s) => !s)}>
          {showCreate ? 'Cancel' : 'New competition'}
        </Button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-8 animate-rise space-y-4 rounded-2xl border border-ink-line bg-ink-panel p-6 shadow-panel">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ice-dim">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Friday Trivia Showdown"
              required
              autoFocus
              className="w-full rounded-lg border border-ink-line bg-ink px-3.5 py-2.5 text-sm text-ice outline-none transition-colors focus:border-signal/60"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ice-dim">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-ink-line bg-ink px-3.5 py-2.5 text-sm text-ice outline-none transition-colors focus:border-signal/60"
            />
          </div>
          <Button type="submit" loading={creating}>Create &amp; open builder</Button>
        </form>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">{error}</div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-ice-dim">Loading…</div>
      ) : competitions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-line px-6 py-16 text-center">
          <p className="text-sm text-ice-dim">No competitions yet. Create one to get a room code teams can join.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {competitions.map((c) => (
            <li key={c.id}>
              <Link
                to={`/host/${c.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-line bg-ink-panel px-5 py-4 shadow-panel transition-colors hover:border-signal/40"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-display text-base font-semibold text-ice">{c.title}</span>
                    <StatusPill label={c.status} tone={statusToTone(c.status)} pulse={c.status === 'running'} />
                  </div>
                  <div className="mt-1 font-mono text-xs tracking-[0.15em] text-ice-dim">{c.code}</div>
                </div>
                <span className="text-sm text-ice-dim">Open builder →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
