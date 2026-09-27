import { useEffect, useRef, useState, useCallback } from 'react'
import { getWsUrl } from '../api/client'

type MessageHandler = (msg: any) => void

export default function useCompetitionSocket(code: string | null, onMessage?: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null)
  const handlerRef = useRef<MessageHandler | undefined>(onMessage)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closedByUs = useRef(false)
  const [connected, setConnected] = useState(false)

  handlerRef.current = onMessage

  useEffect(() => {
    if (!code) return
    closedByUs.current = false

    const connect = () => {
      const url = getWsUrl(code)
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.addEventListener('open', () => setConnected(true))

      ws.addEventListener('message', (ev) => {
        try {
          const data = JSON.parse(ev.data)
          handlerRef.current?.(data)
        } catch {
          // ignore malformed frames
        }
      })

      ws.addEventListener('close', () => {
        setConnected(false)
        if (!closedByUs.current) {
          reconnectTimer.current = setTimeout(connect, 1500)
        }
      })

      ws.addEventListener('error', () => {
        ws.close()
      })
    }

    connect()

    return () => {
      closedByUs.current = true
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      try { wsRef.current?.close() } catch { /* noop */ }
    }
  }, [code])

  const send = useCallback((payload: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false
    wsRef.current.send(JSON.stringify(payload))
    return true
  }, [])

  return { connected, send }
}
