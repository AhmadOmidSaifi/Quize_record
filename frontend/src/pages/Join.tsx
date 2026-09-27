import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { joinCompetition } from '../api/competitions'
import { saveTeamSession } from '../api/session'
import { ApiError } from '../api/client'
import Button from '../components/Button'

export default function JoinPage() {
  const [params] = useSearchParams()
  const [code, setCode] = useState(params.get('code') || '')
  const [team, setTeam] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedCode = code.trim().toUpperCase()
    const trimmedTeam = team.trim()
    if (!trimmedCode || !trimmedTeam) return

    setLoading(true)
    setError(null)
    try {
      const { competition, team: joinedTeam } = await joinCompetition(trimmedCode, trimmedTeam)
      saveTeamSession(competition.code, {
        competitionId: competition.id,
        competitionTitle: competition.title,
        teamId: joinedTeam.id,
        teamName: joinedTeam.name,
      })
      navigate(`/room/${competition.code}/${joinedTeam.id}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("We couldn't find a competition with that code.")
      } else {
        setError('Something went wrong joining that game. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium text-ice-dim">Team entry</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ice">Join a competition</h1>
      <p className="mt-2 text-sm text-ice-dim">Ask your host for the room code, then pick a team name.</p>

      <form onSubmit={handleJoin} className="mt-8 space-y-4 rounded-2xl border border-ink-line bg-ink-panel p-6 shadow-panel">
        {error && (
          <div className="rounded-lg border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">
            {error}
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ice-dim">Room code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. F83KQ2LM"
            required
            autoFocus
            className="w-full rounded-lg border border-ink-line bg-ink px-3.5 py-3 text-center font-mono text-lg tracking-[0.2em] text-ice outline-none transition-colors focus:border-signal/60"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ice-dim">Team name</label>
          <input
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            placeholder="e.g. Nebula Nine"
            required
            maxLength={150}
            className="w-full rounded-lg border border-ink-line bg-ink px-3.5 py-2.5 text-sm text-ice outline-none transition-colors focus:border-signal/60"
          />
        </div>
        <Button type="submit" loading={loading} className="w-full" size="lg">Enter the room</Button>
      </form>
    </div>
  )
}
