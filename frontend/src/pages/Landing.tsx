import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'

const DEMO_ROWS = [
  { name: 'Nebula Nine', points: 1240 },
  { name: 'Quiet Storm', points: 1180 },
  { name: 'Byte Force', points: 1065 },
  { name: 'The Answer Key', points: 940 },
]

function DemoScoreboard() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2200)
    return () => clearInterval(id)
  }, [])

  const rows = [...DEMO_ROWS]
    .map((r, i) => ({ ...r, points: r.points + (tick % (i + 2)) * 15 }))
    .sort((a, b) => b.points - a.points)

  return (
    <div className="w-full rounded-2xl border border-ink-line bg-ink-panel p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulseRing rounded-full bg-signal" />
          <span className="text-xs font-semibold uppercase tracking-wide text-signal">Live · Q7 of 12</span>
        </div>
        <span className="font-mono tabular text-sm text-ice-dim">00:14</span>
      </div>
      <ol className="space-y-2">
        {rows.map((r, i) => (
          <li key={r.name} className="flex items-center justify-between rounded-lg bg-ink-raised/70 px-3 py-2.5">
            <div className="flex items-center gap-3">
              <span className="w-4 font-mono tabular text-sm text-ice-dim">{i + 1}</span>
              <span className="text-sm font-medium text-ice">{r.name}</span>
            </div>
            <span className="font-mono tabular text-sm font-semibold text-signal">{r.points}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function Landing() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-medium text-ice-dim">Team-based live quizzing</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1] text-ice sm:text-5xl">
            Compete in real time.
            <br />
            Every second on the clock.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ice-dim">
            Enter a room code, form your team, and race the clock against everyone
            else in the competition. Scores update live, the moment an answer lands.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/join">
              <Button size="lg">Join with a code</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">Host a competition</Button>
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-ink-line pt-6 text-sm">
            <div>
              <div className="font-mono tabular text-xl font-semibold text-ice">&lt;1s</div>
              <div className="text-ice-dim">score latency</div>
            </div>
            <div>
              <div className="font-mono tabular text-xl font-semibold text-ice">∞</div>
              <div className="text-ice-dim">teams per room</div>
            </div>
            <div>
              <div className="font-mono tabular text-xl font-semibold text-ice">2</div>
              <div className="text-ice-dim">question types</div>
            </div>
          </div>
        </div>
        <DemoScoreboard />
      </div>
    </div>
  )
}
