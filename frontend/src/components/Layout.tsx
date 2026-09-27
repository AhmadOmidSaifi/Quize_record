import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Mark() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-signal font-display text-sm font-bold text-ink">
      A
    </span>
  )
}

export default function Layout({ children, bare = false }: { children: React.ReactNode; bare?: boolean }) {
  const { isAuthenticated, username, logout } = useAuth()
  const navigate = useNavigate()

  if (bare) {
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-line/70 bg-ink/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <Mark />
            <span className="font-display text-lg font-semibold tracking-tight text-ice">Arena</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/join" className="rounded-md px-3 py-2 font-medium text-ice-dim transition-colors hover:text-ice">
              Join a game
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/host" className="rounded-md px-3 py-2 font-medium text-ice-dim transition-colors hover:text-ice">
                  Host console
                </Link>
                <span className="hidden pl-2 text-ice-dim sm:inline">{username}</span>
                <button
                  onClick={() => { logout(); navigate('/') }}
                  className="rounded-md border border-ink-line px-3 py-2 font-medium text-ice-dim transition-colors hover:border-coral/50 hover:text-coral"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-md border border-ink-line px-3 py-2 font-medium text-ice transition-colors hover:border-signal/50 hover:text-signal"
              >
                Host sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-ink-line/70 px-6 py-6 text-center text-xs text-ice-dim">
        Arena — live team competitions, built on Django &amp; React.
      </footer>
    </div>
  )
}
