export interface TeamSession {
  competitionId: number
  competitionTitle: string
  teamId: number
  teamName: string
}

const keyFor = (code: string) => `arena_session_${code.toUpperCase()}`

export const saveTeamSession = (code: string, session: TeamSession) => {
  localStorage.setItem(keyFor(code), JSON.stringify(session))
}

export const loadTeamSession = (code: string): TeamSession | null => {
  const raw = localStorage.getItem(keyFor(code))
  if (!raw) return null
  try { return JSON.parse(raw) as TeamSession } catch { return null }
}

export const clearTeamSession = (code: string) => {
  localStorage.removeItem(keyFor(code))
}
