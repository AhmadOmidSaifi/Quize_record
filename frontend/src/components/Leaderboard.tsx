import React from 'react'
import clsx from 'clsx'
import { LeaderboardRow } from '../api/types'

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function Leaderboard({
  rows,
  highlightTeamId,
  emptyLabel = 'No teams have scored yet',
}: {
  rows: LeaderboardRow[]
  highlightTeamId?: number | null
  emptyLabel?: string
}) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-ink-line px-4 py-8 text-center text-sm text-ice-dim">
        {emptyLabel}
      </div>
    )
  }

  return (
    <ol className="space-y-1.5">
      {rows.map((row) => {
        const isYou = highlightTeamId != null && row.team_id === highlightTeamId
        return (
          <li
            key={row.team_id}
            className={clsx(
              'flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
              isYou
                ? 'border-signal/50 bg-signal/10'
                : 'border-transparent bg-ink-raised/60'
            )}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink text-sm font-mono tabular text-ice-dim">
              {MEDALS[row.rank] || row.rank}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ice">
                {row.team_name}{isYou && <span className="ml-1.5 text-xs font-medium text-signal">you</span>}
              </div>
              <div className="text-xs text-ice-dim">
                {row.correct_count} correct · {Math.round(row.average_response_ms)}ms avg
              </div>
            </div>
            <div className="font-mono tabular text-base font-semibold text-signal">
              {row.total_points}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
