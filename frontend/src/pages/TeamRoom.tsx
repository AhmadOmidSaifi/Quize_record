import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useCompetitionSocket from '../hooks/useWebSocket'
import useCountdown from '../hooks/useCountdown'
import { getCurrentQuestion, getLeaderboard, joinCompetition, submitAnswer } from '../api/competitions'
import { loadTeamSession, saveTeamSession, TeamSession } from '../api/session'
import { ApiError } from '../api/client'
import { LeaderboardRow, PublicCurrentQuestion } from '../api/types'
import Timer from '../components/Timer'
import Leaderboard from '../components/Leaderboard'
import StatusPill, { statusToTone } from '../components/StatusPill'
import Button from '../components/Button'

const STATUS_COPY: Record<string, string> = {
  draft: 'The host is still setting up this competition.',
  waiting: 'Waiting for the host to start the first question.',
  paused: 'The host has paused the game.',
  running: 'Get ready — a question is coming up.',
}

export default function TeamRoom() {
  const { code = '' } = useParams()
  const navigate = useNavigate()

  const [session, setSession] = useState<TeamSession | null>(() => loadTeamSession(code))
  const [rejoinName, setRejoinName] = useState('')
  const [rejoinError, setRejoinError] = useState<string | null>(null)
  const [rejoinLoading, setRejoinLoading] = useState(false)

  const [status, setStatus] = useState<string>('waiting')
  const [question, setQuestion] = useState<PublicCurrentQuestion | null>(null)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [feedback, setFeedback] = useState<{ correct: boolean; points: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [roster, setRoster] = useState<string[]>([])

  const knownQuestionIdRef = useRef<number | null>(null)

  const secondsLeft = useCountdown(startedAt, question?.time_limit_seconds || 0)
  const timeExpired = !!question && secondsLeft <= 0

  const addRosterName = useCallback((name: string) => {
    setRoster((prev) => (prev.includes(name) ? prev : [...prev, name]))
  }, [])

  const refreshSnapshot = useCallback(async () => {
    if (!session) return
    try {
      const snap = await getCurrentQuestion(session.competitionId)
      setStatus(snap.status)
      setStartedAt(snap.current_question_started_at)
      const next = snap.current_question
      if (next?.id !== knownQuestionIdRef.current) {
        knownQuestionIdRef.current = next?.id ?? null
        setSelected(null)
        setLocked(false)
        setFeedback(null)
        setSubmitError(null)
      }
      setQuestion(next)
    } catch {
      // transient network hiccup — the next websocket nudge or poll will retry
    }
  }, [session])

  const refreshLeaderboard = useCallback(async () => {
    if (!session) return
    try {
      const rows = await getLeaderboard(session.competitionId)
      setLeaderboard(rows)
      rows.forEach((r) => addRosterName(r.team_name))
    } catch {
      // ignore
    }
  }, [session, addRosterName])

  useEffect(() => {
    if (!session) return
    refreshSnapshot()
    refreshLeaderboard()
  }, [session, refreshSnapshot, refreshLeaderboard])

  const handleSocketMessage = useCallback((msg: any) => {
    switch (msg.type) {
      case 'competition_connected':
        if (msg.status) setStatus(msg.status)
        refreshSnapshot()
        break
      case 'team_joined':
        if (msg.team_name) addRosterName(msg.team_name)
        break
      case 'question_started':
        refreshSnapshot()
        break
      case 'competition_paused':
        setStatus('paused')
        break
      case 'competition_resumed':
        setStatus('running')
        refreshSnapshot()
        break
      case 'competition_finished':
        setStatus('finished')
        refreshLeaderboard()
        break
      case 'leaderboard_updated':
        if (msg.leaderboard) setLeaderboard(msg.leaderboard)
        break
      case 'score_updated':
        if (msg.leaderboard) setLeaderboard(msg.leaderboard)
        break
      default:
        break
    }
  }, [refreshSnapshot, refreshLeaderboard, addRosterName])

  const { connected } = useCompetitionSocket(code || null, handleSocketMessage)

  const handleRejoin = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = rejoinName.trim()
    if (!name) return
    setRejoinLoading(true)
    setRejoinError(null)
    try {
      const { competition, team } = await joinCompetition(code, name)
      const newSession: TeamSession = {
        competitionId: competition.id,
        competitionTitle: competition.title,
        teamId: team.id,
        teamName: team.name,
      }
      saveTeamSession(code, newSession)
      setSession(newSession)
      navigate(`/room/${code}/${team.id}`, { replace: true })
    } catch {
      setRejoinError('Could not rejoin. Double-check the room code and team name.')
    } finally {
      setRejoinLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!session || !question || selected == null) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await submitAnswer(session.competitionId, session.teamId, selected)
      setFeedback({ correct: res.is_correct, points: res.points })
      setLocked(true)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSubmitError('You already answered this one.')
        setLocked(true)
      } else if (err instanceof ApiError && err.status === 400) {
        setSubmitError('Time expired before this was submitted.')
        setLocked(true)
      } else {
        setSubmitError('Could not submit your answer — try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!session) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-16">
        <p className="text-sm font-medium text-ice-dim">Room {code}</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ice">Rejoin this room</h1>
        <p className="mt-2 text-sm text-ice-dim">
          We don't have a saved seat for you on this device. Enter the team name you joined with.
        </p>
        <form onSubmit={handleRejoin} className="mt-6 space-y-4 rounded-2xl border border-ink-line bg-ink-panel p-6 shadow-panel">
          {rejoinError && (
            <div className="rounded-lg border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">{rejoinError}</div>
          )}
          <input
            value={rejoinName}
            onChange={(e) => setRejoinName(e.target.value)}
            placeholder="Team name"
            required
            autoFocus
            className="w-full rounded-lg border border-ink-line bg-ink px-3.5 py-2.5 text-sm text-ice outline-none transition-colors focus:border-signal/60"
          />
          <Button type="submit" loading={rejoinLoading} className="w-full">Rejoin</Button>
        </form>
      </div>
    )
  }

  const ownRow = leaderboard.find((r) => r.team_id === session.teamId)
  const showLobby = status !== 'finished' && !question
  const showQuestion = status !== 'finished' && !!question

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ice-dim">{session.competitionTitle}</p>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-ice">{session.teamName}</h1>
            <StatusPill label={status} tone={statusToTone(status)} pulse={status === 'running'} />
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <div className="text-xs text-ice-dim">Your score</div>
            <div className="font-mono tabular text-xl font-semibold text-signal">{ownRow?.total_points ?? 0}</div>
          </div>
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-teal' : 'bg-coral'}`} title={connected ? 'connected' : 'reconnecting'} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-ink-line bg-ink-panel p-6 shadow-panel sm:p-8">
          {status === 'finished' && (
            <div className="animate-popIn py-10 text-center">
              <div className="text-4xl">🏁</div>
              <h2 className="mt-4 font-display text-2xl font-semibold text-ice">That's the game</h2>
              <p className="mt-2 text-sm text-ice-dim">
                {ownRow ? `You finished with ${ownRow.total_points} points.` : 'Thanks for playing.'}
              </p>
            </div>
          )}

          {showLobby && status !== 'finished' && (
            <div className="py-10 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-signal/30 bg-signal/10">
                <span className="h-2.5 w-2.5 animate-pulseRing rounded-full bg-signal" />
              </div>
              <h2 className="font-display text-xl font-semibold text-ice">
                {STATUS_COPY[status] || 'Waiting for the host…'}
              </h2>
              <p className="mt-2 text-sm text-ice-dim">Keep this tab open — questions appear here the moment they go live.</p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-ink-line px-4 py-1.5 font-mono text-sm tracking-[0.2em] text-ice-dim">
                {code}
              </div>
            </div>
          )}

          {showQuestion && question && (
            <div key={question.id} className="animate-rise">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ice-dim">
                    Question {question.order + 1} · {question.points} pts
                  </p>
                  <h2 className="mt-1.5 font-display text-xl font-semibold leading-snug text-ice sm:text-2xl">
                    {question.question.text}
                  </h2>
                </div>
                <Timer secondsLeft={secondsLeft} totalSeconds={question.time_limit_seconds} />
              </div>

              {question.question.image_url && (
                <img
                  src={question.question.image_url}
                  alt=""
                  className="mb-6 max-h-60 w-full rounded-xl border border-ink-line object-cover"
                />
              )}

              <div className={`grid gap-3 ${question.question.question_type === 'true_false' ? 'grid-cols-2' : 'sm:grid-cols-2'}`}>
                {question.question.options.map((opt) => {
                  const isSelected = selected === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={locked || timeExpired}
                      onClick={() => setSelected(opt.id)}
                      className={`rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                        isSelected
                          ? 'border-signal/60 bg-signal/10 text-ice'
                          : 'border-ink-line bg-ink text-ice-dim hover:border-ink-line/80 hover:text-ice'
                      } ${locked && !isSelected ? 'opacity-40' : ''}`}
                    >
                      {opt.text}
                    </button>
                  )
                })}
              </div>

              {submitError && (
                <div className="mt-4 rounded-lg border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">
                  {submitError}
                </div>
              )}

              {feedback && (
                <div className={`mt-4 animate-popIn rounded-lg border px-4 py-3 text-sm font-semibold ${
                  feedback.correct ? 'border-teal/40 bg-teal/10 text-teal' : 'border-coral/40 bg-coral/10 text-coral'
                }`}>
                  {feedback.correct ? `Correct — +${feedback.points} points` : 'Not quite — 0 points'}
                </div>
              )}

              {!locked && timeExpired && !feedback && (
                <div className="mt-4 rounded-lg border border-ink-line bg-ink px-4 py-3 text-sm text-ice-dim">
                  Time's up for this one — hang tight for the next question.
                </div>
              )}

              {!locked && !timeExpired && (
                <Button
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={selected == null}
                  size="lg"
                  className="mt-6 w-full sm:w-auto"
                >
                  Lock in answer
                </Button>
              )}

              {locked && !feedback && (
                <p className="mt-4 text-sm text-ice-dim">Waiting for the next question…</p>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-ink-line bg-ink-panel p-5 shadow-panel">
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-ice-dim">Leaderboard</h3>
            <Leaderboard rows={leaderboard} highlightTeamId={session.teamId} />
          </div>

          {showLobby && (
            <div className="rounded-2xl border border-ink-line bg-ink-panel p-5 shadow-panel">
              <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-ice-dim">
                Teams in the room ({roster.length})
              </h3>
              {roster.length === 0 ? (
                <p className="text-sm text-ice-dim">You're the first one here.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {roster.map((name) => (
                    <li key={name} className="rounded-full border border-ink-line bg-ink px-3 py-1 text-xs text-ice-dim">
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
