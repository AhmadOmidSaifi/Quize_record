import React from 'react'
import clsx from 'clsx'

type Tone = 'idle' | 'live' | 'paused' | 'done' | 'danger'

const TONE_STYLES: Record<Tone, string> = {
  idle: 'bg-ink-raised text-ice-dim border-ink-line',
  live: 'bg-signal/10 text-signal border-signal/40',
  paused: 'bg-ice-dim/10 text-ice-dim border-ice-dim/30',
  done: 'bg-teal/10 text-teal border-teal/40',
  danger: 'bg-coral/10 text-coral border-coral/40',
}

export function statusToTone(status: string): Tone {
  switch (status) {
    case 'running': return 'live'
    case 'paused': return 'paused'
    case 'finished': return 'done'
    default: return 'idle'
  }
}

export default function StatusPill({ label, tone = 'idle', pulse = false }: { label: string; tone?: Tone; pulse?: boolean }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
      TONE_STYLES[tone]
    )}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', {
        'bg-signal': tone === 'live',
        'bg-ice-dim': tone === 'idle' || tone === 'paused',
        'bg-teal': tone === 'done',
        'bg-coral': tone === 'danger',
        'animate-pulseRing': pulse,
      })} />
      {label}
    </span>
  )
}
