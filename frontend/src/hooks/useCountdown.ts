import { useEffect, useState } from 'react'

/**
 * Ticks down from `totalSeconds`, anchored to `startedAt` (an ISO timestamp
 * from the server) rather than the moment the component mounted, so a page
 * refresh or reconnect resumes at the correct remaining time.
 */
export default function useCountdown(startedAt: string | null, totalSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)

  useEffect(() => {
    if (!startedAt || !totalSeconds) {
      setSecondsLeft(totalSeconds)
      return
    }

    const startMs = new Date(startedAt).getTime()

    const tick = () => {
      const elapsed = (Date.now() - startMs) / 1000
      const remaining = Math.max(0, Math.ceil(totalSeconds - elapsed))
      setSecondsLeft(remaining)
    }

    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [startedAt, totalSeconds])

  return secondsLeft
}
