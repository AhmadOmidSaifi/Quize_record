import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  addCompetitionQuestion,
  controlCompetition,
  getCompetition,
  getLeaderboard,
  listCompetitionQuestions,
  NewQuestionPayload,
} from '../api/competitions'
import { Competition, CompetitionQuestion, LeaderboardRow } from '../api/types'
import useCompetitionSocket from '../hooks/useWebSocket'
import StatusPill, { statusToTone } from '../components/StatusPill'
import Leaderboard from '../components/Leaderboard'
import Button from '../components/Button'

type OptionDraft = { text: string; is_correct: boolean }

const BLANK_MCQ_OPTIONS = (): OptionDraft[] => [
  { text: '', is_correct: true },
  { text: '', is_correct: false },
  { text: '', is_correct: false },
  { text: '', is_correct: false },
]

const TRUE_FALSE_OPTIONS = (): OptionDraft[] => [
  { text: 'True', is_correct: true },
  { text: 'False', is_correct: false },
]

export default function CompetitionDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const [competition, setCompetition] = useState<Competition | null>(null)
  const [questions, setQuestions] = useState<CompetitionQuestion[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [activity, setActivity] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [controlling, setControlling] = useState<string | null>(null)
  const [copyLabel, setCopyLabel] = useState('Copy code')

  const [showBuilder, setShowBuilder] = useState(false)
  const [qType, setQType] = useState<'mcq' | 'true_false'>('mcq')
  const [qText, setQText] = useState('')
  const [qDifficulty, setQDifficulty] = useState(2)
  const [qPoints, setQPoints] = useState(100)
  const [qTimeLimit, setQTimeLimit] = useState(30)
  const [qOptions, setQOptions] = useState<OptionDraft[]>(BLANK_MCQ_OPTIONS())
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [builderError, setBuilderError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [comp, qs, lb] = await Promise.all([
        getCompetition(id),
        listCompetitionQuestions(id),
        getLeaderboard(id),
      ])
      setCompetition(comp)
      setQuestions(qs)
      setLeaderboard(lb)
    } catch {
      // handled below via competition == null state
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleSocketMessage = useCallback((msg: any) => {
    switch (msg.type) {
      case 'team_joined':
        setActivity((prev) => [`${msg.team_name} joined the room`, ...prev].slice(0, 12))
        getLeaderboard(id).then(setLeaderboard).catch(() => {})
        break
      case 'leaderboard_updated':
        if (msg.leaderboard) setLeaderboard(msg.leaderboard)
        break
      case 'score_updated':
        if (msg.leaderboard) setLeaderboard(msg.leaderboard)
        setActivity((prev) => [`${msg.team_name} scored +${msg.points}`, ...prev].slice(0, 12))
        break
      default:
        break
    }
  }, [id])

  const { connected } = useCompetitionSocket(competition?.code || null, handleSocketMessage)

  const runControl = async (action: 'start' | 'pause' | 'resume' | 'next_question' | 'finish') => {
    setControlling(action)
    try {
      await controlCompetition(id, action)
      const [comp, qs] = await Promise.all([getCompetition(id), listCompetitionQuestions(id)])
      setCompetition(comp)
      setQuestions(qs)
    } catch {
      setActivity((prev) => [`Could not ${action.replace('_', ' ')} — try again`, ...prev].slice(0, 12))
    } finally {
      setControlling(null)
    }
  }

  const copyCode = async () => {
    if (!competition) return
    try {
      await navigator.clipboard.writeText(competition.code)
      setCopyLabel('Copied!')
      setTimeout(() => setCopyLabel('Copy code'), 1500)
    } catch {
      setCopyLabel(competition.code)
    }
  }

  const switchType = (type: 'mcq' | 'true_false') => {
    setQType(type)
    setQOptions(type === 'true_false' ? TRUE_FALSE_OPTIONS() : BLANK_MCQ_OPTIONS())
  }

  const updateOptionText = (index: number, text: string) => {
    setQOptions((prev) => prev.map((o, i) => (i === index ? { ...o, text } : o)))
  }

  const markCorrect = (index: number) => {
    setQOptions((prev) => prev.map((o, i) => ({ ...o, is_correct: i === index })))
  }

  const addOptionSlot = () => setQOptions((prev) => [...prev, { text: '', is_correct: false }])
  const removeOptionSlot = (index: number) => setQOptions((prev) => prev.filter((_, i) => i !== index))

  const resetBuilder = () => {
    setQText('')
    setQDifficulty(2)
    setQPoints(100)
    setQTimeLimit(30)
    switchType('mcq')
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    setBuilderError(null)

    const trimmedOptions = qOptions.map((o) => ({ ...o, text: o.text.trim() })).filter((o) => o.text)
    if (!qText.trim()) { setBuilderError('Add the question text.'); return }
    if (trimmedOptions.length < 2) { setBuilderError('Add at least two answer options.'); return }
    if (!trimmedOptions.some((o) => o.is_correct)) { setBuilderError('Mark one option as correct.'); return }

    const payload: NewQuestionPayload = {
      text: qText.trim(),
      question_type: qType,
      difficulty: qDifficulty,
      points: qPoints,
      time_limit_seconds: qTimeLimit,
      options: trimmedOptions,
    }

    setSavingQuestion(true)
    try {
      await addCompetitionQuestion(id, payload)
      const qs = await listCompetitionQuestions(id)
      setQuestions(qs)
      resetBuilder()
      setShowBuilder(false)
    } catch {
      setBuilderError('Could not save that question — try again.')
    } finally {
      setSavingQuestion(false)
    }
  }

  if (loading) {
    return <div className="px-6 py-20 text-center text-sm text-ice-dim">Loading…</div>
  }

  if (!competition) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <p className="text-sm text-ice-dim">Couldn't load that competition.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/host')}>Back to host console</Button>
      </div>
    )
  }

  const status = competition.status
  const currentIndex = questions.findIndex((q) => q.is_current)
  const canStart = status === 'draft' || status === 'waiting'
  const canPause = status === 'running'
  const canResume = status === 'paused'
  const canNext = status === 'running' || status === 'paused'
  const canFinish = status !== 'finished' && status !== 'draft'

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <button onClick={() => navigate('/host')} className="mb-2 text-xs font-medium text-ice-dim hover:text-ice">
            ← All competitions
          </button>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-semibold text-ice">{competition.title}</h1>
            <StatusPill label={status} tone={statusToTone(status)} pulse={status === 'running'} />
          </div>
          {competition.description && <p className="mt-2 max-w-xl text-sm text-ice-dim">{competition.description}</p>}
        </div>
        <button
          onClick={copyCode}
          className="rounded-xl border border-ink-line bg-ink-panel px-4 py-3 text-left shadow-panel transition-colors hover:border-signal/40"
        >
          <div className="text-xs text-ice-dim">Room code · {copyLabel}</div>
          <div className="font-mono text-lg tracking-[0.2em] text-signal">{competition.code}</div>
        </button>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2 rounded-2xl border border-ink-line bg-ink-panel p-3 shadow-panel">
        <Button size="sm" onClick={() => runControl('start')} disabled={!canStart} loading={controlling === 'start'}>
          {status === 'paused' ? 'Restart' : 'Start'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => runControl('pause')} disabled={!canPause} loading={controlling === 'pause'}>
          Pause
        </Button>
        <Button size="sm" variant="outline" onClick={() => runControl('resume')} disabled={!canResume} loading={controlling === 'resume'}>
          Resume
        </Button>
        <Button size="sm" variant="outline" onClick={() => runControl('next_question')} disabled={!canNext} loading={controlling === 'next_question'}>
          Next question
        </Button>
        <Button size="sm" variant="danger" onClick={() => runControl('finish')} disabled={!canFinish} loading={controlling === 'finish'}>
          Finish
        </Button>
        <div className="ml-auto flex items-center gap-2 text-xs text-ice-dim">
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-teal' : 'bg-coral'}`} />
          {connected ? 'Live channel connected' : 'Reconnecting…'}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-ink-line bg-ink-panel p-6 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ice">
                Questions {questions.length > 0 && `(${questions.length})`}
              </h2>
              <Button size="sm" onClick={() => setShowBuilder((s) => !s)}>
                {showBuilder ? 'Cancel' : 'Add question'}
              </Button>
            </div>

            {showBuilder && (
              <form onSubmit={handleAddQuestion} className="mb-6 animate-rise space-y-4 rounded-xl border border-ink-line bg-ink p-5">
                {builderError && (
                  <div className="rounded-lg border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">{builderError}</div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {(['mcq', 'true_false'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => switchType(t)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        qType === t ? 'border-signal/60 bg-signal/10 text-signal' : 'border-ink-line text-ice-dim hover:text-ice'
                      }`}
                    >
                      {t === 'mcq' ? 'Multiple choice' : 'True / False'}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ice-dim">Question</label>
                  <textarea
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    rows={2}
                    required
                    className="w-full rounded-lg border border-ink-line bg-ink-panel px-3.5 py-2.5 text-sm text-ice outline-none transition-colors focus:border-signal/60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ice-dim">
                    Answer options — pick the correct one
                  </label>
                  <div className="space-y-2">
                    {qOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => markCorrect(i)}
                          title="Mark as correct"
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-xs font-bold transition-colors ${
                            opt.is_correct ? 'border-teal/60 bg-teal/10 text-teal' : 'border-ink-line text-ice-dim hover:text-ice'
                          }`}
                        >
                          ✓
                        </button>
                        <input
                          value={opt.text}
                          onChange={(e) => updateOptionText(i, e.target.value)}
                          disabled={qType === 'true_false'}
                          placeholder={`Option ${i + 1}`}
                          className="w-full rounded-lg border border-ink-line bg-ink-panel px-3.5 py-2 text-sm text-ice outline-none transition-colors focus:border-signal/60 disabled:opacity-60"
                        />
                        {qType === 'mcq' && qOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOptionSlot(i)}
                            className="shrink-0 rounded-md px-2 py-1 text-xs text-ice-dim hover:text-coral"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {qType === 'mcq' && (
                    <button type="button" onClick={addOptionSlot} className="mt-2 text-xs font-medium text-signal hover:underline">
                      + Add another option
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ice-dim">Difficulty</label>
                    <select
                      value={qDifficulty}
                      onChange={(e) => setQDifficulty(Number(e.target.value))}
                      className="w-full rounded-lg border border-ink-line bg-ink-panel px-3 py-2.5 text-sm text-ice outline-none focus:border-signal/60"
                    >
                      <option value={1}>Easy</option>
                      <option value={2}>Medium</option>
                      <option value={3}>Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ice-dim">Points</label>
                    <input
                      type="number" min={10} step={10}
                      value={qPoints}
                      onChange={(e) => setQPoints(Number(e.target.value))}
                      className="w-full rounded-lg border border-ink-line bg-ink-panel px-3 py-2.5 text-sm text-ice outline-none focus:border-signal/60"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ice-dim">Time limit (s)</label>
                    <input
                      type="number" min={5} step={5}
                      value={qTimeLimit}
                      onChange={(e) => setQTimeLimit(Number(e.target.value))}
                      className="w-full rounded-lg border border-ink-line bg-ink-panel px-3 py-2.5 text-sm text-ice outline-none focus:border-signal/60"
                    />
                  </div>
                </div>

                <Button type="submit" loading={savingQuestion}>Save question</Button>
              </form>
            )}

            {questions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink-line px-4 py-10 text-center text-sm text-ice-dim">
                No questions yet — add one to enable Start.
              </div>
            ) : (
              <ol className="space-y-2">
                {questions.map((cq, i) => (
                  <li
                    key={cq.id}
                    className={`rounded-xl border px-4 py-3 ${
                      cq.is_current ? 'border-signal/50 bg-signal/10' : 'border-ink-line bg-ink'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ice">
                          {i + 1}. {cq.question.text}
                        </p>
                        <p className="mt-0.5 text-xs text-ice-dim">
                          {cq.question.question_type === 'true_false' ? 'True / False' : 'Multiple choice'} · {cq.points} pts · {cq.time_limit_seconds}s
                        </p>
                      </div>
                      {cq.is_current && <StatusPill label="live" tone="live" pulse />}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-ink-line bg-ink-panel p-5 shadow-panel">
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-ice-dim">Leaderboard</h3>
            <Leaderboard rows={leaderboard} />
          </div>

          <div className="rounded-2xl border border-ink-line bg-ink-panel p-5 shadow-panel">
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-ice-dim">Live activity</h3>
            {activity.length === 0 ? (
              <p className="text-sm text-ice-dim">Events will show up here once teams start playing.</p>
            ) : (
              <ul className="space-y-2 text-sm text-ice-dim">
                {activity.map((line, i) => (
                  <li key={i} className="animate-rise border-b border-ink-line/60 pb-2 last:border-0">{line}</li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
