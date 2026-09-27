import React from 'react'
import clsx from 'clsx'

export default function Timer({ secondsLeft, totalSeconds }: { secondsLeft: number; totalSeconds: number }) {
  const clamped = Math.max(0, Math.min(secondsLeft, totalSeconds))
  const fraction = totalSeconds > 0 ? clamped / totalSeconds : 0
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - fraction)
  const urgent = clamped <= 5 && clamped > 0

  return (
    <div className="relative flex h-16 w-16 items-center justify-center shrink-0">
      <svg viewBox="0 0 60 60" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="30" cy="30" r={radius} fill="none" stroke="#1B2743" strokeWidth="5" />
        <circle
          cx="30" cy="30" r={radius} fill="none"
          stroke={urgent ? '#FB5D5D' : '#FFB020'}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 ease-linear"
        />
      </svg>
      <span className={clsx(
        'font-mono tabular text-lg font-semibold',
        urgent ? 'text-coral' : 'text-ice'
      )}>
        {clamped}
      </span>
    </div>
  )
}
